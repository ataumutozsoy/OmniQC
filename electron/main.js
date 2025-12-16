import { app, BrowserWindow, ipcMain } from 'electron'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow

// Determine if we're in production
const isDev = process.env.NODE_ENV === 'development'

// Get the path to Python scripts/executables
function getPythonPaths() {
    if (isDev) {
        // Development: use python command and script files
        return {
            pythonCmd: 'python',
            databaseScript: path.join(__dirname, '../python/database.py'),
            parserScript: path.join(__dirname, '../python/fastq_parser.py'),
            useExe: false
        }
    } else {
        // Production: use bundled executables from extraResources
        const resourcePath = process.resourcesPath
        return {
            pythonCmd: null, // Not needed for exe
            databaseExe: path.join(resourcePath, 'python', 'database.exe'),
            parserExe: path.join(resourcePath, 'python', 'fastq_parser.exe'),
            useExe: true
        }
    }
}

const pythonPaths = getPythonPaths()

// Helper to run Python DB script
function runDbOp(args) {
    return new Promise((resolve, reject) => {
        let pythonProcess

        if (pythonPaths.useExe) {
            // Production: run exe directly
            pythonProcess = spawn(pythonPaths.databaseExe, args)
        } else {
            // Development: run python script
            pythonProcess = spawn(pythonPaths.pythonCmd, [pythonPaths.databaseScript, ...args])
        }

        let dataString = ''
        let errorString = ''

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString()
        })

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString()
        })

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`DB Process exited with code ${code}: ${errorString}`)
                reject(new Error(`DB Process failed: ${errorString}`))
                return
            }
            try {
                const result = JSON.parse(dataString)
                resolve(result)
            } catch (e) {
                console.error("Failed to parse DB output:", dataString)
                reject(new Error("Invalid JSON from DB script"))
            }
        })
    })
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, '../src/assets/icons/omniqc_logo.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        autoHideMenuBar: true,
        show: false, // Don't show until ready
    })

    const startUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`

    mainWindow.loadURL(startUrl)

    // Show window only after content is loaded
    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize()
        mainWindow.show()
    })

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools()
    }

    mainWindow.on('closed', function () {
        mainWindow = null
    })
}

app.whenReady().then(() => {
    // Initialize DB
    runDbOp(['init']).then(res => console.log("DB Init:", res)).catch(err => console.error("DB Init Failed:", err))

    createWindow()

    app.on('activate', function () {
        if (mainWindow === null) createWindow()
    })

    // Analysis Handler
    ipcMain.handle('analyze-file', async (event, filePath, sampleId) => {
        return new Promise((resolve, reject) => {
            let pythonProcess

            if (pythonPaths.useExe) {
                // Production: run exe directly
                pythonProcess = spawn(pythonPaths.parserExe, [filePath])
            } else {
                // Development: run python script
                pythonProcess = spawn(pythonPaths.pythonCmd, [pythonPaths.parserScript, filePath])
            }

            let dataString = ''

            pythonProcess.stdout.on('data', (data) => {
                const output = data.toString()
                // Handle multiple lines or partial chunks
                const lines = output.split('\n')

                for (const line of lines) {
                    if (line.startsWith('PROGRESS:')) {
                        const progress = parseInt(line.split(':')[1].trim())
                        if (mainWindow) {
                            mainWindow.webContents.send('analysis-progress', { sampleId, progress })
                        }
                    } else if (line.trim()) {
                        dataString += line
                    }
                }
            })

            pythonProcess.stderr.on('data', (data) => {
                console.error(`Python Error: ${data}`)
            })

            pythonProcess.on('close', async (code) => {
                if (code !== 0) {
                    resolve({ status: 'error', message: `Process exited with code ${code}` })
                } else {
                    try {
                        const result = JSON.parse(dataString)

                        // SAVE TO DB (UPDATE SAMPLE)
                        try {
                            const saveRes = await runDbOp(['update_sample',
                                '--sample_id', sampleId.toString(),
                                '--results', JSON.stringify(result)
                            ])

                            if (saveRes.status === 'success') {
                                resolve({ status: 'success', data: saveRes.data })
                            } else {
                                resolve({ status: 'error', message: "Analysis done but DB update failed: " + saveRes.message })
                            }
                        } catch (dbErr) {
                            resolve({ status: 'error', message: "Analysis done but DB update error: " + dbErr.message })
                        }

                    } catch (e) {
                        resolve({ status: 'error', message: 'Failed to parse Python output' })
                    }
                }
            })
        })
    })

    // DB Handlers
    ipcMain.handle('db-get-projects', async () => {
        return await runDbOp(['get_projects'])
    })

    ipcMain.handle('db-create-project', async (event, name) => {
        return await runDbOp(['create_project', '--name', name])
    })

    ipcMain.handle('db-add-sample', async (event, projectId, filename, filepath) => {
        return await runDbOp(['add_sample',
            '--project_id', projectId.toString(),
            '--filename', filename,
            '--filepath', filepath
        ])
    })

    ipcMain.handle('db-delete-project', async (event, projectId) => {
        return await runDbOp(['delete_project', '--project_id', projectId.toString()])
    })

    ipcMain.handle('db-delete-sample', async (event, sampleId) => {
        return await runDbOp(['delete_sample', '--sample_id', sampleId.toString()])
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

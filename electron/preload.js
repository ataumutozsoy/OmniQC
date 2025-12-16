const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getPathForFile: (file) => webUtils.getPathForFile(file),
    analyzeFile: (filePath, sampleId) => ipcRenderer.invoke('analyze-file', filePath, sampleId),
    getProjects: () => ipcRenderer.invoke('db-get-projects'),
    createProject: (name) => ipcRenderer.invoke('db-create-project', name),
    addSample: (projectId, filename, filepath) => ipcRenderer.invoke('db-add-sample', projectId, filename, filepath),
    deleteProject: (projectId) => ipcRenderer.invoke('db-delete-project', projectId),
    deleteSample: (sampleId) => ipcRenderer.invoke('db-delete-sample', sampleId),
    onAnalysisProgress: (callback) => {
        const subscription = (event, value) => callback(value)
        ipcRenderer.on('analysis-progress', subscription)
        return () => ipcRenderer.removeListener('analysis-progress', subscription)
    }
})

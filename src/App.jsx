import React, { useState } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProjectView from './components/ProjectView'
import Modal from './components/Modal'
import Settings from './components/Settings'
import Help from './components/Help'
import Reports from './components/Reports'
import { X, FolderOpen, FileText, BarChart3 } from 'lucide-react'

function App() {
    const [view, setView] = useState('list') // 'list' | 'results'
    const [activeSidebarTab, setActiveSidebarTab] = useState('explorer')
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [selectedSample, setSelectedSample] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')

    const [isUploadConfirmationOpen, setIsUploadConfirmationOpen] = useState(false)
    const [pendingUploadFiles, setPendingUploadFiles] = useState([])
    const [analysisProgress, setAnalysisProgress] = useState({}) // { sampleId: percentage }
    const [isHelpOpen, setIsHelpOpen] = useState(false)

    // Load projects on mount
    React.useEffect(() => {
        loadProjects()

        // Listen for analysis progress
        const removeListener = window.electronAPI.onAnalysisProgress((data) => {
            setAnalysisProgress(prev => ({
                ...prev,
                [data.sampleId]: data.progress
            }))
        })

        return () => {
            if (removeListener) removeListener()
        }
    }, [])

    const loadProjects = async () => {
        try {
            const res = await window.electronAPI.getProjects()
            if (res.status === 'success') {
                setProjects(res.data)
                // If a project is selected, refresh its data
                if (selectedProject) {
                    const updatedProject = res.data.find(p => p.id === selectedProject.id)
                    if (updatedProject) setSelectedProject(updatedProject)
                }
            }
        } catch (err) {
            console.error("Failed to load projects:", err)
        }
    }

    // Ref for input focus
    const projectNameInputRef = React.useRef(null)

    // Focus input when modal opens
    React.useEffect(() => {
        if (isCreateModalOpen) {
            // First, blur any currently focused element to release keyboard capture
            if (document.activeElement) {
                document.activeElement.blur()
            }

            // Use longer timeout and multiple attempts to ensure focus
            const timer = setTimeout(() => {
                if (projectNameInputRef.current) {
                    projectNameInputRef.current.focus()
                    // Click to ensure it's truly focused
                    projectNameInputRef.current.click()
                }
            }, 200)
            return () => clearTimeout(timer)
        }
    }, [isCreateModalOpen])

    const openCreateModal = () => {
        setNewProjectName('')
        setIsCreateModalOpen(true)
    }

    // Check if project name already exists
    const isProjectNameDuplicate = () => {
        return projects.some(p => p.name.toLowerCase().trim() === newProjectName.toLowerCase().trim())
    }

    const handleCreateProject = async (e) => {
        e.preventDefault()
        const trimmedName = newProjectName.trim()

        if (!trimmedName) return

        // Check for duplicate
        if (isProjectNameDuplicate()) {
            alert(`A project named "${trimmedName}" already exists. Please choose a different name.`)
            return
        }

        await window.electronAPI.createProject(trimmedName)
        await loadProjects()
        setIsCreateModalOpen(false)
    }

    const handleProjectSelect = (project) => {
        setSelectedProject(project)
        setView('list')
        setSelectedSample(null)
    }

    const handleSampleSelect = (sample) => {
        setSelectedSample(sample)
        setActiveSidebarTab('analysis')
    }

    const handleBackToList = () => {
        setActiveSidebarTab('explorer')
    }

    const handleFilesSelected = (selectedFiles) => {
        if (!selectedProject) {
            alert("Please select or create a project first!")
            return
        }
        setPendingUploadFiles(selectedFiles)
        setIsUploadConfirmationOpen(true)
    }

    const confirmUpload = async () => {
        setIsUploadConfirmationOpen(false)

        for (const file of pendingUploadFiles) {
            try {
                console.log(`Adding sample ${file.name}...`)
                // Get the correct path using webUtils via preload
                const filePath = window.electronAPI.getPathForFile(file)

                // Just add the sample to DB, don't analyze yet
                const response = await window.electronAPI.addSample(selectedProject.id, file.name, filePath)

                if (response.status === 'success') {
                    console.log("Sample added:", response.data)
                } else {
                    console.error(`Error adding sample ${file.name}:`, response.message)
                }
            } catch (error) {
                console.error(`IPC Error for ${file.name}:`, error)
            }
        }

        // Refresh projects to show new samples
        await loadProjects()
        setPendingUploadFiles([])
    }

    const handleAnalyzeSample = async (sample) => {
        // Set initial progress
        setAnalysisProgress(prev => ({ ...prev, [sample.id]: 0 }))

        try {
            console.log(`Analyzing sample ${sample.filename}...`)
            const response = await window.electronAPI.analyzeFile(sample.filepath, sample.id)

            if (response.status === 'success') {
                await loadProjects()
                // Clear progress on success
                setAnalysisProgress(prev => {
                    const newState = { ...prev }
                    delete newState[sample.id]
                    return newState
                })

                // Only auto-switch if we analyzed a single sample manually
                if (!isAnalyzing) { // Simple check, might need refinement for batch
                    setSelectedSample(response.data)
                    setActiveSidebarTab('analysis')
                }
            } else {
                console.error("Analysis failed:", response.message)
                alert("Analysis failed: " + response.message)
                setAnalysisProgress(prev => {
                    const newState = { ...prev }
                    delete newState[sample.id]
                    return newState
                })
            }
        } catch (err) {
            console.error("Analysis error:", err)
            alert("Analysis error occurred")
            setAnalysisProgress(prev => {
                const newState = { ...prev }
                delete newState[sample.id]
                return newState
            })
        }
    }

    const handleAnalyzeAll = async () => {
        if (!selectedProject || !selectedProject.samples) return

        const pendingSamples = selectedProject.samples.filter(s => !s.analysis_results)
        if (pendingSamples.length === 0) {
            alert("No pending samples to analyze.")
            return
        }

        // Copy the array to avoid issues with state updates
        const samplesToAnalyze = [...pendingSamples]

        console.log(`Starting batch analysis of ${samplesToAnalyze.length} samples...`)
        setIsAnalyzing(true)

        // Process sequentially
        for (let i = 0; i < samplesToAnalyze.length; i++) {
            const sample = samplesToAnalyze[i]
            console.log(`Analyzing sample ${i + 1}/${samplesToAnalyze.length}: ${sample.filename}`)

            try {
                // Set progress for this sample
                setAnalysisProgress(prev => ({ ...prev, [sample.id]: 0 }))

                const response = await window.electronAPI.analyzeFile(sample.filepath, sample.id)

                if (response.status === 'success') {
                    // Clear progress for this sample
                    setAnalysisProgress(prev => {
                        const newState = { ...prev }
                        delete newState[sample.id]
                        return newState
                    })
                    console.log(`Completed: ${sample.filename}`)

                    // Refresh projects immediately to update status
                    await loadProjects()
                } else {
                    console.error(`Failed: ${sample.filename} - ${response.message}`)
                    setAnalysisProgress(prev => {
                        const newState = { ...prev }
                        delete newState[sample.id]
                        return newState
                    })
                }
            } catch (err) {
                console.error(`Error analyzing ${sample.filename}:`, err)
                setAnalysisProgress(prev => {
                    const newState = { ...prev }
                    delete newState[sample.id]
                    return newState
                })
            }
        }

        setIsAnalyzing(false)
        alert(`Batch analysis complete! Processed ${samplesToAnalyze.length} samples.`)
    }

    const handleDeleteProject = async (projectId) => {
        if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            try {
                const res = await window.electronAPI.deleteProject(projectId)
                if (res.status === 'success') {
                    if (selectedProject && selectedProject.id === projectId) {
                        setSelectedProject(null)
                        setView('list')
                    }
                    await loadProjects()
                } else {
                    alert("Failed to delete project: " + res.message)
                }
            } catch (err) {
                console.error("Delete project error:", err)
                alert("Error deleting project")
            }
        }
    }

    const handleDeleteSample = async (sample) => {
        if (confirm(`Are you sure you want to delete sample "${sample.filename}"?`)) {
            try {
                const res = await window.electronAPI.deleteSample(sample.id)
                if (res.status === 'success') {
                    if (selectedSample && selectedSample.id === sample.id) {
                        setSelectedSample(null)
                        if (activeSidebarTab === 'analysis') {
                            setActiveSidebarTab('explorer')
                        }
                    }
                    await loadProjects()
                } else {
                    alert("Failed to delete sample: " + res.message)
                }
            }
            catch (err) {
                console.error("Delete sample error:", err)
                alert("Error deleting sample")
            }
        }
    }

    return (
        <Layout
            projects={projects}
            onSelectProject={handleProjectSelect}
            onSelectSample={handleSampleSelect}
            onCreateProject={openCreateModal}
            onDeleteProject={handleDeleteProject}
            activeTab={activeSidebarTab}
            setActiveTab={setActiveSidebarTab}
            onRunAnalysis={handleAnalyzeAll}
            onExportReport={() => {
                if (!selectedProject) {
                    alert("Please select a project first")
                    return
                }
                setActiveSidebarTab('reports')
            }}
            onOpenHelp={() => setIsHelpOpen(true)}
            isAnalyzing={isAnalyzing}
        >
            {activeSidebarTab === 'explorer' && (
                <div className="h-full flex flex-col">
                    {selectedProject ? (
                        <div className="flex-1 overflow-hidden flex flex-col bg-white">
                            <ProjectView
                                project={selectedProject}
                                onFilesSelected={handleFilesSelected}
                                onSelectSample={handleSampleSelect}
                                onAnalyzeSample={handleAnalyzeSample}
                                onDeleteSample={handleDeleteSample}
                                analysisProgress={analysisProgress}
                                onAnalyzeAll={handleAnalyzeAll}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 select-none">
                            <div className="mb-4 p-4 bg-slate-50 rounded-full border border-slate-200">
                                <FolderOpen size={48} className="text-slate-300" />
                            </div>
                            <p className="font-medium text-slate-500">No Project Selected</p>
                            <p className="text-xs mt-1 text-slate-400">Select or create a project from the sidebar to start.</p>
                        </div>
                    )}
                </div>
            )}

            {activeSidebarTab === 'analysis' && (
                <div className="h-full flex flex-col bg-slate-50">
                    {selectedSample ? (
                        <div className="flex flex-col h-full p-6 overflow-hidden">
                            <div className="mb-6 flex items-center gap-3">
                                <button
                                    onClick={handleBackToList}
                                    className="text-sm font-medium text-slate-500 hover:text-brand flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-slate-200"
                                >
                                    &larr; Back to Project
                                </button>
                                <div className="h-4 w-px bg-slate-300"></div>
                                <span className="text-lg font-bold text-slate-800">{selectedSample.filename}</span>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <Dashboard sampleData={selectedSample} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 select-none">
                            <div className="mb-4 p-4 bg-slate-100 rounded-full border border-slate-200">
                                <FolderOpen size={48} className="text-slate-300" />
                            </div>
                            <p className="font-medium text-slate-500">No Sample Selected</p>
                            <p className="text-xs mt-1 text-slate-400">Select a sample from the Explorer to view analysis.</p>
                            <button
                                onClick={() => setActiveSidebarTab('explorer')}
                                className="mt-4 px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark transition-colors"
                            >
                                Go to Explorer
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeSidebarTab === 'settings' && (
                <div className="h-full overflow-auto p-6 bg-slate-50">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
                        <p className="text-sm text-slate-500 mt-1">Configure OmniQC preferences</p>
                    </div>
                    <Settings />
                </div>
            )}


            {activeSidebarTab === 'reports' && (
                <Reports
                    projects={projects}
                    onSelectSample={handleSampleSelect}
                    onSelectProject={handleProjectSelect}
                    setActiveTab={setActiveSidebarTab}
                />
            )}

            {/* Create Project Modal */}
            <Modal
                key={isCreateModalOpen ? 'create-modal-open' : 'create-modal-closed'}
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Project"
            >
                <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                        <input
                            ref={projectNameInputRef}
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="e.g., Experiment Alpha"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${isProjectNameDuplicate() ? 'border-red-400' : 'border-slate-300'
                                }`}
                        />
                        {isProjectNameDuplicate() && (
                            <p className="text-red-500 text-xs mt-1">A project with this name already exists</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!newProjectName.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Project
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Upload Confirmation Modal */}
            <Modal
                isOpen={isUploadConfirmationOpen}
                onClose={() => setIsUploadConfirmationOpen(false)}
                title="Confirm Upload"
            >
                <div className="flex flex-col gap-4">
                    <p className="text-slate-600">
                        Are you sure you want to add the following <strong>{pendingUploadFiles.length}</strong> samples to <strong>{selectedProject?.name}</strong>?
                    </p>

                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => setIsUploadConfirmationOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmUpload}
                            className="px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-dark rounded-lg transition-colors"
                        >
                            Confirm & Upload
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Help Modal */}
            <Help isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </Layout>
    )
}

export default App

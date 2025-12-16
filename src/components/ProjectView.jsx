import React, { useState } from 'react'
import { Upload, List, FileText } from 'lucide-react'
import DropZone from './DropZone'
import SampleList from './SampleList'

const ProjectView = ({ project, onFilesSelected, onSelectSample, onAnalyzeSample, onDeleteSample, analysisProgress, onAnalyzeAll }) => {
    const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'list'

    if (!project) return null

    // Auto-switch to list if there are samples and we are in default state?
    // For now, let's stick to user selection or default to 'upload' as it's the first action usually.
    // Actually, if there are samples, 'list' might be a better default.
    // Let's keep 'upload' as default for empty projects, 'list' for populated ones?
    // React.useEffect(() => {
    //     if (project.samples && project.samples.length > 0) {
    //         setActiveTab('list')
    //     }
    // }, [project.id]) 
    // The above effect might be annoying if user wants to upload more. Let's keep simple state.

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Project Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <h2 className="text-2xl font-bold text-slate-800">{project.name}</h2>
                <p className="text-sm text-slate-500 mt-1">Created on {new Date(project.created_at).toLocaleDateString()}</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6">
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'upload'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                >
                    <Upload size={16} />
                    Upload Samples
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'list'
                        ? 'border-brand text-brand'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                >
                    <List size={16} />
                    Sample List
                    <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                        {project.samples ? project.samples.length : 0}
                    </span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-6">
                {activeTab === 'upload' && (
                    <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto">
                        <div className="w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Upload New Samples</h3>
                            <p className="text-slate-500 mb-6 text-sm">Select FASTQ files to add to this project. Analysis will start automatically.</p>
                            <DropZone onFilesSelected={onFilesSelected} id="project-upload-dropzone" />
                        </div>
                    </div>
                )}

                {activeTab === 'list' && (
                    <SampleList
                        project={project}
                        onSelectSample={onSelectSample}
                        onAnalyzeSample={onAnalyzeSample}
                        onDeleteSample={onDeleteSample}
                        onAddSample={() => setActiveTab('upload')}
                        analysisProgress={analysisProgress}
                        onAnalyzeAll={onAnalyzeAll}
                    />
                )}
            </div>
        </div>
    )
}

export default ProjectView

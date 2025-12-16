import React, { useState } from 'react'
import { Folder, FileText, ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react'

const ProjectTree = ({ projects, onSelectProject, onSelectSample, onCreateProject, onDeleteProject }) => {
    // projects prop is now passed from App.jsx

    const [expandedProjects, setExpandedProjects] = useState({})

    const toggleProject = (projectId) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }))
    }

    const handleProjectClick = (project) => {
        if (onSelectProject) onSelectProject(project)
        toggleProject(project.id)
    }

    const handleDeleteClick = (e, projectId) => {
        e.stopPropagation()
        if (onDeleteProject) onDeleteProject(projectId)
    }

    const handleSampleClick = (e, sample, project) => {
        e.stopPropagation()
        if (onSelectProject) onSelectProject(project) // Ensure project is selected too
        if (onSelectSample) onSelectSample(sample)
    }

    return (
        <div className="w-64 bg-slate-50 border-r border-slate-300 flex flex-col h-full">
            <div className="p-2 border-b border-slate-300 flex justify-between items-center bg-slate-100">
                <span className="text-xs font-bold text-slate-600 uppercase">Explorer</span>
                <button
                    className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    onClick={onCreateProject}
                    title="Create New Project"
                >
                    <Plus size={14} />
                </button>
            </div>
            <div className="flex-1 overflow-auto p-2">
                {projects.map(project => (
                    <div key={project.id} className="mb-1 group">
                        <div
                            className="flex items-center gap-1 p-1 hover:bg-slate-200 rounded cursor-pointer text-sm text-slate-700 select-none justify-between"
                            onClick={() => handleProjectClick(project)}
                        >
                            <div className="flex items-center gap-1 overflow-hidden">
                                {expandedProjects[project.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <Folder size={14} className="text-sky-600 flex-shrink-0" />
                                <span className="font-medium truncate">{project.name}</span>
                            </div>
                            <button
                                onClick={(e) => handleDeleteClick(e, project.id)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete Project"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>

                        {expandedProjects[project.id] && (
                            <div className="ml-4 border-l border-slate-300 pl-1 mt-1 space-y-0.5">
                                {project.samples.length > 0 ? (
                                    project.samples.map(sample => (
                                        <div
                                            key={sample.id}
                                            className="flex items-center gap-2 p-1 hover:bg-sky-100 hover:text-sky-700 rounded cursor-pointer text-xs text-slate-600"
                                            onClick={(e) => handleSampleClick(e, sample, project)}
                                        >
                                            <FileText size={12} />
                                            <span className="truncate">{sample.filename}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[10px] text-slate-400 italic pl-2 py-1">No samples</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ProjectTree

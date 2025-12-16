import React from 'react'
import Toolbar from './Toolbar'
import ProjectTree from './ProjectTree'
import Sidebar from './Sidebar'

const Layout = ({
    children,
    projects,
    onSelectProject,
    onSelectSample,
    onCreateProject,
    onDeleteProject,
    activeTab,
    setActiveTab,
    // Toolbar props
    onRunAnalysis,
    onExportReport,
    onOpenHelp,
    isAnalyzing
}) => {
    return (
        <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
            {/* Sidebar */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <Toolbar
                    onOpenProject={onCreateProject}
                    onRunAnalysis={onRunAnalysis}
                    onExportReport={onExportReport}
                    onOpenSettings={() => setActiveTab('settings')}
                    onOpenHelp={onOpenHelp}
                    isAnalyzing={isAnalyzing}
                />

                <div className="flex-1 flex overflow-hidden">
                    {/* Project Tree */}
                    <ProjectTree
                        projects={projects}
                        onSelectProject={onSelectProject}
                        onSelectSample={onSelectSample}
                        onCreateProject={onCreateProject}
                        onDeleteProject={onDeleteProject}
                    />
                    <main className="flex-1 overflow-hidden relative bg-slate-100 p-1">
                        <div className="h-full bg-white border border-slate-300 shadow-sm rounded-sm overflow-auto">
                            {children}
                        </div>
                    </main>
                </div>
                <div className="h-6 bg-brand text-white text-[10px] flex items-center px-2 justify-between">
                    <span>Ready</span>
                    <span>OmniQC v1.0</span>
                </div>
            </div>
        </div>
    )
}

export default Layout


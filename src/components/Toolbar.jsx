import React, { useState } from 'react'
import { FolderOpen, Save, Play, FileText, HelpCircle, Settings, Search, RefreshCw } from 'lucide-react'

const Toolbar = ({ onOpenProject, onSave, onRunAnalysis, onExportReport, onOpenSettings, onOpenHelp, onSearch, isAnalyzing }) => {
    const [searchTerm, setSearchTerm] = useState('')

    const handleSearch = (e) => {
        setSearchTerm(e.target.value)
        if (onSearch) onSearch(e.target.value)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch(searchTerm)
        }
    }

    return (
        <div className="h-14 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200 flex items-center px-3 shadow-sm">
            {/* Tool Buttons */}
            <div className="flex items-center gap-0.5">
                {/* New Project */}
                <button
                    onClick={onOpenProject}
                    className="flex flex-col items-center justify-center px-3 py-1.5 rounded hover:bg-sky-50 border border-transparent hover:border-sky-200 transition-all group"
                    title="New Project"
                >
                    <FolderOpen size={18} className="mb-0.5 text-slate-500 group-hover:text-sky-600" />
                    <span className="text-[10px] text-slate-500 group-hover:text-sky-700 font-medium">New Project</span>
                </button>

                {/* Export Report */}
                <button
                    onClick={onExportReport}
                    className="flex flex-col items-center justify-center px-3 py-1.5 rounded hover:bg-sky-50 border border-transparent hover:border-sky-200 transition-all group"
                    title="Export Report"
                >
                    <FileText size={18} className="mb-0.5 text-slate-500 group-hover:text-sky-600" />
                    <span className="text-[10px] text-slate-500 group-hover:text-sky-700 font-medium">Export Report</span>
                </button>

                {/* Separator */}
                <div className="w-px h-9 bg-slate-200 mx-2"></div>

                {/* Configuration */}


                {/* Help */}
                <button
                    onClick={onOpenHelp}
                    className="flex flex-col items-center justify-center px-3 py-1.5 rounded hover:bg-sky-50 border border-transparent hover:border-sky-200 transition-all group"
                    title="Help"
                >
                    <HelpCircle size={18} className="mb-0.5 text-slate-500 group-hover:text-sky-600" />
                    <span className="text-[10px] text-slate-500 group-hover:text-sky-700 font-medium">Help</span>
                </button>
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Search */}

        </div>
    )
}

export default Toolbar


import React from 'react'
import { Compass, Activity, Settings, FileText } from 'lucide-react'
import logo from '../assets/icons/omniqc_logo.png'

const Sidebar = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'explorer', icon: Compass, label: 'Explorer' },
        { id: 'analysis', icon: Activity, label: 'Analysis' },
        { id: 'reports', icon: FileText, label: 'Reports' },
    ]

    return (
        <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col h-full items-center py-4 shadow-xl z-20">
            <div className="mb-8 p-1  rounded-xl shadow-lg shadow-sky-900/20">
                <img src={logo} alt="OmniQC" className="w-10 h-10 object-contain" />
            </div>

            <nav className="flex-1 w-full px-2 space-y-4">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            title={item.label}
                            className={`w-full aspect-square flex items-center justify-center rounded-xl transition-all duration-200 group relative ${isActive
                                ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-sky-400'
                                }`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />

                            {/* Tooltip */}
                            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700 shadow-xl">
                                {item.label}
                            </div>
                        </button>
                    )
                })}
            </nav>

            <div className="mt-auto pb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="System Ready"></div>
            </div>
        </div>
    )
}

export default Sidebar

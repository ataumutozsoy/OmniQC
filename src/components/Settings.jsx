import React from 'react'
import { Save } from 'lucide-react'

const Settings = () => {
    return (
        <div className="max-w-2xl">
            <div className="bg-white rounded-md p-8 border border-slate-300 shadow-sm space-y-8">

                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">General Configuration</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Output Directory</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    defaultValue="C:\Users\OmniQC\Output"
                                    className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                />
                                <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded border border-slate-300 hover:bg-slate-200 font-medium">
                                    Browse
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="auto-report" className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" defaultChecked />
                            <label htmlFor="auto-report" className="text-sm text-slate-700">Automatically generate PDF reports</label>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Analysis Parameters</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Minimum Quality Score</label>
                            <input
                                type="number"
                                defaultValue="20"
                                className="w-32 bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Adapter Trimming</label>
                            <select className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500">
                                <option>Auto-detect</option>
                                <option>Illumina Universal</option>
                                <option>Nextera</option>
                                <option>None</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex justify-end border-t border-slate-200">
                    <button className="flex items-center gap-2 px-6 py-2 bg-sky-600 text-white font-bold rounded hover:bg-sky-700 transition-colors shadow-sm">
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>

            </div>
        </div>
    )
}

export default Settings

import React, { useState, useMemo } from 'react'
import { FileText, Play, Trash2, Plus, Search, BarChart2, Activity, Dna } from 'lucide-react'

const SampleList = ({ project, onSelectSample, onAnalyzeSample, onAddSample, onDeleteSample, analysisProgress, onAnalyzeAll }) => {
    const [searchTerm, setSearchTerm] = useState('')

    if (!project) return null

    const samples = project.samples || []

    // Filter samples based on search
    const filteredSamples = useMemo(() => {
        return samples.filter(sample =>
            sample.filename.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [samples, searchTerm])

    // Calculate aggregate stats
    const stats = useMemo(() => {
        let totalReads = 0
        let totalBases = 0
        let avgGC = 0
        let analyzedCount = 0

        samples.forEach(s => {
            if (s.analysis_results) {
                // Handle both object and string formats just in case
                const results = typeof s.analysis_results === 'string'
                    ? JSON.parse(s.analysis_results)
                    : s.analysis_results

                if (results) {
                    totalReads += results.total_reads || 0
                    totalBases += results.total_bases || 0
                    avgGC += results.gc_content || 0
                    analyzedCount++
                }
            }
        })

        if (analyzedCount > 0) {
            avgGC = avgGC / analyzedCount
        }

        return { totalReads, totalBases, avgGC }
    }, [samples])

    const formatNumber = (num) => {
        if (num === undefined || num === null) return '0'
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
        return num.toString()
    }

    const pendingCount = samples.filter(s => !s.analysis_results).length

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                {/* Quick Stats Cards */}
                {samples.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Total Samples</p>
                                <p className="text-xl font-bold text-slate-800">{samples.length}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Total Reads</p>
                                <p className="text-xl font-bold text-slate-800">{formatNumber(stats.totalReads)}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                <Dna size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Avg GC Content</p>
                                <p className="text-xl font-bold text-slate-800">{stats.avgGC.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions Bar */}
                {samples.length > 0 && (
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search samples..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                            />
                        </div>
                        {pendingCount > 0 && (
                            <button
                                onClick={onAnalyzeAll}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium whitespace-nowrap"
                            >
                                <Play size={16} />
                                Analyze All ({pendingCount})
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content Section */}
            {samples.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 m-4">
                    <div className="p-6 bg-white rounded-full mb-4 shadow-sm">
                        <FileText size={48} className="text-slate-300" />
                    </div>
                    <p className="text-lg font-medium text-slate-600">No samples yet</p>
                    <p className="text-sm mb-6">Go to the Upload tab to add samples</p>
                    <button
                        onClick={onAddSample}
                        className="text-brand hover:text-brand-dark font-medium flex items-center gap-2 hover:underline"
                    >
                        <Plus size={16} />
                        Upload your first sample
                    </button>
                </div>
            ) : (
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4">Filename</th>
                                    <th className="px-6 py-4">Platform</th>
                                    <th className="px-6 py-4">Reads</th>
                                    <th className="px-6 py-4">GC %</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSamples.length > 0 ? (
                                    filteredSamples.map(sample => {
                                        const results = typeof sample.analysis_results === 'string'
                                            ? JSON.parse(sample.analysis_results)
                                            : sample.analysis_results

                                        const progress = analysisProgress ? analysisProgress[sample.id] : undefined
                                        const isAnalyzing = progress !== undefined

                                        return (
                                            <tr key={sample.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 font-medium text-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-slate-100 rounded text-slate-500">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="flex flex-col w-full">
                                                            <span>{sample.filename}</span>
                                                            {isAnalyzing ? (
                                                                <div className="w-full mt-1">
                                                                    <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                                                                        <span>Processing...</span>
                                                                        <span>{progress}%</span>
                                                                    </div>
                                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-brand transition-all duration-300 ease-out"
                                                                            style={{ width: `${progress}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">{new Date(sample.upload_date).toLocaleDateString()}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {results && results.platform ? (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${results.platform === 'Illumina' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            results.platform === 'Nanopore' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                                                results.platform === 'MGI' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                                    results.platform === 'PacBio' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                        'bg-slate-100 text-slate-600 border-slate-200'
                                                            }`}>
                                                            {results.platform}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-mono">
                                                    {results && results.total_reads !== undefined ? formatNumber(results.total_reads) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-mono">
                                                    {results && results.gc_content !== undefined ? `${results.gc_content.toFixed(1)}%` : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isAnalyzing ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 animate-pulse">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                            Running
                                                        </span>
                                                    ) : results ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                            Analyzed
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => results && onSelectSample(sample)}
                                                            disabled={!results || isAnalyzing}
                                                            className={`p-2 rounded-lg transition-colors ${results && !isAnalyzing
                                                                ? 'text-slate-500 hover:text-brand hover:bg-brand-light'
                                                                : 'text-slate-300 cursor-not-allowed'}`}
                                                            title={results ? "View Results" : "Analysis Pending"}
                                                        >
                                                            <BarChart2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => onAnalyzeSample(sample)}
                                                            disabled={isAnalyzing}
                                                            className={`p-2 rounded-lg transition-colors ${isAnalyzing
                                                                ? 'text-slate-300 cursor-not-allowed'
                                                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                            title="Re-run Analysis"
                                                        >
                                                            <Play size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteSample(sample)}
                                                            disabled={isAnalyzing}
                                                            className={`p-2 rounded-lg transition-colors ${isAnalyzing
                                                                ? 'text-slate-300 cursor-not-allowed'
                                                                : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}`}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                            No samples found matching "{searchTerm}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SampleList


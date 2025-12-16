import React, { useState, useMemo } from 'react'
import { FileText, Download, BarChart3, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronRight, Eye, Dna, Activity, TrendingUp, Percent } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { jsPDF } from 'jspdf'

const Reports = ({ projects, onSelectSample, onSelectProject, setActiveTab }) => {
    const [selectedReportProject, setSelectedReportProject] = useState(null)
    const [expandedProjects, setExpandedProjects] = useState({})

    // Get all analyzed samples across all projects
    const allAnalyzedSamples = useMemo(() => {
        const samples = []
        projects.forEach(project => {
            project.samples?.forEach(sample => {
                if (sample.analysis_results) {
                    const results = typeof sample.analysis_results === 'string'
                        ? JSON.parse(sample.analysis_results)
                        : sample.analysis_results
                    samples.push({
                        ...sample,
                        projectName: project.name,
                        projectId: project.id,
                        metrics: results
                    })
                }
            })
        })
        return samples
    }, [projects])

    // Calculate overall stats
    const overallStats = useMemo(() => {
        let pass = 0, warn = 0, fail = 0
        let totalReads = 0, totalBases = 0

        allAnalyzedSamples.forEach(sample => {
            const status = sample.metrics?.quality_status?.overall
            if (status === 'pass') pass++
            else if (status === 'warn') warn++
            else if (status === 'fail') fail++

            totalReads += sample.metrics?.total_reads || 0
            totalBases += sample.metrics?.total_bases || 0
        })

        return { pass, warn, fail, totalReads, totalBases, total: allAnalyzedSamples.length }
    }, [allAnalyzedSamples])

    const toggleProject = (projectId) => {
        setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }))
    }

    const handleViewSample = (sample) => {
        // Find the project and select it
        const project = projects.find(p => p.id === sample.projectId)
        if (project && onSelectProject) onSelectProject(project)
        if (onSelectSample) onSelectSample(sample)
        if (setActiveTab) setActiveTab('analysis')
    }

    // Generate Project PDF Report
    const exportProjectReport = async (project) => {
        const pdf = new jsPDF()
        const pageWidth = pdf.internal.pageSize.getWidth()

        // Header
        pdf.setFillColor(44, 102, 147)
        pdf.rect(0, 0, pageWidth, 35, 'F')

        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(24)
        pdf.setFont('helvetica', 'bold')
        pdf.text('OmniQC Project Report', 14, 20)

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.text(project.name, 14, 30)
        pdf.text(new Date().toLocaleDateString(), pageWidth - 14, 30, { align: 'right' })

        let yPos = 50

        // Summary Stats
        pdf.setTextColor(30, 41, 59)
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Summary Statistics', 14, yPos)
        yPos += 12

        const samples = project.samples?.filter(s => s.analysis_results) || []
        let passCount = 0, warnCount = 0, failCount = 0
        let totalReads = 0, avgQScore = 0, avgGC = 0

        samples.forEach(sample => {
            const results = typeof sample.analysis_results === 'string'
                ? JSON.parse(sample.analysis_results)
                : sample.analysis_results

            const status = results?.quality_status?.overall
            if (status === 'pass') passCount++
            else if (status === 'warn') warnCount++
            else if (status === 'fail') failCount++

            totalReads += results?.total_reads || 0
            avgQScore += results?.avg_q_score || 0
            avgGC += results?.gc_content || 0
        })

        if (samples.length > 0) {
            avgQScore /= samples.length
            avgGC /= samples.length
        }

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')

        const stats = [
            ['Total Samples', samples.length.toString()],
            ['Total Reads', totalReads.toLocaleString()],
            ['Avg Q-Score', avgQScore.toFixed(1)],
            ['Avg GC%', avgGC.toFixed(1) + '%'],
            ['Pass', passCount.toString()],
            ['Warning', warnCount.toString()],
            ['Fail', failCount.toString()]
        ]

        stats.forEach(([label, value], i) => {
            const col = i % 4
            const row = Math.floor(i / 4)
            pdf.setTextColor(100)
            pdf.text(label + ':', 14 + col * 45, yPos + row * 8)
            pdf.setTextColor(30)
            pdf.text(value, 40 + col * 45, yPos + row * 8)
        })

        yPos += 25

        // Samples Table
        pdf.setDrawColor(200)
        pdf.line(14, yPos, pageWidth - 14, yPos)
        yPos += 10

        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(30)
        pdf.text('Sample Details', 14, yPos)
        yPos += 12

        // Table Header
        pdf.setFillColor(241, 245, 249)
        pdf.rect(14, yPos - 5, pageWidth - 28, 10, 'F')

        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(71, 85, 105)
        pdf.text('Sample', 16, yPos)
        pdf.text('Reads', 80, yPos)
        pdf.text('Q-Score', 110, yPos)
        pdf.text('GC%', 135, yPos)
        pdf.text('Status', 160, yPos)
        yPos += 8

        // Table Rows
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(30)

        samples.forEach((sample, idx) => {
            if (yPos > 270) {
                pdf.addPage()
                yPos = 20
            }

            const results = typeof sample.analysis_results === 'string'
                ? JSON.parse(sample.analysis_results)
                : sample.analysis_results

            const status = results?.quality_status?.overall || 'unknown'

            if (idx % 2 === 0) {
                pdf.setFillColor(249, 250, 251)
                pdf.rect(14, yPos - 4, pageWidth - 28, 8, 'F')
            }

            pdf.setFontSize(8)
            const filename = sample.filename.length > 25 ? sample.filename.substring(0, 22) + '...' : sample.filename
            pdf.text(filename, 16, yPos)
            pdf.text((results?.total_reads || 0).toLocaleString(), 80, yPos)
            pdf.text((results?.avg_q_score || 0).toFixed(1), 110, yPos)
            pdf.text((results?.gc_content || 0).toFixed(1) + '%', 135, yPos)

            // Status with color
            if (status === 'pass') pdf.setTextColor(22, 163, 74)
            else if (status === 'warn') pdf.setTextColor(217, 119, 6)
            else if (status === 'fail') pdf.setTextColor(220, 38, 38)
            else pdf.setTextColor(100)

            pdf.text(status.toUpperCase(), 160, yPos)
            pdf.setTextColor(30)

            yPos += 8
        })

        // Footer
        pdf.setFontSize(8)
        pdf.setTextColor(150)
        pdf.text('Generated by OmniQC', 14, 287)
        pdf.text(`Page 1`, pageWidth - 14, 287, { align: 'right' })

        pdf.save(`${project.name}_report.pdf`)
    }

    // Status Badge Component
    const StatusBadge = ({ status, size = 'md' }) => {
        const config = {
            pass: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
            warn: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle },
            fail: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
        }
        const c = config[status] || config.warn
        const Icon = c.icon
        const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

        return (
            <span className={`${c.bg} ${c.text} ${sizeClass} rounded-full font-semibold flex items-center gap-1`}>
                <Icon size={size === 'sm' ? 12 : 14} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        )
    }

    // Pie chart colors
    const COLORS = ['#10b981', '#f59e0b', '#ef4444']

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-slate-400 h-full">
                <FileText size={64} className="text-slate-300 mb-4" />
                <p className="font-medium text-slate-500 text-lg">No projects yet</p>
                <p className="text-sm">Create a project and analyze samples to see reports</p>
            </div>
        )
    }

    return (
        <div className="h-full overflow-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-sky-100 rounded-xl">
                        <BarChart3 size={28} className="text-sky-600" />
                    </div>
                    Reports
                </h2>
                <p className="text-slate-500 mt-2">Quality control summary and analysis reports for your sequencing projects</p>
            </div>

            {/* Global Stats Cards */}
            {overallStats.total > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-sky-50 rounded-lg">
                                <Dna size={20} className="text-sky-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Analyzed Samples</p>
                                <p className="text-2xl font-bold text-slate-800">{overallStats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Activity size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Total Reads</p>
                                <p className="text-2xl font-bold text-slate-800">{(overallStats.totalReads / 1000000).toFixed(1)}M</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/50">
                        <div className="flex items-center gap-3">
                            <CheckCircle size={24} className="text-emerald-500" />
                            <div>
                                <p className="text-xs text-emerald-600 uppercase tracking-wider">Passed</p>
                                <p className="text-2xl font-bold text-emerald-700">{overallStats.pass}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm bg-gradient-to-br from-white to-amber-50/50">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={24} className="text-amber-500" />
                            <div>
                                <p className="text-xs text-amber-600 uppercase tracking-wider">Warnings</p>
                                <p className="text-2xl font-bold text-amber-700">{overallStats.warn}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-red-200 shadow-sm bg-gradient-to-br from-white to-red-50/50">
                        <div className="flex items-center gap-3">
                            <XCircle size={24} className="text-red-500" />
                            <div>
                                <p className="text-xs text-red-600 uppercase tracking-wider">Failed</p>
                                <p className="text-2xl font-bold text-red-700">{overallStats.fail}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Projects List */}
            <div className="space-y-6">
                {projects.map(project => {
                    const analyzedSamples = project.samples?.filter(s => s.analysis_results) || []
                    const isExpanded = expandedProjects[project.id]

                    // Calculate project stats
                    let passCount = 0, warnCount = 0, failCount = 0, totalReads = 0, avgQScore = 0

                    analyzedSamples.forEach(sample => {
                        const results = typeof sample.analysis_results === 'string'
                            ? JSON.parse(sample.analysis_results)
                            : sample.analysis_results

                        const status = results?.quality_status?.overall
                        if (status === 'pass') passCount++
                        else if (status === 'warn') warnCount++
                        else if (status === 'fail') failCount++

                        totalReads += results?.total_reads || 0
                        avgQScore += results?.avg_q_score || 0
                    })

                    if (analyzedSamples.length > 0) avgQScore /= analyzedSamples.length

                    const pieData = [
                        { name: 'Pass', value: passCount },
                        { name: 'Warn', value: warnCount },
                        { name: 'Fail', value: failCount }
                    ].filter(d => d.value > 0)

                    return (
                        <div key={project.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Project Header */}
                            <div
                                className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleProject(project.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <button className="mt-1 text-slate-400 hover:text-slate-600">
                                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </button>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {project.samples?.length || 0} total samples • {analyzedSamples.length} analyzed
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {/* Mini Stats */}
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="text-center">
                                                <p className="text-slate-400 text-xs">Reads</p>
                                                <p className="font-bold text-slate-700">{(totalReads / 1000000).toFixed(2)}M</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-slate-400 text-xs">Avg Q</p>
                                                <p className="font-bold text-slate-700">{avgQScore.toFixed(1)}</p>
                                            </div>
                                        </div>

                                        {/* Mini Pie Chart */}
                                        {pieData.length > 0 && (
                                            <div className="w-16 h-16">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={pieData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={15}
                                                            outerRadius={30}
                                                            dataKey="value"
                                                        >
                                                            {pieData.map((entry, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={entry.name === 'Pass' ? COLORS[0] : entry.name === 'Warn' ? COLORS[1] : COLORS[2]}
                                                                />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Export Button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); exportProjectReport(project) }}
                                            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium"
                                        >
                                            <Download size={16} />
                                            Export PDF
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Sample List */}
                            {isExpanded && analyzedSamples.length > 0 && (
                                <div className="border-t border-slate-100">
                                    <table className="w-full">
                                        <thead className="bg-slate-50">
                                            <tr className="text-xs text-slate-500 uppercase tracking-wider">
                                                <th className="text-left px-6 py-3 font-semibold">Sample</th>
                                                <th className="text-left px-6 py-3 font-semibold">Platform</th>
                                                <th className="text-right px-6 py-3 font-semibold">Reads</th>
                                                <th className="text-right px-6 py-3 font-semibold">Q-Score</th>
                                                <th className="text-right px-6 py-3 font-semibold">GC%</th>
                                                <th className="text-center px-6 py-3 font-semibold">Status</th>
                                                <th className="text-right px-6 py-3 font-semibold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {analyzedSamples.map(sample => {
                                                const results = typeof sample.analysis_results === 'string'
                                                    ? JSON.parse(sample.analysis_results)
                                                    : sample.analysis_results
                                                const status = results?.quality_status?.overall || 'warn'

                                                return (
                                                    <tr key={sample.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className="font-medium text-slate-800">{sample.filename}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600">{results?.platform || '-'}</td>
                                                        <td className="px-6 py-4 text-right font-mono text-slate-700">
                                                            {(results?.total_reads || 0).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono text-slate-700">
                                                            {(results?.avg_q_score || 0).toFixed(1)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono text-slate-700">
                                                            {(results?.gc_content || 0).toFixed(1)}%
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <StatusBadge status={status} size="sm" />
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleViewSample(sample)}
                                                                className="flex items-center gap-1 text-sky-600 hover:text-sky-700 text-sm font-medium ml-auto"
                                                            >
                                                                <Eye size={14} />
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {isExpanded && analyzedSamples.length === 0 && (
                                <div className="p-8 text-center text-slate-400 border-t border-slate-100">
                                    <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                                    <p>No analyzed samples in this project</p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Reports

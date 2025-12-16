import React, { useRef, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { Download, FileText, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const Dashboard = ({ sampleData }) => {
    const dashboardRef = useRef(null)
    const [isExportingPDF, setIsExportingPDF] = useState(false)

    // Export to PDF function - Comprehensive Report
    const exportToPDF = async () => {
        if (!sampleData) return

        setIsExportingPDF(true)

        try {
            // Parse metrics
            let metrics = {}
            if (sampleData.analysis_results) {
                if (typeof sampleData.analysis_results === 'string') {
                    try { metrics = JSON.parse(sampleData.analysis_results) } catch (e) { }
                } else {
                    metrics = sampleData.analysis_results
                }
            } else if (sampleData.total_reads) {
                metrics = sampleData
            }

            const qualityStatus = metrics.quality_status || {}

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            let yPos = 0

            // Helper function to add page break if needed
            const checkPageBreak = (requiredSpace = 40) => {
                if (yPos > pageHeight - requiredSpace) {
                    pdf.addPage()
                    yPos = 20
                    return true
                }
                return false
            }

            // Helper to draw section header
            const drawSectionHeader = (title) => {
                checkPageBreak(50)
                pdf.setDrawColor(200)
                pdf.line(14, yPos, pageWidth - 14, yPos)
                yPos += 8
                pdf.setFontSize(14)
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(44, 102, 147)
                pdf.text(title, 14, yPos)
                yPos += 10
                pdf.setFont('helvetica', 'normal')
            }

            // ==================== PAGE 1: HEADER & SUMMARY ====================

            // Colored Header Bar
            pdf.setFillColor(44, 102, 147)
            pdf.rect(0, 0, pageWidth, 40, 'F')

            pdf.setTextColor(255, 255, 255)
            pdf.setFontSize(24)
            pdf.setFont('helvetica', 'bold')
            pdf.text('OmniQC Analysis Report', 14, 18)

            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'normal')
            pdf.text(`Sample: ${sampleData.filename || 'Unknown'}`, 14, 28)
            pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 35)

            // Overall Status Badge on right
            const overallStatus = qualityStatus.overall || 'unknown'
            const statusColors = { pass: [22, 163, 74], warn: [217, 119, 6], fail: [220, 38, 38] }
            const statusColor = statusColors[overallStatus] || [100, 100, 100]
            pdf.setFillColor(...statusColor)
            pdf.roundedRect(pageWidth - 45, 15, 35, 15, 3, 3, 'F')
            pdf.setFontSize(11)
            pdf.setFont('helvetica', 'bold')
            pdf.text(overallStatus.toUpperCase(), pageWidth - 27.5, 24, { align: 'center' })

            yPos = 55

            // Summary Statistics Box
            pdf.setFillColor(248, 250, 252)
            pdf.roundedRect(14, yPos - 5, pageWidth - 28, 45, 3, 3, 'F')

            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(30, 41, 59)
            pdf.text('Summary Statistics', 20, yPos + 3)

            yPos += 12
            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'normal')

            const summaryStats = [
                ['Total Reads', (metrics.total_reads || 0).toLocaleString()],
                ['Total Bases', (metrics.total_bases || 0).toLocaleString()],
                ['Avg Read Length', `${(metrics.avg_read_length || 0).toFixed(1)} bp`],
                ['GC Content', `${(metrics.gc_content || 0).toFixed(2)}%`],
                ['Avg Q-Score', (metrics.avg_q_score || 0).toFixed(2)],
                ['N50', (metrics.n50 || 0).toLocaleString()],
                ['Min Length', `${metrics.min_len || 0} bp`],
                ['Max Length', `${metrics.max_len || 0} bp`],
            ]

            summaryStats.forEach(([label, value], i) => {
                const col = i % 4
                const row = Math.floor(i / 4)
                const xPos = 20 + col * 43
                const rowY = yPos + row * 12

                pdf.setTextColor(100, 116, 139)
                pdf.text(label + ':', xPos, rowY)
                pdf.setTextColor(30, 41, 59)
                pdf.setFont('helvetica', 'bold')
                pdf.text(value, xPos, rowY + 5)
                pdf.setFont('helvetica', 'normal')
            })

            yPos += 35

            // ==================== QUALITY ASSESSMENT SECTION ====================
            drawSectionHeader('Quality Assessment')

            if (qualityStatus.metrics) {
                const metricLabels = {
                    per_base_quality: 'Per Base Quality',
                    per_sequence_quality: 'Per Sequence Quality',
                    base_content: 'Base Content',
                    gc_content: 'GC Content',
                    n_content: 'N Content',
                    sequence_duplication: 'Sequence Duplication',
                    adapter_content: 'Adapter Content'
                }

                // Draw metrics table
                pdf.setFillColor(241, 245, 249)
                pdf.rect(14, yPos - 3, pageWidth - 28, 8, 'F')
                pdf.setFontSize(9)
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(71, 85, 105)
                pdf.text('Metric', 16, yPos + 2)
                pdf.text('Status', 80, yPos + 2)
                pdf.text('Details', 110, yPos + 2)
                yPos += 10

                Object.entries(qualityStatus.metrics).forEach(([key, data], idx) => {
                    checkPageBreak(15)

                    if (idx % 2 === 0) {
                        pdf.setFillColor(249, 250, 251)
                        pdf.rect(14, yPos - 4, pageWidth - 28, 10, 'F')
                    }

                    pdf.setFontSize(9)
                    pdf.setFont('helvetica', 'normal')
                    pdf.setTextColor(30, 41, 59)
                    pdf.text(metricLabels[key] || key, 16, yPos + 1)

                    // Status with color
                    const statusCol = statusColors[data.status] || [100, 100, 100]
                    pdf.setTextColor(...statusCol)
                    pdf.setFont('helvetica', 'bold')
                    pdf.text(data.status?.toUpperCase() || 'N/A', 80, yPos + 1)

                    // Message
                    pdf.setFont('helvetica', 'normal')
                    pdf.setTextColor(100, 116, 139)
                    const msg = (data.message || '').substring(0, 50)
                    pdf.text(msg, 110, yPos + 1)

                    yPos += 10
                })

                // Summary counts
                yPos += 5
                pdf.setFontSize(10)
                pdf.setTextColor(30, 41, 59)
                pdf.text(`Results: ${qualityStatus.passed || 0} Passed, ${qualityStatus.warned || 0} Warnings, ${qualityStatus.failed || 0} Failed`, 14, yPos)
                yPos += 10
            }

            // ==================== PER BASE QUALITY DISTRIBUTION ====================
            drawSectionHeader('Per Base Sequence Quality')

            if (metrics.quality_distribution && metrics.quality_distribution.length > 0) {
                pdf.setFontSize(9)
                pdf.setFillColor(241, 245, 249)
                pdf.rect(14, yPos - 3, pageWidth - 28, 6, 'F')
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(71, 85, 105)

                // 6 columns for position/quality pairs
                const colWidth = (pageWidth - 28) / 6
                pdf.text('Pos', 16, yPos + 1)
                pdf.text('Q', 16 + colWidth * 0.6, yPos + 1)
                pdf.text('Pos', 16 + colWidth, yPos + 1)
                pdf.text('Q', 16 + colWidth * 1.6, yPos + 1)
                pdf.text('Pos', 16 + colWidth * 2, yPos + 1)
                pdf.text('Q', 16 + colWidth * 2.6, yPos + 1)
                pdf.text('Pos', 16 + colWidth * 3, yPos + 1)
                pdf.text('Q', 16 + colWidth * 3.6, yPos + 1)
                pdf.text('Pos', 16 + colWidth * 4, yPos + 1)
                pdf.text('Q', 16 + colWidth * 4.6, yPos + 1)
                pdf.text('Pos', 16 + colWidth * 5, yPos + 1)
                pdf.text('Q', 16 + colWidth * 5.6, yPos + 1)
                yPos += 8

                const qualData = metrics.quality_distribution
                const colSize = Math.ceil(qualData.length / 6)

                pdf.setFont('helvetica', 'normal')
                for (let i = 0; i < Math.min(colSize, 15); i++) {
                    checkPageBreak(10)
                    pdf.setTextColor(60)
                    for (let c = 0; c < 6; c++) {
                        const dataIdx = i + c * colSize
                        if (qualData[dataIdx]) {
                            const quality = qualData[dataIdx].quality || 0
                            // Color code by quality
                            if (quality >= 30) pdf.setTextColor(22, 163, 74)
                            else if (quality >= 20) pdf.setTextColor(217, 119, 6)
                            else pdf.setTextColor(220, 38, 38)

                            pdf.text(String(qualData[dataIdx].pos), 16 + colWidth * c, yPos)
                            pdf.text(quality.toFixed(1), 16 + colWidth * c + colWidth * 0.6, yPos)
                        }
                    }
                    yPos += 5
                }
            } else {
                pdf.setFontSize(9)
                pdf.setTextColor(100)
                pdf.text('No quality distribution data available', 14, yPos)
                yPos += 8
            }

            // ==================== BASE CONTENT ====================
            if (metrics.base_content && metrics.base_content.length > 0) {
                drawSectionHeader('Per Base Sequence Content')

                pdf.setFontSize(9)
                pdf.setFillColor(241, 245, 249)
                pdf.rect(14, yPos - 3, pageWidth - 28, 6, 'F')
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(71, 85, 105)
                pdf.text('Position', 16, yPos + 1)
                pdf.text('A%', 45, yPos + 1)
                pdf.text('T%', 65, yPos + 1)
                pdf.text('G%', 85, yPos + 1)
                pdf.text('C%', 105, yPos + 1)
                pdf.text('N%', 125, yPos + 1)
                yPos += 8

                pdf.setFont('helvetica', 'normal')
                const baseData = metrics.base_content.slice(0, 20)
                baseData.forEach((d, idx) => {
                    checkPageBreak(10)
                    pdf.setTextColor(30)
                    pdf.text(String(d.pos), 16, yPos)
                    pdf.setTextColor(239, 68, 68) // Red for A
                    pdf.text((d.A || 0).toFixed(1), 45, yPos)
                    pdf.setTextColor(34, 197, 94) // Green for T
                    pdf.text((d.T || 0).toFixed(1), 65, yPos)
                    pdf.setTextColor(59, 130, 246) // Blue for G
                    pdf.text((d.G || 0).toFixed(1), 85, yPos)
                    pdf.setTextColor(168, 85, 247) // Purple for C
                    pdf.text((d.C || 0).toFixed(1), 105, yPos)
                    pdf.setTextColor(100)
                    pdf.text((d.N || 0).toFixed(1), 125, yPos)
                    yPos += 5
                })
            }

            // ==================== GC CONTENT ====================
            if (metrics.per_sequence_gc && metrics.per_sequence_gc.length > 0) {
                drawSectionHeader('Per Sequence GC Content')

                pdf.setFontSize(9)
                pdf.setTextColor(71, 85, 105)
                pdf.text(`Mean GC: ${(metrics.gc_content || 0).toFixed(2)}%`, 14, yPos)
                yPos += 8

                // Simplified GC distribution summary
                const gcData = metrics.per_sequence_gc
                const maxGC = gcData.reduce((max, d) => d.count > max.count ? d : max, { count: 0 })
                pdf.text(`Peak GC%: ${maxGC.gc || 0}% (${(maxGC.count || 0).toLocaleString()} sequences)`, 14, yPos)
                yPos += 10
            }

            // ==================== SEQUENCE DUPLICATION ====================
            if (metrics.duplication_levels && metrics.duplication_levels.length > 0) {
                drawSectionHeader('Sequence Duplication Levels')

                pdf.setFontSize(9)
                pdf.text(`Duplication Rate: ${(metrics.duplication_rate || 0).toFixed(2)}%`, 14, yPos)
                yPos += 8

                pdf.setFillColor(241, 245, 249)
                pdf.rect(14, yPos - 3, pageWidth - 28, 6, 'F')
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(71, 85, 105)
                pdf.text('Duplication Level', 16, yPos + 1)
                pdf.text('% of Deduplicated', 80, yPos + 1)
                pdf.text('% of Total', 130, yPos + 1)
                yPos += 8

                pdf.setFont('helvetica', 'normal')
                metrics.duplication_levels.slice(0, 10).forEach(d => {
                    checkPageBreak(10)
                    pdf.setTextColor(30)
                    pdf.text(d.level, 16, yPos)
                    pdf.text((d.percentage || 0).toFixed(2) + '%', 80, yPos)
                    pdf.text((d.total_percentage || d.percentage || 0).toFixed(2) + '%', 130, yPos)
                    yPos += 5
                })
            }

            // ==================== ADAPTER CONTENT ====================
            if (metrics.adapter_content && metrics.adapter_content.length > 0) {
                drawSectionHeader('Adapter Content')

                pdf.setFontSize(9)
                pdf.setFillColor(241, 245, 249)
                pdf.rect(14, yPos - 3, pageWidth - 28, 6, 'F')
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(71, 85, 105)
                pdf.text('Adapter Name', 16, yPos + 1)
                pdf.text('Percentage', 120, yPos + 1)
                yPos += 8

                pdf.setFont('helvetica', 'normal')
                metrics.adapter_content.forEach(d => {
                    checkPageBreak(10)
                    pdf.setTextColor(30)
                    pdf.text(d.name || 'Unknown', 16, yPos)
                    const pct = d.percentage || 0
                    if (pct > 5) pdf.setTextColor(220, 38, 38)
                    else if (pct > 1) pdf.setTextColor(217, 119, 6)
                    else pdf.setTextColor(22, 163, 74)
                    pdf.text(pct.toFixed(2) + '%', 120, yPos)
                    yPos += 5
                })
            }

            // ==================== READ LENGTH DISTRIBUTION ====================
            if (metrics.length_distribution && metrics.length_distribution.length > 0) {
                drawSectionHeader('Read Length Distribution')

                pdf.setFontSize(9)
                pdf.setFillColor(241, 245, 249)
                pdf.rect(14, yPos - 3, pageWidth - 28, 6, 'F')
                pdf.setFont('helvetica', 'bold')
                pdf.setTextColor(71, 85, 105)
                pdf.text('Length Range', 16, yPos + 1)
                pdf.text('Count', 70, yPos + 1)
                pdf.text('Length Range', 110, yPos + 1)
                pdf.text('Count', 165, yPos + 1)
                yPos += 8

                pdf.setFont('helvetica', 'normal')
                const lenData = metrics.length_distribution
                const colSize = Math.ceil(lenData.length / 2)

                for (let i = 0; i < Math.min(colSize, 15); i++) {
                    checkPageBreak(10)
                    pdf.setTextColor(30)
                    if (lenData[i]) {
                        pdf.text(String(lenData[i].range), 16, yPos)
                        pdf.text((lenData[i].count || 0).toLocaleString(), 70, yPos)
                    }
                    if (lenData[i + colSize]) {
                        pdf.text(String(lenData[i + colSize].range), 110, yPos)
                        pdf.text((lenData[i + colSize].count || 0).toLocaleString(), 165, yPos)
                    }
                    yPos += 5
                }
            }

            // ==================== FOOTER ON ALL PAGES ====================
            const totalPages = pdf.internal.getNumberOfPages()
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i)
                pdf.setFontSize(8)
                pdf.setTextColor(150)
                pdf.text('Generated by OmniQC', 14, pageHeight - 8)
                pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 25, pageHeight - 8)
            }

            // Save PDF
            pdf.save(`${sampleData.filename || 'analysis'}_detailed_report.pdf`)

        } catch (error) {
            console.error('PDF export error:', error)
            alert('Failed to export PDF: ' + error.message)
        } finally {
            setIsExportingPDF(false)
        }
    }

    // Export analysis results to CSV
    const exportToCSV = () => {
        if (!sampleData) return

        let metrics = {}
        if (sampleData.analysis_results) {
            if (typeof sampleData.analysis_results === 'string') {
                try { metrics = JSON.parse(sampleData.analysis_results) } catch (e) { }
            } else {
                metrics = sampleData.analysis_results
            }
        } else if (sampleData.total_reads) {
            metrics = sampleData
        }

        // Build CSV content
        const rows = [
            ['Metric', 'Value'],
            ['Filename', sampleData.filename || ''],
            ['Platform', metrics.platform || 'Unknown'],
            ['Total Reads', metrics.total_reads || 0],
            ['Total Bases', metrics.total_bases || 0],
            ['Avg Read Length', metrics.avg_read_length?.toFixed(2) || 0],
            ['GC Content (%)', metrics.gc_content?.toFixed(2) || 0],
            ['Avg Q-Score', metrics.avg_q_score?.toFixed(2) || 0],
            ['N50', metrics.n50 || 'N/A'],
            ['Min Length', metrics.min_len || 0],
            ['Max Length', metrics.max_len || 0],
            ['Upload Date', sampleData.upload_date || ''],
        ]

        // Add quality distribution
        if (metrics.quality_distribution?.length > 0) {
            rows.push([])
            rows.push(['Position', 'Quality Score'])
            metrics.quality_distribution.forEach(d => rows.push([d.pos, d.quality?.toFixed(2)]))
        }

        // Add length distribution
        if (metrics.length_distribution?.length > 0) {
            rows.push([])
            rows.push(['Length Range', 'Count'])
            metrics.length_distribution.forEach(d => rows.push([d.range, d.count]))
        }

        const csvContent = rows.map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${sampleData.filename || 'analysis'}_results.csv`
        link.click()
        URL.revokeObjectURL(url)
    }
    // If no sample selected, show empty state or aggregate view
    if (!sampleData) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                Select a sample to view metrics
            </div>
        )
    }

    // Parse analysis_results if it's a string (from DB) or use as is
    let metrics = {}

    if (sampleData.analysis_results) {
        if (typeof sampleData.analysis_results === 'string') {
            try {
                metrics = JSON.parse(sampleData.analysis_results)
            } catch (e) {
                console.error("Failed to parse analysis results", e)
            }
        } else {
            metrics = sampleData.analysis_results
        }
    } else if (sampleData.total_reads) {
        // Fallback if sampleData itself is the metrics object (legacy or direct pass)
        metrics = sampleData
    }

    // Prepare data for charts
    const qualityData = metrics.quality_distribution || []
    const lengthData = metrics.length_distribution || []
    const perSeqQuality = metrics.per_sequence_quality_distribution || []
    const perSeqGC = metrics.per_sequence_gc_distribution || []
    const perBaseContent = metrics.per_base_sequence_content || []
    const duplicationLevels = metrics.duplication_levels || []
    const overrepresented = metrics.overrepresented_sequences || []
    const adapterContent = metrics.adapter_content || []
    const qualityStatus = metrics.quality_status || null

    // Helper function for status badge
    const StatusBadge = ({ status, label, message }) => {
        const colors = {
            pass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            warn: 'bg-amber-100 text-amber-700 border-amber-200',
            fail: 'bg-red-100 text-red-700 border-red-200'
        }
        const icons = {
            pass: '✓',
            warn: '!',
            fail: '✕'
        }
        return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colors[status]} group relative`} title={message}>
                <span className="font-bold text-sm">{icons[status]}</span>
                <span className="text-xs font-medium">{label}</span>
            </div>
        )
    }

    // Overall status badge - smaller and more subtle
    const OverallBadge = ({ status }) => {
        const config = {
            pass: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', text: 'Pass', icon: '✓' },
            warn: { bg: 'bg-amber-100 text-amber-700 border-amber-200', text: 'Warning', icon: '!' },
            fail: { bg: 'bg-red-100 text-red-700 border-red-200', text: 'Fail', icon: '✕' }
        }
        const c = config[status] || config.warn
        return (
            <div className={`${c.bg} px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-semibold border`}>
                <span>{c.icon}</span>
                <span>{c.text}</span>
            </div>
        )
    }

    // Get metric status helper
    const getMetricStatus = (metricKey) => {
        if (!qualityStatus?.metrics?.[metricKey]) return null
        return qualityStatus.metrics[metricKey]
    }

    // Chart header with status color
    const ChartHeader = ({ title, metricKey }) => {
        const status = getMetricStatus(metricKey)
        const borderColors = {
            pass: 'border-l-emerald-500',
            warn: 'border-l-amber-500',
            fail: 'border-l-red-500'
        }
        const bgColors = {
            pass: 'bg-emerald-50/50',
            warn: 'bg-amber-50/50',
            fail: 'bg-red-50/50'
        }
        const badgeColors = {
            pass: 'bg-emerald-100 text-emerald-700',
            warn: 'bg-amber-100 text-amber-700',
            fail: 'bg-red-100 text-red-700'
        }
        const icons = { pass: '✓', warn: '!', fail: '✕' }

        const borderColor = status ? borderColors[status.status] : ''
        const bgColor = status ? bgColors[status.status] : 'bg-slate-50/50'

        return (
            <div className={`px-6 py-4 border-b border-slate-200 flex justify-between items-center ${bgColor} border-l-4 ${borderColor}`}>
                <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
                {status && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${badgeColors[status.status]}`} title={status.message}>
                        <span>{icons[status.status]}</span>
                        <span>{status.status.toUpperCase()}</span>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div ref={dashboardRef} className="flex flex-col gap-8 pb-10 max-w-6xl mx-auto">
            {/* Quality Assessment Summary */}
            {qualityStatus && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg">Quality Assessment</h3>
                        <OverallBadge status={qualityStatus.overall} />
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm text-slate-500">
                                {qualityStatus.pass_count} passed • {qualityStatus.warn_count} warnings • {qualityStatus.fail_count} failed
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {qualityStatus.metrics && Object.entries(qualityStatus.metrics).map(([key, value]) => (
                                <StatusBadge
                                    key={key}
                                    status={value.status}
                                    label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    message={value.message}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Reads</h4>
                    <p className="text-3xl font-bold text-brand">{metrics.total_reads?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Avg Q-Score</h4>
                    <p className="text-3xl font-bold text-green-600">{metrics.avg_q_score?.toFixed(1) || 0}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">GC Content</h4>
                    <p className="text-3xl font-bold text-slate-700">{metrics.gc_content?.toFixed(1) || 0}%</p>
                </div>
            </div>

            {/* Detailed Metrics Section */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">Detailed Metrics</h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToPDF}
                            disabled={isExportingPDF}
                            className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline disabled:opacity-50"
                        >
                            {isExportingPDF ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <FileText size={14} />
                            )}
                            {isExportingPDF ? 'Generating...' : 'Export PDF'}
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark hover:underline"
                        >
                            <Download size={14} />
                            Export CSV
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        <div className="flex justify-between py-3 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Filename</span>
                            <span className="font-mono text-slate-800 font-semibold truncate max-w-[200px]" title={sampleData.filename}>{sampleData.filename}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Platform</span>
                            <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-sm">{metrics.platform || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Total Bases</span>
                            <span className="font-mono text-slate-800">{metrics.total_bases?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Avg Read Length</span>
                            <span className="font-mono text-slate-800">{metrics.avg_read_length?.toFixed(0) || 0} bp</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">N50</span>
                            <span className="font-mono text-slate-800">{metrics.n50 || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Min/Max Length</span>
                            <span className="font-mono text-slate-800">{metrics.min_len} / {metrics.max_len}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Upload Date</span>
                            <span className="font-mono text-slate-800">{new Date(sampleData.upload_date).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section - Stacked Vertically */}
            <div className="space-y-8">
                {/* Quality per Position */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <ChartHeader title="Per Base Sequence Quality" metricKey="per_base_quality" />
                    <div className="p-6 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={qualityData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="pos" stroke="#94a3b8" fontSize={12} tickLine={false} label={{ value: 'Position (bp)', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 12 }} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 45]} label={{ value: 'Quality Score (Phred)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#2c6693', fontWeight: 600 }} />
                                <Line type="monotone" dataKey="quality" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Per Sequence Quality Scores */}
                {perSeqQuality.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <ChartHeader title="Per Sequence Quality Scores" metricKey="per_sequence_quality" />
                        <div className="p-6 h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={perSeqQuality} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="quality" stroke="#94a3b8" fontSize={12} tickLine={false} label={{ value: 'Mean Quality Score', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 12 }} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Per Base Sequence Content */}
                {perBaseContent.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <ChartHeader title="Per Base Sequence Content" metricKey="per_base_content" />
                        <div className="p-6 h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={perBaseContent} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" fill="#f9fafb" />
                                    <XAxis dataKey="pos" stroke="#6b7280" fontSize={11} tickLine={false} label={{ value: 'Position in read (bp)', position: 'insideBottom', offset: -15, fill: '#4b5563', fontSize: 11 }} />
                                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} domain={[0, 100]} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: '#4b5563', fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid #d1d5db', boxShadow: 'none', fontSize: '12px' }} />
                                    <Legend verticalAlign="top" align="right" layout="vertical" wrapperStyle={{ right: 0, top: 10, fontSize: '11px' }} />
                                    <Line type="linear" dataKey="T" stroke="#dc2626" strokeWidth={1.5} dot={false} name="%T" />
                                    <Line type="linear" dataKey="C" stroke="#2563eb" strokeWidth={1.5} dot={false} name="%C" />
                                    <Line type="linear" dataKey="A" stroke="#16a34a" strokeWidth={1.5} dot={false} name="%A" />
                                    <Line type="linear" dataKey="G" stroke="#1f2937" strokeWidth={1.5} dot={false} name="%G" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Per Sequence GC Content */}
                {perSeqGC.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <ChartHeader title="Per Sequence GC Content" metricKey="gc_content" />
                        <div className="p-6 h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="gc" type="number" domain={[0, 100]} allowDataOverflow={true} stroke="#94a3b8" fontSize={12} tickLine={false} label={{ value: 'GC Content (%)', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 12 }} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="top" height={36} />
                                    <Line data={perSeqGC} type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={false} name="Observed GC" />
                                    {metrics.theoretical_gc_distribution && (
                                        <Line data={metrics.theoretical_gc_distribution} type="monotone" dataKey="count" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Theoretical Distribution" />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Sequence Duplication Levels */}
                {duplicationLevels.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <ChartHeader title="Sequence Duplication Levels" metricKey="sequence_duplication" />
                        <div className="p-6 h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={duplicationLevels} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="level" stroke="#94a3b8" fontSize={11} tickLine={false} angle={-45} textAnchor="end" height={60} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} label={{ value: '% of Deduplicated', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="percentage" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Read Length Distribution */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <ChartHeader title="Read Length Distribution" metricKey="" />
                    <div className="p-6 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={lengthData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} tickLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} label={{ value: 'Read Count', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Overrepresented Sequences */}
                {overrepresented.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <ChartHeader title="Overrepresented Sequences" metricKey="" />
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">Sequence</th>
                                        <th className="px-6 py-3">Count</th>
                                        <th className="px-6 py-3">Percentage</th>
                                        <th className="px-6 py-3">Possible Source</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {overrepresented.map((seq, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 font-mono text-xs text-slate-600 max-w-[300px] truncate" title={seq.sequence}>{seq.sequence}</td>
                                            <td className="px-6 py-3 text-slate-800">{seq.count.toLocaleString()}</td>
                                            <td className="px-6 py-3 text-slate-800">{seq.percentage.toFixed(2)}%</td>
                                            <td className="px-6 py-3 text-slate-500">{seq.possible_source}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Adapter Content */}
                {adapterContent.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <ChartHeader title="Adapter Content" metricKey="adapter_content" />
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">Adapter Name</th>
                                        <th className="px-6 py-3">Percentage of Reads</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {adapterContent.map((adapter, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 font-medium text-slate-800">{adapter.name}</td>
                                            <td className="px-6 py-3 text-slate-800">{adapter.percentage.toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard

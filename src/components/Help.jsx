import React from 'react'
import { X, FileText, Upload, BarChart3, Download, HelpCircle, CheckCircle, AlertTriangle, XCircle, Dna, Activity } from 'lucide-react'

const Help = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-100 rounded-lg">
                            <HelpCircle size={24} className="text-sky-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">OmniQC Help Guide</h3>
                            <p className="text-sm text-slate-500">Learn how to use OmniQC for FASTQ quality control</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Quick Start */}
                    <section>
                        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-sky-500" />
                            Quick Start
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-6 h-6 bg-sky-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                    <span className="font-semibold text-slate-700">Create Project</span>
                                </div>
                                <p className="text-sm text-slate-600">Click "New Project" in the toolbar to create a new analysis project.</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-6 h-6 bg-sky-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                    <span className="font-semibold text-slate-700">Upload Samples</span>
                                </div>
                                <p className="text-sm text-slate-600">Drag & drop FASTQ files (.fastq, .fq, .gz) into the upload area.</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-6 h-6 bg-sky-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                    <span className="font-semibold text-slate-700">Analyze</span>
                                </div>
                                <p className="text-sm text-slate-600">Click the play button on each sample or use "Analyze All" for batch processing.</p>
                            </div>
                        </div>
                    </section>

                    {/* Quality Metrics */}
                    <section>
                        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Dna size={20} className="text-emerald-500" />
                            Quality Metrics Explained
                        </h4>
                        <div className="space-y-3">
                            <div className="bg-white border border-slate-200 rounded-lg p-4">
                                <h5 className="font-semibold text-slate-700 mb-1">Per Base Sequence Quality</h5>
                                <p className="text-sm text-slate-600">Shows the Phred quality score at each position in the read. Scores ≥30 indicate high quality (99.9% accuracy).</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg p-4">
                                <h5 className="font-semibold text-slate-700 mb-1">Per Sequence Quality Scores</h5>
                                <p className="text-sm text-slate-600">Distribution of average quality scores per read. Most reads should have high average quality.</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg p-4">
                                <h5 className="font-semibold text-slate-700 mb-1">Per Base Sequence Content</h5>
                                <p className="text-sm text-slate-600">Shows A, T, G, C percentage at each position. In random libraries, lines should be parallel and roughly equal.</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg p-4">
                                <h5 className="font-semibold text-slate-700 mb-1">GC Content</h5>
                                <p className="text-sm text-slate-600">Distribution of GC content per sequence. Should follow a normal distribution matching expected GC% for your organism.</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg p-4">
                                <h5 className="font-semibold text-slate-700 mb-1">Sequence Duplication Levels</h5>
                                <p className="text-sm text-slate-600">Indicates PCR duplication or highly expressed genes. High duplication may indicate library preparation issues.</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg p-4">
                                <h5 className="font-semibold text-slate-700 mb-1">Adapter Content</h5>
                                <p className="text-sm text-slate-600">Detects adapter sequences in your reads. High adapter content may require trimming before downstream analysis.</p>
                            </div>
                        </div>
                    </section>

                    {/* Quality Status */}
                    <section>
                        <h4 className="text-lg font-bold text-slate-800 mb-4">Quality Status Indicators</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <CheckCircle size={24} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="font-semibold text-emerald-700">Pass</h5>
                                    <p className="text-sm text-emerald-600">Metric is within normal range. No action needed.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertTriangle size={24} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="font-semibold text-amber-700">Warning</h5>
                                    <p className="text-sm text-amber-600">Metric is unusual. May be expected for certain library types.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <XCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="font-semibold text-red-700">Fail</h5>
                                    <p className="text-sm text-red-600">Metric indicates a problem. Review data quality and consider filtering.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Export Options */}
                    <section>
                        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Download size={20} className="text-purple-500" />
                            Export Options
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-200 rounded-lg p-4">
                                <h5 className="font-semibold text-slate-700 mb-1">Export CSV</h5>
                                <p className="text-sm text-slate-600">Export all metrics and distributions as a CSV file for further analysis in Excel or R.</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg p-4">
                                <h5 className="font-semibold text-slate-700 mb-1">Export PDF</h5>
                                <p className="text-sm text-slate-600">Generate a professional PDF report with all quality metrics for documentation.</p>
                            </div>
                        </div>
                    </section>

                    {/* Keyboard Shortcuts */}
                    <section>
                        <h4 className="text-lg font-bold text-slate-800 mb-4">Tips & Best Practices</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li className="flex items-start gap-2">
                                <span className="text-sky-500">•</span>
                                <span>Always check quality before downstream analysis to avoid wasting compute resources.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-sky-500">•</span>
                                <span>Warnings are not always bad - some library types (e.g., RNA-seq) naturally show biased base content.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-sky-500">•</span>
                                <span>If adapter content is high, use tools like Trimmomatic or Cutadapt to remove adapters.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-sky-500">•</span>
                                <span>Compare multiple samples to identify batch effects or outliers.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-sky-500">•</span>
                                <span>Use the N50 metric for long-read data to assess read length distribution.</span>
                            </li>
                        </ul>
                    </section>

                    {/* Version Info */}
                    <section className="text-center text-sm text-slate-400 pt-4 border-t border-slate-100">
                        <p>OmniQC v1.0 • Built for Bioinformaticians</p>
                        <p className="mt-1">© 2024 OmniQC Contributors</p>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Help

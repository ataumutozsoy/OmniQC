import React, { useCallback, useState } from 'react'
import { Upload, File, X } from 'lucide-react'

const DropZone = ({ onFilesSelected, id = 'fileInput' }) => {
    const [isDragging, setIsDragging] = useState(false)
    const [files, setFiles] = useState([])

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)

        const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
            file.name.endsWith('.fastq') || file.name.endsWith('.fastq.gz') || file.name.endsWith('.fq') || file.name.endsWith('.fq.gz')
        )

        if (droppedFiles.length > 0) {
            setFiles(prev => [...prev, ...droppedFiles])
            onFilesSelected(droppedFiles)
        }
    }, [onFilesSelected])

    const handleFileInput = useCallback((e) => {
        const selectedFiles = Array.from(e.target.files)
        if (selectedFiles.length > 0) {
            setFiles(prev => [...prev, ...selectedFiles])
            onFilesSelected(selectedFiles)
        }
    }, [onFilesSelected])

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <div className="w-full">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          border-2 border-dashed rounded-md p-10 text-center transition-all duration-200 cursor-pointer
          ${isDragging
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                    }
        `}
                onClick={() => document.getElementById(id).click()}
            >
                <input
                    type="file"
                    id={id}
                    multiple
                    accept=".fastq,.fastq.gz,.fq,.fq.gz"
                    className="hidden"
                    onChange={handleFileInput}
                />
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-slate-100 rounded-full border border-slate-200">
                        <Upload size={32} className="text-slate-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Drop FASTQ files here</h3>
                        <p className="text-slate-500 mt-1">or click to browse</p>
                    </div>
                    <p className="text-xs text-slate-400">Supports .fastq, .fastq.gz, .fq, .fq.gz</p>
                </div>
            </div>

        </div>
    )
}

export default DropZone

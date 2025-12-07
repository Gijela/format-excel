import { useState, useCallback } from 'react'

/* ╔═══════════════════════════════════════════════════════════════╗
   ║                    文件上传组件                                ║
   ║  - 支持拖拽上传                                                ║
   ║  - 支持点击选择文件                                            ║
   ║  - 紧凑模式适配顶部栏                                          ║
   ╚═══════════════════════════════════════════════════════════════╝ */

export default function FileUploader({ onFileSelect, isProcessing, compact }) {
  const [isDragging, setIsDragging] = useState(false)

  // ┌─────────────────────────────────────────────────────────────┐
  // │  拖拽事件处理                                                │
  // └─────────────────────────────────────────────────────────────┘

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

    const file = e.dataTransfer.files[0]
    if (file && isValidFile(file)) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  // ┌─────────────────────────────────────────────────────────────┐
  // │  点击上传处理                                                │
  // └─────────────────────────────────────────────────────────────┘

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0]
    if (file && isValidFile(file)) {
      onFileSelect(file)
    }
    e.target.value = ''
  }, [onFileSelect])

  // ┌─────────────────────────────────────────────────────────────┐
  // │  文件类型校验                                                │
  // └─────────────────────────────────────────────────────────────┘

  const isValidFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    return ['xlsx', 'xls'].includes(ext)
  }

  return (
    <div
      className={`
        upload-zone flex items-center justify-center cursor-pointer
        transition-all duration-200
        ${isDragging ? 'dragging' : ''}
        ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        ${compact ? 'p-4 h-full' : 'p-8'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input').click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileInput}
      />

      <div className="flex flex-col items-center gap-2 text-center">
        {/* 上传图标 */}
        <div className={`
          rounded-full flex items-center justify-center
          ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}
          ${compact ? 'w-10 h-10' : 'w-14 h-14'}
        `}>
          {isProcessing ? (
            <svg className="animate-spin w-5 h-5 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg
              className={`${isDragging ? 'text-blue-500' : 'text-slate-400'} ${compact ? 'w-5 h-5' : 'w-6 h-6'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          )}
        </div>

        {/* 提示文字 */}
        <div>
          <p className={`font-medium text-slate-600 ${compact ? 'text-sm' : 'text-base'}`}>
            {isDragging ? '松开上传' : '拖拽或点击上传'}
          </p>
          <p className={`text-slate-400 ${compact ? 'text-xs' : 'text-sm'}`}>
            .xlsx / .xls
          </p>
        </div>
      </div>
    </div>
  )
}

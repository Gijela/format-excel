import { useState, useCallback, useEffect } from 'react'
import FileUploader from './components/FileUploader'
import FormulaConfig from './components/FormulaConfig'
import DataTable from './components/DataTable'
import { parseExcel, calculateFormula, sortByResult } from './utils/excel'

/* ╔═══════════════════════════════════════════════════════════════╗
   ║                    Excel 运算工具                              ║
   ║  - 上传 Excel 文件                                             ║
   ║  - 配置列运算公式                                              ║
   ║  - 排序并导出结果                                              ║
   ╚═══════════════════════════════════════════════════════════════╝ */

export default function App() {
  // ┌─────────────────────────────────────────────────────────────┐
  // │  状态管理                                                    │
  // └─────────────────────────────────────────────────────────────┘

  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState([])
  const [rawRows, setRawRows] = useState([])
  const [processedRows, setProcessedRows] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [lastFormula, setLastFormula] = useState(null)
  const [configExpanded, setConfigExpanded] = useState(true)
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false)

  // ┌─────────────────────────────────────────────────────────────┐
  // │  全局拖拽事件处理                                            │
  // └─────────────────────────────────────────────────────────────┘

  const isValidFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    return ['xlsx', 'xls'].includes(ext)
  }

  const handleGlobalDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingGlobal(true)
  }, [])

  const handleGlobalDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    // 只有当离开整个窗口时才取消拖拽状态
    if (e.relatedTarget === null || !e.currentTarget.contains(e.relatedTarget)) {
      setIsDraggingGlobal(false)
    }
  }, [])

  const handleGlobalDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingGlobal(false)

    const file = e.dataTransfer.files[0]
    if (file && isValidFile(file)) {
      handleFileSelect(file)
    }
  }, [])

  // ┌─────────────────────────────────────────────────────────────┐
  // │  文件上传处理                                                │
  // └─────────────────────────────────────────────────────────────┘

  const handleFileSelect = useCallback(async (file) => {
    setIsProcessing(true)
    setError('')
    setProcessedRows([])

    try {
      const { headers: h, rows: r } = await parseExcel(file)
      setFileName(file.name)
      setHeaders(h)
      setRawRows(r)

      // 如果有上次的公式配置，自动应用
      if (lastFormula && canApplyFormula(lastFormula, h)) {
        applyFormula(lastFormula, r)
        setConfigExpanded(false)
      }
    } catch (err) {
      setError(err.message)
      setHeaders([])
      setRawRows([])
    } finally {
      setIsProcessing(false)
    }
  }, [lastFormula])

  // ┌─────────────────────────────────────────────────────────────┐
  // │  检查公式是否可应用于当前表头                                │
  // └─────────────────────────────────────────────────────────────┘

  const canApplyFormula = (formula, h) => {
    return h.includes(formula.colA) && 
           h.includes(formula.colB) && 
           h.includes(formula.colC)
  }

  // ┌─────────────────────────────────────────────────────────────┐
  // │  应用公式                                                    │
  // └─────────────────────────────────────────────────────────────┘

  const applyFormula = (formula, rows = rawRows) => {
    const calculated = calculateFormula(rows, formula)
    const sorted = sortByResult(calculated, formula.sortOrder)
    setProcessedRows(sorted)
  }

  const handleApplyFormula = useCallback((formula) => {
    setLastFormula(formula)
    applyFormula(formula)
    setConfigExpanded(false)
  }, [rawRows])

  // ┌─────────────────────────────────────────────────────────────┐
  // │  当新文件加载且有保存的公式时，自动应用                      │
  // └─────────────────────────────────────────────────────────────┘

  useEffect(() => {
    if (rawRows.length > 0 && lastFormula && canApplyFormula(lastFormula, headers)) {
      applyFormula(lastFormula)
    }
  }, [rawRows, headers])

  // ┌─────────────────────────────────────────────────────────────┐
  // │  生成公式摘要                                                │
  // └─────────────────────────────────────────────────────────────┘

  const getFormulaSummary = () => {
    if (!lastFormula) return '未配置'
    const { colA, colB, colC, operator1, operator2, sortOrder } = lastFormula
    return `(${colA} ${operator1} ${colB}) ${operator2} ${colC} | ${sortOrder === 'desc' ? '降序' : '升序'}`
  }

  // ┌─────────────────────────────────────────────────────────────┐
  // │  渲染                                                        │
  // └─────────────────────────────────────────────────────────────┘

  return (
    <div 
      className="min-h-screen flex flex-col relative"
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      {/* ── 全局拖拽遮罩 ── */}
      {isDraggingGlobal && (
        <div className="fixed inset-0 bg-blue-500/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center border-2 border-dashed border-blue-400">
            <svg className="w-16 h-16 mx-auto text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-xl font-medium text-blue-600">松开鼠标上传文件</p>
            <p className="text-sm text-slate-500 mt-1">支持 .xlsx / .xls 格式</p>
          </div>
        </div>
      )}

      {/* ── 顶部配置栏 ── */}
      <header className="card border-x-0 border-t-0 rounded-none">
        {/* 标题栏（始终显示） */}
        <div 
          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
          onClick={() => setConfigExpanded(!configExpanded)}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">
              Excel 运算工具
            </h1>
            
            {/* 状态摘要 */}
            <div className="flex items-center gap-3 text-sm text-slate-500">
              {fileName && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-slate-700 font-medium">{fileName}</span>
                </span>
              )}
              {lastFormula && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-mono">
                  {getFormulaSummary()}
                </span>
              )}
              {processedRows.length > 0 && (
                <span className="text-green-600">
                  ✓ {processedRows.length} 行已处理
                </span>
              )}
            </div>
          </div>

          <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            {configExpanded ? '收起' : '展开'}
            <svg 
              className={`w-4 h-4 transition-transform ${configExpanded ? 'rotate-180' : ''}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* 可折叠的配置区 */}
        <div className={`collapse-content ${configExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="px-4 pb-4 border-t border-slate-100">
            <div className="flex gap-4 pt-4">
              {/* 上传区域 */}
              <div className="w-64 flex-shrink-0">
                <FileUploader 
                  onFileSelect={handleFileSelect} 
                  isProcessing={isProcessing}
                  compact
                />
              </div>

              {/* 公式配置 */}
              <div className="flex-1">
                <FormulaConfig
                  headers={headers}
                  onApply={handleApplyFormula}
                  disabled={isProcessing || headers.length === 0}
                  compact
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── 错误提示 ── */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ── 数据表格（占据剩余空间） ── */}
      <main className="flex-1 p-4 overflow-hidden">
        {rawRows.length > 0 ? (
          <DataTable
            headers={headers}
            rows={processedRows.length > 0 ? processedRows : rawRows}
            showResult={processedRows.length > 0}
            fileName={fileName}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-slate-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg">拖拽 Excel 文件到页面任意位置</p>
              <p className="text-sm mt-1">或展开配置区点击上传</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/* ╔═══════════════════════════════════════════════════════════════╗
   ║                    数据表格组件                                ║
   ║  - 全屏展示 Excel 数据                                         ║
   ║  - 显示运算结果列                                              ║
   ║  - 过滤低于阈值的数据                                          ║
   ╚═══════════════════════════════════════════════════════════════╝ */

import { useMemo } from 'react'
import { exportToExcel } from '../utils/excel'

// ┌─────────────────────────────────────────────────────────────────┐
// │  阈值常量                                                       │
// └─────────────────────────────────────────────────────────────────┘

const FILTER_THRESHOLD = 500  // 低于此值的数据将被隐藏
const HIGHLIGHT_THRESHOLD = 1000  // 高于此值的数据将高亮显示

export default function DataTable({ headers, rows, showResult, fileName }) {
  if (!rows || rows.length === 0) return null

  // ┌─────────────────────────────────────────────────────────────┐
  // │  数据过滤：隐藏运算结果 < 500 的行                           │
  // └─────────────────────────────────────────────────────────────┘

  const { visibleRows, hiddenCount } = useMemo(() => {
    if (!showResult) {
      return { visibleRows: rows, hiddenCount: 0 }
    }
    const visible = rows.filter(row => row.__result >= FILTER_THRESHOLD)
    return {
      visibleRows: visible,
      hiddenCount: rows.length - visible.length,
    }
  }, [rows, showResult])

  // ┌─────────────────────────────────────────────────────────────┐
  // │  导出处理（导出全部数据，包含隐藏的）                        │
  // └─────────────────────────────────────────────────────────────┘

  const handleExport = () => exportToExcel(headers, rows, '运算结果')

  // ┌─────────────────────────────────────────────────────────────┐
  // │  格式化数值显示                                              │
  // └─────────────────────────────────────────────────────────────┘

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toFixed(4).replace(/\.?0+$/, '')
    }
    return val ?? ''
  }

  // ┌─────────────────────────────────────────────────────────────┐
  // │  统计信息（基于可见数据）                                    │
  // └─────────────────────────────────────────────────────────────┘

  const stats = showResult && visibleRows.length > 0 ? {
    above1000: visibleRows.filter(r => r.__result > 1000).length,
    above1500: visibleRows.filter(r => r.__result > 1500).length,
  } : null

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      {/* ── 工具栏 ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            显示 <span className="font-medium text-slate-700">{visibleRows.length}</span> 行
            {hiddenCount > 0 && (
              <span className="ml-2 text-orange-500">
                （已隐藏 {hiddenCount} 条 &lt;{FILTER_THRESHOLD} 的数据）
              </span>
            )}
          </span>
          
          {stats && (
            <div className="flex items-center gap-4 text-sm border-l border-slate-200 pl-4">
              <span>
                <span className="text-slate-400">&gt;1000:</span>{' '}
                <span className="text-green-600 font-medium">{stats.above1000} 个</span>
              </span>
              <span>
                <span className="text-slate-400">&gt;1500:</span>{' '}
                <span className="text-blue-600 font-medium">{stats.above1500} 个</span>
              </span>
            </div>
          )}
        </div>

        {showResult && (
          <button className="btn-secondary flex items-center gap-1.5" onClick={handleExport}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            导出全部
          </button>
        )}
      </div>

      {/* ── 表格主体 ── */}
      <div className="flex-1 overflow-auto">
        <table className="data-table w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-12 text-center">#</th>
              {headers.map((header, colIdx) => (
                <th key={header} className={colIdx < 3 ? 'whitespace-nowrap' : ''}>
                  {header}
                </th>
              ))}
              {showResult && (
                <th className="result-header sticky right-0 bg-emerald-100 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                  运算结果
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, idx) => (
              <tr key={row.__rowIndex ?? idx}>
                <td className="text-slate-400 text-center text-xs">{idx + 1}</td>
                {headers.map((header, colIdx) => (
                  <td 
                    key={header}
                    className={colIdx < 3 ? 'whitespace-nowrap' : ''}
                  >
                    {formatValue(row[header])}
                  </td>
                ))}
                {showResult && (
                  <td className={`sticky right-0 bg-white shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] ${
                    row.__result >= HIGHLIGHT_THRESHOLD ? 'result-column' : ''
                  }`}>
                    {formatValue(row.__result)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

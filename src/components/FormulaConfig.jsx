import { useState, useEffect } from 'react'

/* ╔═══════════════════════════════════════════════════════════════╗
   ║                    公式配置组件                                ║
   ║  - 选择参与运算的列                                            ║
   ║  - 配置运算符                                                  ║
   ║  - 紧凑的水平布局                                              ║
   ╚═══════════════════════════════════════════════════════════════╝ */

const OPERATORS = ['+', '-', '*', '/']
const STORAGE_KEY = 'excel-formula-config'

export default function FormulaConfig({ headers, onApply, disabled, compact }) {
  const [config, setConfig] = useState({
    colA: '',
    colB: '',
    colC: '',
    operator1: '*',
    operator2: '/',
    sortOrder: 'desc',
  })

  // ┌─────────────────────────────────────────────────────────────┐
  // │  从 localStorage 加载保存的配置                              │
  // └─────────────────────────────────────────────────────────────┘

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConfig(prev => ({ ...prev, ...parsed }))
      } catch {
        // 忽略解析错误
      }
    }
  }, [])

  // ┌─────────────────────────────────────────────────────────────┐
  // │  当表头变化时，自动匹配已保存的列名                          │
  // └─────────────────────────────────────────────────────────────┘

  useEffect(() => {
    if (headers.length > 0) {
      setConfig(prev => ({
        ...prev,
        colA: headers.includes(prev.colA) ? prev.colA : '',
        colB: headers.includes(prev.colB) ? prev.colB : '',
        colC: headers.includes(prev.colC) ? prev.colC : '',
      }))
    }
  }, [headers])

  // ┌─────────────────────────────────────────────────────────────┐
  // │  更新配置并保存到 localStorage                               │
  // └─────────────────────────────────────────────────────────────┘

  const updateConfig = (key, value) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
  }

  // ┌─────────────────────────────────────────────────────────────┐
  // │  应用公式                                                    │
  // └─────────────────────────────────────────────────────────────┘

  const handleApply = () => {
    if (!config.colA || !config.colB || !config.colC) {
      alert('请选择所有参与运算的列')
      return
    }
    onApply(config)
  }

  const isValid = config.colA && config.colB && config.colC

  // ┌─────────────────────────────────────────────────────────────┐
  // │  紧凑模式：水平单行布局                                      │
  // └─────────────────────────────────────────────────────────────┘

  if (compact) {
    return (
      <div className="flex items-center gap-3 h-full">
        {/* 公式构建器 */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-slate-400 text-sm">(</span>
          
          <select
            className="input-field py-1.5 px-2 text-sm min-w-[100px]"
            value={config.colA}
            onChange={(e) => updateConfig('colA', e.target.value)}
            disabled={disabled}
          >
            <option value="">列 A</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>

          <select
            className="input-field py-1.5 px-2 text-sm w-14 text-center font-mono"
            value={config.operator1}
            onChange={(e) => updateConfig('operator1', e.target.value)}
            disabled={disabled}
          >
            {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
          </select>

          <select
            className="input-field py-1.5 px-2 text-sm min-w-[100px]"
            value={config.colB}
            onChange={(e) => updateConfig('colB', e.target.value)}
            disabled={disabled}
          >
            <option value="">列 B</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>

          <span className="text-slate-400 text-sm">)</span>

          <select
            className="input-field py-1.5 px-2 text-sm w-14 text-center font-mono"
            value={config.operator2}
            onChange={(e) => updateConfig('operator2', e.target.value)}
            disabled={disabled}
          >
            {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
          </select>

          <select
            className="input-field py-1.5 px-2 text-sm min-w-[100px]"
            value={config.colC}
            onChange={(e) => updateConfig('colC', e.target.value)}
            disabled={disabled}
          >
            <option value="">列 C</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>

        {/* 排序选择 */}
        <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
          <button
            className={`px-2 py-1 rounded text-xs transition-colors ${
              config.sortOrder === 'desc'
                ? 'bg-blue-100 text-blue-600'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            onClick={() => updateConfig('sortOrder', 'desc')}
            disabled={disabled}
          >
            ↓ 降序
          </button>
          <button
            className={`px-2 py-1 rounded text-xs transition-colors ${
              config.sortOrder === 'asc'
                ? 'bg-blue-100 text-blue-600'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            onClick={() => updateConfig('sortOrder', 'asc')}
            disabled={disabled}
          >
            ↑ 升序
          </button>
        </div>

        {/* 执行按钮 */}
        <button
          className="btn-primary whitespace-nowrap"
          onClick={handleApply}
          disabled={disabled || !isValid}
        >
          执行运算
        </button>
      </div>
    )
  }

  // ┌─────────────────────────────────────────────────────────────┐
  // │  完整模式（备用）                                            │
  // └─────────────────────────────────────────────────────────────┘

  return (
    <div className="card p-4">
      <div className="grid grid-cols-3 gap-3 mb-3">
        <ColumnSelect label="列 A" value={config.colA} options={headers}
          onChange={(v) => updateConfig('colA', v)} disabled={disabled} />
        <ColumnSelect label="列 B" value={config.colB} options={headers}
          onChange={(v) => updateConfig('colB', v)} disabled={disabled} />
        <ColumnSelect label="列 C" value={config.colC} options={headers}
          onChange={(v) => updateConfig('colC', v)} disabled={disabled} />
      </div>
      <button className="btn-primary w-full" onClick={handleApply} disabled={disabled || !isValid}>
        执行运算并排序
      </button>
    </div>
  )
}

function ColumnSelect({ label, value, options, onChange, disabled }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <select className="input-field w-full" value={value}
        onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="">选择...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}

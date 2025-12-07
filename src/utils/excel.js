import * as XLSX from 'xlsx'

/* ╔═══════════════════════════════════════════════════════════════╗
   ║                    Excel 工具模块                              ║
   ║  - 解析 Excel 文件为 JSON                                      ║
   ║  - 执行列运算                                                  ║
   ║  - 导出处理后的数据                                            ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/**
 * 解析 Excel 文件
 * @param {File} file - 上传的文件对象
 * @returns {Promise<{headers: string[], rows: object[]}>}
 */
export const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        // 读取第一个工作表
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // 转换为 JSON，保留表头
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length < 2) {
          reject(new Error('Excel 文件至少需要包含表头和一行数据'))
          return
        }

        const headers = jsonData[0].map(h => String(h || '').trim())
        const rows = jsonData.slice(1).map((row, idx) => {
          const obj = { __rowIndex: idx }
          headers.forEach((header, i) => {
            obj[header] = row[i] ?? ''
          })
          return obj
        })

        resolve({ headers, rows })
      } catch (err) {
        reject(new Error('Excel 解析失败: ' + err.message))
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 执行公式运算
 * @param {object[]} rows - 数据行
 * @param {object} formula - 公式配置 { colA, colB, colC, operator1, operator2 }
 * @returns {object[]} 带运算结果的数据行
 */
export const calculateFormula = (rows, formula) => {
  const { colA, colB, colC, operator1, operator2 } = formula

  // 运算函数映射
  const ops = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => b !== 0 ? a / b : 0,
  }

  return rows.map(row => {
    const a = parseFloat(row[colA]) || 0
    const b = parseFloat(row[colB]) || 0
    const c = parseFloat(row[colC]) || 0

    // 执行运算: (A op1 B) op2 C
    const intermediate = ops[operator1](a, b)
    const result = ops[operator2](intermediate, c)

    return {
      ...row,
      __result: isFinite(result) ? result : 0,
    }
  })
}

/**
 * 排序数据
 * @param {object[]} rows - 数据行
 * @param {string} order - 'asc' | 'desc'
 * @returns {object[]} 排序后的数据
 */
export const sortByResult = (rows, order) => {
  const multiplier = order === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => (a.__result - b.__result) * multiplier)
}

/**
 * 导出为 Excel 文件
 * @param {string[]} headers - 表头
 * @param {object[]} rows - 数据行
 * @param {string} resultColumnName - 结果列名称
 */
export const exportToExcel = (headers, rows, resultColumnName = '运算结果') => {
  const exportHeaders = [...headers, resultColumnName]

  const exportData = rows.map(row => {
    const exportRow = {}
    headers.forEach(h => { exportRow[h] = row[h] })
    exportRow[resultColumnName] = row.__result
    return exportRow
  })

  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: exportHeaders })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '运算结果')

  // 下载文件
  XLSX.writeFile(workbook, `excel_运算结果_${Date.now()}.xlsx`)
}


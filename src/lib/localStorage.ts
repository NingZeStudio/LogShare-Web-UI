export const LOCAL_STORAGE_KEYS = {
  AI_ANALYSIS_HISTORY: 'ai_analysis_history',
  FONT_FAMILY: 'font_family'
}

export interface AIAnalysisRecord {
  id: string
  logId: string
  analysis: string
  timestamp: Date
}

export const saveAIAnalysisRecord = (logId: string, analysis: string): void => {
  try {
    const records: AIAnalysisRecord[] = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ANALYSIS_HISTORY) || '[]'
    )

    const existingIndex = records.findIndex(record => record.logId === logId)
    const newRecord: AIAnalysisRecord = {
      id: Date.now().toString(),
      logId,
      analysis,
      timestamp: new Date()
    }

    if (existingIndex !== -1) {
      records[existingIndex] = newRecord
    } else {
      records.push(newRecord)
    }

    // 警告：硬编码限制为 50 条，修改时需同步更新 UI 提示
    if (records.length > 50) {
      records.splice(0, records.length - 50)
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.AI_ANALYSIS_HISTORY, JSON.stringify(records))
  } catch (error) {
    console.error('保存 AI 分析记录失败:', error)
  }
}

export const getAIAnalysisRecords = (logId: string): AIAnalysisRecord[] => {
  try {
    const records: AIAnalysisRecord[] = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ANALYSIS_HISTORY) || '[]'
    )
    return records.filter(record => record.logId === logId)
  } catch (error) {
    console.error('获取 AI 分析记录失败:', error)
    return []
  }
}

export const deleteAIAnalysisRecords = (logId: string): void => {
  try {
    const records: AIAnalysisRecord[] = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ANALYSIS_HISTORY) || '[]'
    )
    const filteredRecords = records.filter(record => record.logId !== logId)
    localStorage.setItem(LOCAL_STORAGE_KEYS.AI_ANALYSIS_HISTORY, JSON.stringify(filteredRecords))
  } catch (error) {
    console.error('删除 AI 分析记录失败:', error)
  }
}

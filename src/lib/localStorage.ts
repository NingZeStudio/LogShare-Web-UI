export const LOCAL_STORAGE_KEYS = {
  AI_ANALYSIS_HISTORY: 'ai_analysis_history',
  USER_LOG_RECORDS: 'user_log_records',
  PAGE_TITLE: 'page_title',
  FONT_FAMILY: 'font_family'
}

export interface AIAnalysisRecord {
  id: string
  logId: string
  analysis: string
  timestamp: Date
}

export interface UserLogRecord {
  id: string
  title: string
  timestamp: Date
}

/**
 * 存储 AI 分析记录
 * @param logId - 日志 ID
 * @param analysis - 分析结果
 */
export const saveAIAnalysisRecord = (logId: string, analysis: string): void => {
  try {
    const records: AIAnalysisRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ANALYSIS_HISTORY) || '[]')

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

    if (records.length > 50) {
      records.splice(0, records.length - 50)
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.AI_ANALYSIS_HISTORY, JSON.stringify(records))
  } catch (error) {
    console.error('保存 AI 分析记录失败:', error)
  }
}

/**
 * 获取特定日志的 AI 分析记录
 * @param logId - 日志 ID
 * @returns 分析记录数组
 */
export const getAIAnalysisRecords = (logId: string): AIAnalysisRecord[] => {
  try {
    const records: AIAnalysisRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ANALYSIS_HISTORY) || '[]')
    return records.filter(record => record.logId === logId)
  } catch (error) {
    console.error('获取 AI 分析记录失败:', error)
    return []
  }
}

/**
 * 获取所有 AI 分析记录
 * @returns 所有分析记录
 */
export const getAllAIAnalysisRecords = (): AIAnalysisRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ANALYSIS_HISTORY) || '[]')
  } catch (error) {
    console.error('获取所有 AI 分析记录失败:', error)
    return []
  }
}

/**
 * 删除特定日志的 AI 分析记录
 * @param logId - 日志 ID
 */
export const deleteAIAnalysisRecords = (logId: string): void => {
  try {
    const records: AIAnalysisRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.AI_ANALYSIS_HISTORY) || '[]')
    const filteredRecords = records.filter(record => record.logId !== logId)
    localStorage.setItem(LOCAL_STORAGE_KEYS.AI_ANALYSIS_HISTORY, JSON.stringify(filteredRecords))
  } catch (error) {
    console.error('删除 AI 分析记录失败:', error)
  }
}

/**
 * 保存用户日志记录
 * @param id - 日志 ID
 * @param title - 日志标题
 */
export const saveUserLogRecord = (id: string, title: string): void => {
  try {
    const records: UserLogRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.USER_LOG_RECORDS) || '[]')

    const existingIndex = records.findIndex(record => record.id === id)
    const newRecord: UserLogRecord = {
      id,
      title,
      timestamp: new Date()
    }

    if (existingIndex !== -1) {
      records[existingIndex] = newRecord
    } else {
      records.push(newRecord)
    }

    if (records.length > 50) {
      records.splice(0, records.length - 50)
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_LOG_RECORDS, JSON.stringify(records))
  } catch (error) {
    console.error('保存用户日志记录失败:', error)
  }
}

/**
 * 获取所有用户日志记录
 * @returns 用户日志记录数组
 */
export const getUserLogRecords = (): UserLogRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.USER_LOG_RECORDS) || '[]')
  } catch (error) {
    console.error('获取用户日志记录失败:', error)
    return []
  }
}

/**
 * 删除特定用户日志记录
 * @param id - 日志 ID
 */
export const deleteUserLogRecord = (id: string): void => {
  try {
    const records: UserLogRecord[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.USER_LOG_RECORDS) || '[]')
    const filteredRecords = records.filter(record => record.id !== id)
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_LOG_RECORDS, JSON.stringify(filteredRecords))
  } catch (error) {
    console.error('删除用户日志记录失败:', error)
  }
}

/**
 * 清空所有本地存储数据
 */
export const clearAllLocalStorageData = (): void => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AI_ANALYSIS_HISTORY)
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_LOG_RECORDS)
  } catch (error) {
    console.error('清空本地存储数据失败:', error)
  }
}

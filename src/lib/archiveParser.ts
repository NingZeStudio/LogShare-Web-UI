import JSZip from 'jszip'

// 支持的文本文件扩展名
const TEXT_EXTENSIONS = ['.txt', '.log', '.yml', '.yaml', '.json', '.xml', '.cfg', '.conf', '.properties', '.toml']

// 检查是否为文本文件
export const isTextFile = (filename: string): boolean => {
  const lowerName = filename.toLowerCase()
  return TEXT_EXTENSIONS.some(ext => lowerName.endsWith(ext))
}

// 检查是否为支持的压缩包格式
export const isArchiveFile = (filename: string): boolean => {
  const lowerName = filename.toLowerCase()
  return lowerName.endsWith('.zip')
}

// 提取的文件接口
export interface ExtractedFile {
  name: string
  content: string
  size: number
  path: string // 压缩包内的完整路径
}

// 解析 ZIP 文件
export const parseZipFile = async (file: File): Promise<ExtractedFile[]> => {
  const zip = new JSZip()
  const contents: ExtractedFile[] = []
  
  try {
    const zipInstance = await zip.loadAsync(file)
    
    const promises: Promise<void>[] = []
    
    zipInstance.forEach((relativePath, entry) => {
      if (entry.dir || !isTextFile(relativePath)) {
        return
      }
      
      const promise = (async () => {
        try {
          const content = await entry.async('string')
          contents.push({
            name: entry.name.split('/').pop() || relativePath,
            content,
            size: content.length,
            path: relativePath
          })
        } catch (e) {
          console.warn(`Failed to read entry ${relativePath}:`, e)
        }
      })()
      
      promises.push(promise)
    })
    
    await Promise.all(promises)
    
    return contents
  } catch (e) {
    console.error('Failed to parse ZIP file:', e)
    throw new Error('无法解析 ZIP 文件')
  }
}

// 解析压缩包文件（自动检测格式）
export const parseArchive = async (file: File): Promise<ExtractedFile[]> => {
  const lowerName = file.name.toLowerCase()
  
  if (lowerName.endsWith('.zip')) {
    return parseZipFile(file)
  } else {
    throw new Error('不支持的压缩包格式，仅支持 ZIP 格式')
  }
}

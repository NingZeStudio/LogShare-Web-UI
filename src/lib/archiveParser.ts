import JSZip from 'jszip'

const TEXT_EXTENSIONS = ['.txt', '.log', '.yml', '.yaml', '.json', '.xml', '.cfg', '.conf', '.properties', '.toml']

export interface ExtractedFile {
  name: string
  content: string
  size: number
  path: string
}

/**
 * 检查文件是否为支持的文本文件
 * @param filename - 文件名
 * @returns 是否为文本文件
 */
export const isTextFile = (filename: string): boolean => {
  const lowerName = filename.toLowerCase()
  return TEXT_EXTENSIONS.some(ext => lowerName.endsWith(ext))
}

/**
 * 检查文件是否为支持的压缩包格式
 * @param filename - 文件名
 * @returns 是否为压缩包
 */
export const isArchiveFile = (filename: string): boolean => {
  const lowerName = filename.toLowerCase()
  return lowerName.endsWith('.zip')
}

/**
 * 解析 ZIP 文件并提取所有文本文件
 * @param file - ZIP 文件
 * @returns 提取的文件数组
 */
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

/**
 * 解析压缩包文件（自动检测格式）
 * @param file - 压缩包文件
 * @returns 提取的文件数组
 */
export const parseArchive = async (file: File): Promise<ExtractedFile[]> => {
  const lowerName = file.name.toLowerCase()

  if (lowerName.endsWith('.zip')) {
    return parseZipFile(file)
  } else {
    throw new Error('不支持的压缩包格式，仅支持 ZIP 格式')
  }
}

import JSZip from 'jszip'

const TEXT_EXTENSIONS = [
  '.txt',
  '.log',
  '.yml',
  '.yaml',
  '.json',
  '.xml',
  '.cfg',
  '.conf',
  '.properties',
  '.toml'
]

export interface ExtractedFile {
  name: string
  content: string
  size: number
  path: string
}

export const isTextFile = (filename: string): boolean => {
  const lowerName = filename.toLowerCase()
  return TEXT_EXTENSIONS.some(ext => lowerName.endsWith(ext))
}

export const isArchiveFile = (filename: string): boolean => {
  const lowerName = filename.toLowerCase()
  return lowerName.endsWith('.zip')
}

// 警告：ZIP 解析在浏览器端进行，大文件可能导致内存问题
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

// 已知屎山：仅支持 ZIP 格式，扩展其他格式需修改此函数和 isArchiveFile
export const parseArchive = async (file: File): Promise<ExtractedFile[]> => {
  const lowerName = file.name.toLowerCase()

  if (lowerName.endsWith('.zip')) {
    return parseZipFile(file)
  } else {
    throw new Error('不支持的压缩包格式，仅支持 ZIP 格式')
  }
}

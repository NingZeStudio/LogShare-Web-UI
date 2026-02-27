/**
 * 解析日志内容为 HTML 格式
 * @param raw - 原始日志文本
 * @param showLineNumbers - 是否显示行号
 * @returns HTML 格式的日志内容
 */
export function parseLog(raw: string, showLineNumbers: boolean = true): string {
  const lines = raw.split('\n')

  if (!showLineNumbers) {
    let html = '<div class="log-simple">'
    lines.forEach((line, index) => {
      if (lines.length === index + 1 && line === '') return

      let level = 'info'
      if (line.match(/(\/|: |\[)WARN(ING)?(\]|:| )/i)) level = 'warning'
      else if (line.match(/(\/|: |\[)(ERR(OR)?|FATAL|SEVERE)(\]|:| )/i)) level = 'error'
      else if (line.match(/(\/|: |\[)(DEBUG)(\]|:| )/i)) level = 'debug'

      const entryClass = level === 'error' ? 'entry-error' : 'entry-no-error'
      const levelClass = `level-${level}`
      let formatted = formatContent(line)

      html += `<div class="log-line-simple ${entryClass}"><span class="level ${levelClass}">${formatted}</span></div>`
    })
    html += '</div>'
    return html
  }

  let html = '<table class="log-table">'

  lines.forEach((line, index) => {
    if (lines.length === index + 1 && line === '') return

    const lineNumber = index + 1
    let level = 'info'

    if (line.match(/(\/|: |\[)WARN(ING)?(\]|:| )/i)) level = 'warning'
    else if (line.match(/(\/|: |\[)(ERR(OR)?|FATAL|SEVERE)(\]|:| )/i)) level = 'error'
    else if (line.match(/(\/|: |\[)(DEBUG)(\]|:| )/i)) level = 'debug'
    else if (/\b[A-Za-z0-9_$]*(?:Exception|Error|Throwable)\b/.test(line)) level = 'error'

    const entryClass = level === 'error' ? 'entry-error' : 'entry-no-error'
    const levelClass = `level-${level}`
    let formatted = formatContent(line)

    html += `<tr class="log-row ${entryClass}" id="L${lineNumber}">
      <td class="line-num">${lineNumber}</td>
      <td class="line-content"><span class="level ${levelClass}">${formatted}</span></td>
    </tr>`
  })

  html += '</table>'
  return html
}

function formatContent(text: string): string {
  let out = text.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  out = out.replace(/&lt;mark&gt;/gi, '<mark>')
    .replace(/&lt;\/mark&gt;/gi, '</mark>')

  const styleMap: Record<string, string> = {
    '0': 'format-black', '1': 'format-darkblue', '2': 'format-darkgreen', '3': 'format-darkaqua',
    '4': 'format-darkred', '5': 'format-darkpurple', '6': 'format-gold', '7': 'format-gray',
    '8': 'format-darkgray', '9': 'format-blue', 'a': 'format-green', 'b': 'format-aqua',
    'c': 'format-red', 'd': 'format-lightpurple', 'e': 'format-yellow', 'f': 'format-white',
    'k': 'format-obfuscated', 'l': 'format-bold', 'm': 'format-strike', 'n': 'format-underline',
    'o': 'format-italic', 'r': 'format-reset'
  }

  out = out.replace(/§([0-9a-fk-or])/gi, (match, code) => {
    const cls = styleMap[code.toLowerCase()]
    if (cls) {
      return `<span class="${cls}">`
    }
    return match
  })

  // Java stack trace highlighting - match lines starting with "at " (including indented)
  if (/^\s*at\s+/.test(text)) {
    out = out.replace(
      /^(\s*)(at\s+)([^(]+)(\(([^)]+)\))?/,
      (_match, indent, atKeyword, className, _paren, location) => {
        const locationHtml = location ? `<span class="level-stack-location">(${location})</span>` : ''
        return `${indent}<span class="level-stack-frame">${atKeyword}<span class="level-stack-class">${className}</span>${locationHtml}</span>`
      }
    )
  }

  // Match "Caused by:" lines
  out = out.replace(
    /^(Caused by:\s*)(.+)$/,
    '<span class="level-stack-caused-by">$1</span><span class="level-stack-exception">$2</span>'
  )

  // Match exception lines (lines containing Exception/Error/Throwable without "at ")
  // Match all exception class names in the line (e.g., java.io.UncheckedIOException)
  if (!/^\s*at\s+/.test(text) && /[A-Za-z0-9_$]*(?:Exception|Error|Throwable)\b/.test(text)) {
    // Match exception class name with optional package prefix
    out = out.replace(
      /([A-Za-z0-9_$]+(?:\.[A-Za-z0-9_$]+)*\.)?([A-Za-z0-9_$]*(?:Exception|Error|Throwable))\b/g,
      '<span class="level-stack-exception">$1$2</span>'
    )
  }

  // Highlight INFO level prefix [xxx/INFO] with green
  out = out.replace(
    /(\[[^\]]*\/INFO\])/g,
    '<span class="level-info-prefix">$1</span>'
  )

  // Highlight timestamp [HH:MM:SS] with blue
  out = out.replace(
    /(\[\d{1,2}:\d{2}:\d{2}\])/g,
    '<span class="level-timestamp">$1</span>'
  )

  return out
}

// ======================== 常量定义 ========================

const COLOR_STYLE_MAP: Record<string, string> = {
  '0': 'format-black',
  '1': 'format-darkblue',
  '2': 'format-darkgreen',
  '3': 'format-darkaqua',
  '4': 'format-darkred',
  '5': 'format-darkpurple',
  '6': 'format-gold',
  '7': 'format-gray',
  '8': 'format-darkgray',
  '9': 'format-blue',
  a: 'format-green',
  b: 'format-aqua',
  c: 'format-red',
  d: 'format-lightpurple',
  e: 'format-yellow',
  f: 'format-white',
  k: 'format-obfuscated',
  l: 'format-bold',
  m: 'format-strike',
  n: 'format-underline',
  o: 'format-italic',
  r: 'format-reset'
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
}

// ======================== 预编译正则 ========================

const RE_HTML_ESCAPE = /[&<>"']/g

const RE_MARK_OPEN = /&lt;mark&gt;/gi
const RE_MARK_CLOSE = /&lt;\/mark&gt;/gi

const RE_COLOR_CODE = /§([0-9a-fk-or])/gi

// ----- 日志级别检测 -----

const RE_WARN = /(?:\[|: |(?:\/\s))WARN(?:ING)?(?:]|:|\s)/i
const RE_ERROR_LEVEL = /(?:\[|: |(?:\/\s))(?:ERR(?:OR)?|FATAL|CRITICAL|EMERGENCY|SEVERE)(?:]|:|\s)/i
const RE_DEBUG = /(?:\[|: |(?:\/\s))(?:DEBUG|TRACE)(?:]|:|\s)/i
const RE_NOTICE = /(?:\[|: |(?:\/\s))NOTICE(?:]|:|\s)/i

// ----- Java 异常 / 堆栈 -----

const RE_EXCEPTION_NAME = /\b[A-Za-z0-9_$]*(?:Exception|Error|Throwable)\b/
const RE_STACK_AT = /^\s*at\s+/
const RE_CAUSED_BY = /^Caused by:\s*/
const RE_STACK_FRAME = /^(\s*)(at\s+)([^(]+)(\(([^)]+)\))?/
const RE_EXCEPTION_CLASS =
  /([A-Za-z0-9_$]+(?:\.[A-Za-z0-9_$]+)*\.)?([A-Za-z0-9_$]*(?:Exception|Error|Throwable))\b/g
const RE_MORE_STACK = /^\s*\.\.\.\s+\d+\s+more\s*$/
const RE_SUPPRESSED = /^\s*Suppressed:\s+/

// ----- Python 异常 / 回溯 -----

const RE_PYTHON_TRACEBACK = /^Traceback\s*\(most\s+recent\s+call\s+last\)\s*:\s*$/
const RE_PYTHON_FILE = /^\s*File\s+"[^"]*",\s+line\s+\d+/i

// ----- 通用错误关键词 -----

const RE_ERROR_PREFIX = /^(?:\s*\[?\s*)?(?:(?:ERROR?\s*[:;]|FATAL\s*[:;]|CRITICAL\s*[:;]))/i
const RE_FAIL_KEYWORDS =
  /\b(?:Failed\s+to|Cannot\s+|Unable\s+to|Could\s+not|Illegal\s+|Invalid\s+|Unsupported\s+|Not\s+found\s*[:;]|Missing\s+)/i

// ----- 杂项高亮 -----

const RE_THREAD_PREFIX = /(\[[^\]]+\/(?:INFO|WARN(?:ING)?|ERROR?|FATAL|DEBUG|TRACE|NOTICE)\])/g

const RE_BRACKET_TAG =
  /(?:^|\s)(\[[A-Za-z0-9_\u00a1-\uffff][A-Za-z0-9_\u00a1-\uffff .\-/]{0,32}\])(?=\s|$)/g

/* RE_TIMESTAMP / RE_TIMESTAMP_ISO / RE_FILEPATH_UNIX / RE_IPV4 / RE_INLINE_ERROR
   已移至下方 RE_COMMON_HIGHLIGHTS 合并扫描 */

const RE_FATAL_LEVEL = /\b(?:FATAL|CRITICAL|EMERGENCY)\b/i

// ----- 模组列表 -----

const RE_MOD_LIST_HEADER = /(?:Loading\s+\d*\s*mods?\s*:?|--\s*Mod\s+List\s*--|Mod\s+List:?)\s*$/i

const RE_MOD_ENTRY = /(\s+[-*]\s+)([A-Za-z_][\w.\-]*)((?:\s+|@))(\S[\S ]*)$/

const RE_MOD_TABLE_HEADER = /^\|\s*(?:Id|Name|Version|Status)\s*\|/i

const RE_MOD_TABLE_ROW =
  /^(\|\s+)([\w.\-]+)(\s+\|\s+)(\S[\S ]*?)(\s+\|\s+)([^|]+?)(\s+\|\s+)(\S[\S ]*?)(\s+\|)$/

const RE_FABRIC_LOADER_HEADER = /Loading\s+Minecraft\s+[\d.]+\s+with\s+Fabric\s+Loader\s+\S+/i

const RE_MOD_TREE_ENTRY = /^(\s*)([|\\]--\s+)([A-Za-z_][\w.\-]*)((?:\s+|@))(\S[\S ]*)$/

const RE_NEOCRSH_MOD_ROW =
  /^(.+?\.jar)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+?)\s*\|\s*(Manifest:\s*\S+)/i

const RE_NEOMOD_LIST_HEADER = /^\s*Name\s+Version\s+\(Mod\s+Id\)\s*$/i

const RE_NEOMOD_LIST_ITEM = /^\s*(?!\[)(.+?)\s+\(([a-z_][\w.\-]*)\)$/

// ----- 环境变量 / DLOPEN / 启动参数 -----

const RE_ARGS_LINE = /(?:ModLauncher\s+running:\s*args|JVM\s*Args?:|^\s*--\w)/i

const RE_ARG_FLAG = /(--[A-Za-z_][\w.-]*)/g

// ======================== 缓存 ---------------------------

class LRUCache<V> {
  private capacity: number
  private cache: Map<string, V>

  constructor(capacity: number) {
    this.capacity = capacity
    this.cache = new Map()
  }

  get(key: string): V | undefined {
    if (!this.cache.has(key)) return undefined
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key: string, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }
}

const formatCache = new LRUCache<string>(2000)

// ======================== Trie 树 ========================

class TrieNode {
  children: Map<string, TrieNode> = new Map()
  id: number = -1
}

class Trie {
  root: TrieNode = new TrieNode()

  insert(word: string, id: number): void {
    let node = this.root
    for (const ch of word) {
      let child = node.children.get(ch)
      if (!child) {
        child = new TrieNode()
        node.children.set(ch, child)
      }
      node = child
    }
    node.id = id
  }
}

function isWordChar(ch: string): boolean {
  return (
    (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch === '_'
  )
}

/**
 * 在文本中查找 Trie 关键词，返回带单词边界校验的匹配列表。
 * 对大写、小写、首字母大写三种形态各插入一份，覆盖常见写法。
 */
function trieCollect(text: string, trie: Trie): Array<{ start: number; end: number; id: number }> {
  const results: Array<{ start: number; end: number; id: number }> = []
  const len = text.length

  for (let i = 0; i < len; i++) {
    let node = trie.root
    let j = i

    while (j < len) {
      const ch = text[j]!
      const child = node.children.get(ch)
      if (!child) break
      node = child
      j++
      if (node.id !== -1) {
        const prev = i > 0 ? text[i - 1]! : ' '
        const next = j < len ? text[j]! : ' '
        if (!isWordChar(prev) && !isWordChar(next)) {
          results.push({ start: i, end: j, id: node.id })
        }
      }
    }
  }

  return results
}

/**
 * 用 Trie 一次扫描完成关键词高亮替换。
 * matches 需已按 start 排序，函数会去重（忽略重叠）。
 */
function trieHighlight(
  text: string,
  matches: Array<{ start: number; end: number; id: number }>,
  classMap: Record<number, string>
): string {
  if (matches.length === 0) return text

  const parts: string[] = []
  let lastEnd = 0

  for (const m of matches) {
    if (m.start < lastEnd) continue
    parts.push(text.slice(lastEnd, m.start))
    parts.push('<span class="' + classMap[m.id] + '">')
    parts.push(text.slice(m.start, m.end))
    parts.push('</span>')
    lastEnd = m.end
  }
  parts.push(text.slice(lastEnd))

  return parts.join('')
}

// 环境关键字 Trie: success / failed / DLOPEN / dlopen
const ENV_KEYWORD_MAP: Record<number, string> = {
  0: 'level-mod-status-ok',
  1: 'level-mod-status-ok',
  2: 'level-mod-status-ok',
  3: 'level-mod-status-error',
  4: 'level-mod-status-error',
  5: 'level-mod-status-error',
  6: 'level-env-key',
  7: 'level-env-key'
}

function buildEnvTrie(): Trie {
  const t = new Trie()
  // success (case variants)
  t.insert('success', 0)
  t.insert('Success', 1)
  t.insert('SUCCESS', 2)
  // failed (case variants)
  t.insert('failed', 3)
  t.insert('Failed', 4)
  t.insert('FAILED', 5)
  // DLOPEN / dlopen
  t.insert('DLOPEN', 6)
  t.insert('dlopen', 7)
  return t
}

const envKeywordTrie = buildEnvTrie()

// ======================== 日志级别分类 ========================

type LogLevel = 'error' | 'warning' | 'debug' | 'info' | 'fatal'

// 级别/异常/错误关键词 Trie，用于 getLevel 快速预筛
function buildLevelTrie(): Trie {
  const t = new Trie()
  let id = 0
  const add = (w: string) => t.insert(w, id++)
  add('FATAL')
  add('CRITICAL')
  add('EMERGENCY')
  add('SEVERE')
  add('ERROR')
  add('ERR')
  add('WARN')
  add('WARNING')
  add('DEBUG')
  add('TRACE')
  add('NOTICE')
  add('Exception')
  add('Throwable')
  add('Caused')
  add('Suppressed')
  add('Traceback')
  add('Failed')
  add('Cannot')
  add('Unable')
  add('Could')
  add('Illegal')
  add('Invalid')
  add('Unsupported')
  add('Missing')
  add('Stacktrace:')
  add('Details:')
  return t
}
const levelTrie = buildLevelTrie()

function getLevel(line: string): LogLevel {
  // 1. 结构化模式检查（无需关键词预筛）
  if (RE_PYTHON_TRACEBACK.test(line)) return 'error'
  if (RE_PYTHON_FILE.test(line)) return 'error'
  if (RE_STACK_AT.test(line)) return 'error'
  if (RE_CAUSED_BY.test(line)) return 'error'
  if (RE_MORE_STACK.test(line)) return 'error'
  if (RE_SUPPRESSED.test(line)) return 'error'
  if (RE_EXCEPTION_NAME.test(line)) return 'error'
  if (RE_ERROR_PREFIX.test(line)) return 'error'

  // 崩溃报告标记行 → error 背景
  if (/^\s*(?:Stacktrace|Details):/.test(line)) return 'error'
  if (/^-- Affected level --$/.test(line)) return 'error'

  // 2. Trie 预筛：若行中不含任何级别/失败关键词，跳过剩下全部 regex
  const levelHits = trieCollect(line, levelTrie)
  if (levelHits.length === 0) return 'info'

  // 3. 关键词类 regex
  if (RE_FATAL_LEVEL.test(line)) return 'fatal'
  if (RE_ERROR_LEVEL.test(line)) return 'error'
  if (RE_WARN.test(line)) return 'warning'
  if (RE_DEBUG.test(line)) return 'debug'
  if (RE_NOTICE.test(line)) return 'info'

  if (
    /^\s*(?:Failed\s+to|Cannot\s+|Unable\s+to|Could\s+not|Illegal\s+|Invalid\s+|Unsupported\s+|Not\s+found\s*[:;]|Missing\s+)/i.test(
      line
    )
  ) {
    return 'error'
  }

  if (RE_FAIL_KEYWORDS.test(line)) return 'warning'

  return 'info'
}

// ======================== HTML 转义与格式化 ========================

function escapeHtml(text: string): string {
  return text.replace(RE_HTML_ESCAPE, ch => HTML_ESCAPE_MAP[ch] || ch)
}

/**
 * 合并常用高亮模式为单次扫描，替代多次独立的 replace 调用。
 * 匹配：时间戳 | ISO时间戳 | 文件路径 | IPv4 | 行内错误关键词
 */
const RE_COMMON_HIGHLIGHTS =
  /(\[\d{1,2}:\d{2}:\d{2}(?:[.,]\d{3,6})?\])|(\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?\b)|(\/(?:[A-Za-z0-9_.@-]+(?:\/[A-Za-z0-9_.@-]+)+))|(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d{2,5})?\b)|(\b(?:Error|Exception|Warning|Fatal|Critical)\b)/g

function applyCommonHighlights(out: string): string {
  return out.replace(RE_COMMON_HIGHLIGHTS, (match, ts, isots, fp, ip, errword) => {
    if (ts) return '<span class="level-timestamp">' + ts + '</span>'
    if (isots) return '<span class="level-timestamp">' + isots + '</span>'
    if (fp) return '<span class="level-filepath">' + fp + '</span>'
    if (ip) return '<span class="level-dimmed">' + ip + '</span>'
    if (errword) return '<span class="level-error-word">' + errword + '</span>'
    return match
  })
}

function formatContent(text: string): string {
  // 缓存命中直接返回
  const cached = formatCache.get(text)
  if (cached !== undefined) return cached

  let out = escapeHtml(text)

  // ---- 恢复搜索高亮 ----
  out = out.replace(RE_MARK_OPEN, '<mark>').replace(RE_MARK_CLOSE, '</mark>')

  // ---- Minecraft § 颜色码 ----
  out = out.replace(RE_COLOR_CODE, (_match, code) => {
    const cls = COLOR_STYLE_MAP[code.toLowerCase() as keyof typeof COLOR_STYLE_MAP]
    return cls ? '<span class="' + cls + '">' : _match
  })

  // ---- Java 堆栈帧 ----
  if (RE_STACK_AT.test(text)) {
    out = out.replace(RE_STACK_FRAME, (_, indent, atKw, className, _paren, location) => {
      const locHtml = location ? '<span class="level-stack-location">(' + location + ')</span>' : ''
      return (
        indent +
        '<span class="level-stack-frame">' +
        atKw +
        '<span class="level-stack-class">' +
        className +
        '</span>' +
        locHtml +
        '</span>'
      )
    })
  }

  // ---- "Caused by" / "Suppressed" ----
  out = out.replace(
    /^(Caused by:\s*)(.+)$/m,
    '<span class="level-stack-caused-by">$1</span><span class="level-stack-exception">$2</span>'
  )
  out = out.replace(
    /^(Suppressed:\s*)(.+)$/m,
    '<span class="level-stack-caused-by">$1</span><span class="level-stack-exception">$2</span>'
  )

  // ---- Java 异常类名高亮 ----
  if (!RE_STACK_AT.test(text) && RE_EXCEPTION_NAME.test(text)) {
    out = out.replace(RE_EXCEPTION_CLASS, '<span class="level-stack-exception">$1$2</span>')
  }

  // ---- Python 回溯帧 ----
  if (RE_PYTHON_FILE.test(text)) {
    out = out.replace(
      /^(\s*File\s+)("[^"]*")(\s*,\s*line\s+)(\d+)/i,
      '<span class="level-stack-frame">$1</span><span class="level-stack-location">$2$3</span><span class="level-stack-class">$4</span>'
    )
  }
  if (RE_PYTHON_TRACEBACK.test(text)) {
    out = out.replace(
      /^(Traceback\s*\()(most recent call last)(\)\s*:\s*)$/,
      '<span class="level-stack-frame">$1</span><span class="level-stack-location">$2</span><span class="level-stack-frame">$3</span>'
    )
  }

  // ---- Minecraft [Thread/LEVEL] 前缀 ----
  out = out.replace(RE_THREAD_PREFIX, match => {
    const sepIdx = match.lastIndexOf('/')
    if (sepIdx === -1) return match
    const thread = match.slice(0, sepIdx) + '/'
    const level = match.slice(sepIdx + 1, -1)
    const levelLower = level.toLowerCase()
    const levelClass =
      levelLower === 'error' || levelLower === 'fatal'
        ? 'level-error-word'
        : levelLower === 'warn' || levelLower === 'warning'
          ? 'level-warning-tag'
          : 'level-info-prefix'
    return (
      '<span class="level-thread">' +
      escapeHtml(thread) +
      '</span><span class="' +
      levelClass +
      '">' +
      escapeHtml(level) +
      '</span>]'
    )
  })

  // ---- 模组列表相关 ----

  if (RE_MOD_LIST_HEADER.test(text)) {
    if (/--\s*Mod\s+List\s*--/i.test(text)) {
      out = out.replace(
        /^(\s*)(--\s*Mod\s+List\s*--)(\s*)$/,
        '$1<span class="level-mod-header">$2</span>$3'
      )
    } else if (/Mod\s+List:?/i.test(text)) {
      out = out.replace(
        /^(.*?)(Mod\s+List:?)(.*)$/i,
        '$1<span class="level-mod-header">$2</span>$3'
      )
    } else {
      out = out.replace(
        /^(.*?)(Loading\s+\d*\s*mods?\s*:?)(.*)$/i,
        '$1<span class="level-mod-header">$2</span>$3'
      )
    }
  }

  if (RE_MOD_ENTRY.test(text)) {
    out = out.replace(
      RE_MOD_ENTRY,
      '$1<span class="level-mod-id">$2</span>$3<span class="level-mod-version">$4</span>'
    )
  }

  if (RE_MOD_TABLE_HEADER.test(text)) {
    out = out.replace(/^(\|)([\s\w|]+)(\|)$/, (_, open, body, close) => {
      const cells = body.split('|').map((c: string) => c.trim())
      const wrapped = cells
        .map((c: string) => '<span class="level-mod-header">' + c + '</span>')
        .join(' | ')
      return open + ' ' + wrapped + ' ' + close
    })
  }

  if (RE_MOD_TABLE_ROW.test(text)) {
    out = out.replace(
      RE_MOD_TABLE_ROW,
      (_match, open, id, sep1, version, sep2, name, sep3, status, close) => {
        const statusClean = status.trim().toLowerCase()
        let statusClass = 'level-mod-status'
        if (statusClean === 'ok' || statusClean === 'done') {
          statusClass += ' level-mod-status-ok'
        } else if (
          statusClean === 'error' ||
          statusClean === 'missing' ||
          statusClean === 'outdated'
        ) {
          statusClass += ' level-mod-status-error'
        } else if (statusClean === 'warning') {
          statusClass += ' level-mod-status-warn'
        }
        return (
          open +
          '<span class="level-mod-id">' +
          id +
          '</span>' +
          sep1 +
          '<span class="level-mod-version">' +
          version +
          '</span>' +
          sep2 +
          '<span class="level-mod-name">' +
          name.trim() +
          '</span>' +
          sep3 +
          '<span class="' +
          statusClass +
          '">' +
          status.trim() +
          '</span>' +
          close
        )
      }
    )
  }

  if (RE_FABRIC_LOADER_HEADER.test(text)) {
    out = out.replace(RE_FABRIC_LOADER_HEADER, '<span class="level-mod-header">$&</span>')
  }

  if (RE_MOD_TREE_ENTRY.test(text)) {
    out = out.replace(
      RE_MOD_TREE_ENTRY,
      '$1<span class="level-mod-tree">$2</span><span class="level-mod-id">$3</span>$4<span class="level-mod-version">$5</span>'
    )
  }

  if (RE_NEOCRSH_MOD_ROW.test(text)) {
    out = out.replace(
      RE_NEOCRSH_MOD_ROW,
      '<span class="level-mod-dim">$1</span> | <span class="level-mod-name">$2</span> | <span class="level-mod-id">$3</span> | <span class="level-mod-version">$4</span> | <span class="level-mod-status">$5</span>'
    )
  }

  if (RE_NEOMOD_LIST_HEADER.test(text)) {
    out = out.replace(RE_NEOMOD_LIST_HEADER, '<span class="level-mod-header">$&</span>')
  }

  if (RE_NEOMOD_LIST_ITEM.test(text)) {
    out = out.replace(
      RE_NEOMOD_LIST_ITEM,
      '<span class="level-mod-name">$1</span> (<span class="level-mod-id">$2</span>)'
    )
  }

  // ---- 通用 [插件名] 标记 ----
  out = out.replace(RE_BRACKET_TAG, match => {
    const tag = match.trim()
    if (tag.length > 40) return match
    return '<span class="level-plugin">' + escapeHtml(tag) + '</span>'
  })

  // ---- 一次扫描完成：时间戳 / 文件路径 / IPv4 / 错误关键词 ----
  out = applyCommonHighlights(out)

  // ---- 分隔线 / 环境变量 / DLOPEN / 启动参数 ----

  // 分隔线头部：用 [^=\n]* 替代 .*? 避免灾难性回溯
  out = out.replace(
    /^(={5,})\s*([^=\n]*)\s*(={5,})$/m,
    '<span class="level-section-header">$&</span>'
  )

  out = out.replace(
    /^(\s*)((?:Added\s+)?[Ee]nv\s*:\s*)/m,
    '$1<span class="level-env-key">$2</span>'
  )

  // 环境关键词高亮（Trie 单次扫描替代 4 条 regex）
  const envMatches = trieCollect(out, envKeywordTrie)
  if (envMatches.length > 0) {
    envMatches.sort((a, b) => a.start - b.start)
    out = trieHighlight(out, envMatches, ENV_KEYWORD_MAP)
  }

  out = out.replace(
    /(Environment:\s*)(Environment\[[^\]]*\])/g,
    '$1<span class="level-env-key">$2</span>'
  )

  if (RE_ARGS_LINE.test(text)) {
    out = out.replace(RE_ARG_FLAG, '<span class="level-arg-flag">$1</span>')
    out = out.replace(/(^|\s)(-D[A-Za-z_][\w.]*)/gm, '$1<span class="level-arg-flag">$2</span>')
  }

  // ---- 崩溃报告标记 (Stacktrace: / Details: / -- Affected level --) ----
  out = out.replace(/\b(Stacktrace:|Details:)/g, '<span class="level-section-marker">$1</span>')
  out = out.replace(/^-- Affected level --$/m, '<span class="level-section-header">$&</span>')

  // 写入缓存
  formatCache.set(text, out)
  return out
}

// ======================== 分组逻辑 ========================

interface Group {
  start: number
  level: LogLevel
  lines: string[]
}

function groupLines(lines: string[]): Group[] {
  const n = lines.length
  const groups: Group[] = []
  let current: Group | null = null

  for (let i = 0; i < n; i++) {
    const line = lines[i]
    if (i === n - 1 && line === '') continue
    if (!line) continue

    const level = getLevel(line)
    const isHighlight = level === 'error' || level === 'warning' || level === 'fatal'

    if (isHighlight) {
      const groupLevel = level === 'fatal' ? 'error' : level
      if (current && current.level === groupLevel) {
        current.lines.push(line)
      } else {
        if (current) groups.push(current)
        current = { start: i, level: groupLevel, lines: [line] }
      }
    } else {
      if (current) {
        groups.push(current)
        current = null
      }
      groups.push({ start: i, level: 'info', lines: [line] })
    }
  }
  if (current) groups.push(current)

  return groups
}

// ======================== 渲染函数 ========================

function renderSimple(lines: string[]): string {
  const n = lines.length
  const parts: string[] = ['<div class="log-simple">']

  for (let i = 0; i < n; i++) {
    const line = lines[i]
    if (!line || (i === n - 1 && line === '')) continue

    const level = getLevel(line)
    const isErrStyle = level === 'error' || level === 'fatal'
    parts.push(
      '<div class="log-line-simple ' + (isErrStyle ? 'entry-error' : 'entry-no-error') + '">',
      '<span class="level level-' + level + '">',
      formatContent(line),
      '</span></div>'
    )
  }

  parts.push('</div>')
  return parts.join('')
}

function renderWithLineNumbers(lines: string[]): string {
  const groups = groupLines(lines)
  const parts: string[] = ['<table class="log-table"><tbody>']

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]!
    const { lines: gLines, level: gLevel, start } = group
    const isInformational = gLevel === 'info' || gLevel === 'debug'

    if (isInformational) {
      for (let li = 0; li < gLines.length; li++) {
        const lineIndex = start + li
        const lineNumber = lineIndex + 1
        const line = gLines[li]!
        const lineLevel = getLevel(line)
        const isErrStyle = lineLevel === 'error' || lineLevel === 'fatal'
        const entryClass = isErrStyle ? 'entry-error' : 'entry-no-error'

        parts.push(
          '<tr class="log-row ' + entryClass + '" id="L' + lineNumber + '">',
          '<td class="line-num">' + lineNumber + '</td>',
          '<td class="line-content"><span class="level level-' + lineLevel + '">',
          formatContent(line),
          '</span></td></tr>'
        )
      }
    } else {
      const rowClass = gLevel === 'error' ? 'entry-error' : 'entry-warning'
      const bgClass = 'bg-' + gLevel + '-group'

      let lineNumbersHtml: string | null = null

      for (let li = 0; li < gLines.length; li++) {
        const lineIndex = start + li
        const lineNumber = lineIndex + 1
        const line = gLines[li]!

        if (li === 0) {
          if (lineNumbersHtml === null) {
            const nums: string[] = new Array(gLines.length)
            for (let k = 0; k < gLines.length; k++) {
              nums[k] = String(start + k + 1)
            }
            lineNumbersHtml = nums.join('<br>')
          }
          parts.push(
            '<tr class="log-row ' + rowClass + ' ' + bgClass + '" id="L' + lineNumber + '">',
            '<td class="line-num" rowspan="' + gLines.length + '">' + lineNumbersHtml + '</td>',
            '<td class="line-content"><span class="level level-' + gLevel + '">',
            formatContent(line),
            '</span></td></tr>'
          )
        } else {
          parts.push(
            '<tr class="log-row ' + rowClass + ' ' + bgClass + '" id="L' + lineNumber + '">',
            '<td class="line-content"><span class="level level-' + gLevel + '">',
            formatContent(line),
            '</span></td></tr>'
          )
        }
      }
    }
  }

  parts.push('</tbody></table>')
  return parts.join('')
}

function parseLogWorker(raw: string, showLineNumbers: boolean = true): string {
  const lines = raw.split('\n')

  if (!showLineNumbers) {
    return renderSimple(lines)
  }

  return renderWithLineNumbers(lines)
}

// ======================== Worker 入口 ========================

self.onmessage = (e: MessageEvent<{ type: string; raw: string; showLineNumbers: boolean }>) => {
  if (e.data.type === 'parse') {
    try {
      const html = parseLogWorker(e.data.raw, e.data.showLineNumbers)
      ;(self as unknown as { postMessage: (msg: unknown) => void }).postMessage({
        type: 'result',
        html
      })
    } catch (err) {
      ;(self as unknown as { postMessage: (msg: unknown) => void }).postMessage({
        type: 'error',
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }
}

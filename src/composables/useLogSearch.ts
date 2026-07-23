import { ref } from 'vue'
import { parseLog } from '@/lib/logParser'
import { t } from '@/lib/i18n'

export function useLogSearch(getOriginalText: () => string, setLogContent: (html: string) => void) {
  const searchTerm = ref('')
  const searchIndex = ref(0)
  const searchResults = ref<number[]>([])

  const performSearch = () => {
    const originalLogText = getOriginalText()

    if (!searchTerm.value.trim()) {
      setLogContent(parseLog(originalLogText))
      searchResults.value = []
      searchIndex.value = 0
      return
    }

    const lines = originalLogText.split('\n')
    const results: number[] = []
    const matchingLines: string[] = []

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase()
      const searchTerms = searchTerm.value
        .toLowerCase()
        .split(/\s+/)
        .filter(t => t.length > 0)

      if (searchTerms.length > 0 && searchTerms.every(term => lowerLine.includes(term))) {
        results.push(index)

        let highlightedLine = line
        const sortedTerms = [...searchTerms].sort((a, b) => b.length - a.length)

        sortedTerms.forEach(term => {
          const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(`(${escapedTerm})`, 'gi')
          highlightedLine = highlightedLine.replace(regex, '<mark>$1</mark>')
        })

        matchingLines.push(highlightedLine)
      }
    })

    if (matchingLines.length > 0) {
      setLogContent(parseLog(matchingLines.join('\n')))
    } else {
      setLogContent(
        `<div class="text-center p-8 text-muted-foreground">${t('no_results')}</div>`
      )
    }

    searchResults.value = results
    searchIndex.value = 0

    if (results.length === 0) {
      alert(t('no_results'))
    }
  }

  const scrollToSearchResult = (_index: number) => {
    const element = document.querySelector('.log-content')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const goToNextResult = () => {
    if (searchResults.value.length === 0) return
    searchIndex.value = (searchIndex.value + 1) % searchResults.value.length
    scrollToSearchResult(searchResults.value[searchIndex.value]!)
  }

  const goToPrevResult = () => {
    if (searchResults.value.length === 0) return
    const len = searchResults.value.length
    searchIndex.value = (searchIndex.value - 1 + len) % searchResults.value.length
    scrollToSearchResult(searchResults.value[searchIndex.value]!)
  }

  const handleSearchInput = (event: KeyboardEvent) => {
    if (event.key === 'Enter') performSearch()
  }

  return {
    searchTerm,
    searchIndex,
    searchResults,
    performSearch,
    goToNextResult,
    goToPrevResult,
    handleSearchInput
  }
}

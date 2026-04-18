import { zhCN, zhTW, type LanguagePack, type LanguageCode } from './i18nConfig'

export const detectSystemLanguage = (): LanguageCode => {
  const preferredLang = localStorage.getItem('preferred_language')
  if (preferredLang === 'zh-CN' || preferredLang === 'zh-TW') {
    return preferredLang as LanguageCode
  }

  const systemLang = navigator.language || (navigator as any).userLanguage

  if (
    systemLang &&
    (systemLang.startsWith('zh-HK') ||
      systemLang.startsWith('zh-MO') ||
      systemLang.startsWith('zh-TW') ||
      systemLang === 'zh-Hant')
  ) {
    return 'zh-TW'
  }
  return 'zh-CN'
}

export const getCurrentLanguagePack = (): LanguagePack => {
  const lang = detectSystemLanguage()
  return lang === 'zh-TW' ? zhTW : zhCN
}

let currentLangPack: LanguagePack = getCurrentLanguagePack()

export const updateCurrentLanguagePack = () => {
  currentLangPack = getCurrentLanguagePack()
}

export const t = (key: string): string => {
  return currentLangPack[key as keyof typeof currentLangPack] || key
}

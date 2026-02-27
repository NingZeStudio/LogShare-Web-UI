/**
 * 国际化 (i18n) 实现模块
 * 提供语言检测、语言包管理和翻译功能
 */

import { zhCN, zhTW, type LanguagePack, type LanguageCode } from './i18nConfig'

/**
 * 检测系统语言并返回对应的语言代码
 * @returns 语言代码 ('zh-CN' 或 'zh-TW')
 */
export const detectSystemLanguage = (): LanguageCode => {
  const preferredLang = localStorage.getItem('preferred_language');
  if (preferredLang === 'zh-CN' || preferredLang === 'zh-TW') {
    return preferredLang as LanguageCode;
  }

  const systemLang = navigator.language || (navigator as any).userLanguage;

  if (systemLang && (
    systemLang.startsWith('zh-HK') ||  // 香港繁体
    systemLang.startsWith('zh-MO') ||  // 澳门繁体
    systemLang.startsWith('zh-TW') ||  // 台湾繁体
    systemLang === 'zh-Hant'           // 繁体中文
  )) {
    return 'zh-TW';
  }
  return 'zh-CN';
};

/**
 * 获取当前语言包
 * @returns 当前使用的语言包
 */
export const getCurrentLanguagePack = (): LanguagePack => {
  const lang = detectSystemLanguage();
  return lang === 'zh-TW' ? zhTW : zhCN;
};

// 当前语言包
let currentLangPack: LanguagePack = getCurrentLanguagePack();

/**
 * 更新当前语言包的函数
 */
export const updateCurrentLanguagePack = () => {
  currentLangPack = getCurrentLanguagePack();
};

/**
 * 翻译函数
 * @param key - 要翻译的键值
 * @returns 翻译后的字符串
 */
export const t = (key: string): string => {
  return currentLangPack[key as keyof typeof currentLangPack] || key;
};

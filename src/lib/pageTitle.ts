export const pageTitleTemplates = {
  home: '首页 - LogShare.CN',
  log: (title?: string, id?: string) => `${title || '日志'}${id ? ` [#${id}]` : ''} - LogShare.CN`,
  apiDocs: 'API 文档 - LogShare.CN',
  sponsor: '赞助支持 - LogShare.CN',
  tutorials: '教程中心 - LogShare.CN',
  tutorialArticle: (title?: string) => `${title || '教程'} - LogShare.CN`,
  groups: '群列表 - LogShare.CN',
  terms: '服务协议 - LogShare.CN',
  privacy: '隐私政策 - LogShare.CN',
  notFound: '页面未找到 - LogShare.CN'
}

export const getPageTitle = (
  template: keyof typeof pageTitleTemplates | string,
  params?: { title?: string; id?: string }
): string => {
  if (typeof template === 'string' && template in pageTitleTemplates) {
    const templateFn = pageTitleTemplates[template as keyof typeof pageTitleTemplates]
    if (typeof templateFn === 'function') {
      return templateFn(params?.title, params?.id)
    }
    return templateFn
  } else if (typeof template === 'string') {
    return template
  }
  return 'LogShare.CN'
}

export const setPageTitle = (
  template: keyof typeof pageTitleTemplates | string,
  params?: { title?: string; id?: string }
) => {
  const title = getPageTitle(template, params)

  if (typeof document !== 'undefined') {
    document.title = title
  }

  return title
}

export const getCurrentPageTemplate = (routeName: string | undefined) => {
  switch (routeName) {
    case 'home':
      return 'home'
    case 'log':
      return 'log'
    case 'api-docs':
      return 'apiDocs'
    case 'sponsor':
      return 'sponsor'
    case 'tutorials':
      return 'tutorials'
    case 'tutorial-article':
      return 'tutorialArticle'
    case 'groups':
      return 'groups'
    case 'terms':
      return 'terms'
    case 'privacy':
      return 'privacy'
    default:
      return 'notFound'
  }
}

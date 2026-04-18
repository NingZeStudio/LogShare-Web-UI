export const pageTitleTemplates = {
  home: '首页 - LogShare.CN',
  log: (title?: string, id?: string) => `${title || '日志'}${id ? ` [#${id}]` : ''} - LogShare.CN`,
  apiDocs: 'API 文档 - LogShare.CN',
  sponsor: '赞助支持 - LogShare.CN',
  tutorials: '教程中心 - LogShare.CN',
  tutorialArticle: (title?: string) => `${title || '教程'} - LogShare.CN`,
  notFound: '页面未找到 - LogShare.CN'
}

export const setPageTitle = (
  template: keyof typeof pageTitleTemplates | string,
  params?: { title?: string; id?: string }
) => {
  let title = ''

  if (typeof template === 'string' && template in pageTitleTemplates) {
    const templateFn = pageTitleTemplates[template as keyof typeof pageTitleTemplates]
    if (typeof templateFn === 'function') {
      title = templateFn(params?.title, params?.id)
    } else {
      title = templateFn
    }
  } else if (typeof template === 'string') {
    title = template
  } else {
    title = 'LogShare.CN'
  }

  document.title = title
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
    default:
      return 'notFound'
  }
}

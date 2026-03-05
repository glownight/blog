export const DEFAULT_LOCALE = 'zh-CN' as const

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const MESSAGES = {
  'zh-CN': {
    // Common
    'common.back': '返回',
    'common.noPostsYet': '暂无文章。',
    'common.noTagsYet': '暂无标签。',
    'common.tableOfContents': '目录',
    'common.blogPostsList': '博客文章列表',
    'common.toggleSidebar': '切换侧边栏',
    'common.backToTop': '返回顶部',
    'common.notAvailable': '暂无',
    'common.loading': '加载中...',
    'common.linkCopied': '链接已复制！',

    // Locale
    'locale.switchAria': '切换语言',
    'locale.switchToEnglish': '切换到英文',
    'locale.switchToChinese': '切换到中文',

    // Header
    'nav.blog': '博客',
    'nav.projects': '项目',
    'nav.about': '关于',
    'nav.search': '搜索',
    'nav.darkTheme': '深色主题',
    'nav.menu': '菜单',

    // Home
    'home.sectionToday': '今天',
    'home.sectionPosts': '文章',
    'home.moreAboutMe': '更多关于我',
    'home.morePosts': '更多文章',
    'home.title': '首页',
    'home.location': '中国',
    'home.githubLabel': 'GitHub',
    'home.todayTodoTitle': '今日梦想清单：',
    'home.todoReadBook': '[✓] 读完一本好书',
    'home.todoCheerUp': '[✓] 对自己说加油',

    // Blog
    'blog.title': '博客',
    'blog.metaDescription': '博客文章与归档',
    'blog.pageSummary': '第 {{current}} 页 - 显示 {{shown}} / {{total}} 篇文章',
    'blog.viewByYears': '按年份查看所有文章 →',
    'blog.tagsTitle': '标签',
    'blog.viewAllTags': '查看全部 →',
    'blog.viewByYearsAria': '按年份查看全部文章',
    'blog.viewAllTagsAria': '查看全部标签',
    'blog.prevPosts': '← 上一页文章',
    'blog.nextPosts': '下一页文章 →',

    // Archives
    'archives.title': '归档',
    'archives.metaDescription': '按年份查看全部文章',
    'archives.postCount': '{{count}} 篇',

    // Tags
    'tags.allTitle': '全部标签',
    'tags.metaDescription': '按标签查看全部文章主题',
    'tags.title': '标签',
    'tagPosts.metaDescription': '查看标签 {{tag}} 下的全部文章',
    'tagPosts.titlePrefix': '标签：',
    'tagPosts.prev': '← 上一页标签',
    'tagPosts.next': '下一页标签 →',

    // Search
    'search.title': '搜索',
    'search.metaDescription': '搜索全站博客内容',
    'search.prompt': '输入关键词以搜索博客',
    'search.disabled': '搜索功能未启用。',

    // About
    'about.title': '关于',
    'about.headingProfile': '我是谁',
    'about.profileIntro': '目前主要做全栈开发，日常会结合 AI 提升开发效率，也会一些 C++。',
    'about.headingBlog': '关于这个站点',
    'about.blogIntro': '这个站点主要记录全栈开发实践、AI 辅助开发经验，以及部分 C++ 学习与项目。',

    // Links
    'links.title': '友链',
    'links.randomHint': '顺序是随机的，每次刷新都可能不同。',
    'links.sectionCommon': '常用友链',
    'links.sectionSpecial': '特别推荐',
    'links.sectionApply': '申请友链',
    'links.sectionCircle': '友链动态',
    'links.badStatusTitle': '状态异常的友链',
    'links.historyTitle': '友链历史记录',
    'links.siteInfoIntro': '本站信息（点击即可复制）：',
    'links.applyIntro': '申请时请按模板留言，并确认以下条件：',
    'links.ruleRecommended': '你已在自己的站点中添加本站友链。',
    'links.ruleAlive': '你的站点可正常访问。',
    'links.ruleLegal': '内容合规，不违反相关法律法规。',
    'links.loading': '加载中...',
    'links.copyToClipboard': '已复制「{{value}}」到剪贴板！',

    // Projects
    'projects.title': '项目',
    'projects.sectionOverview': '项目概览',
    'projects.intro': '这里用于展示我的项目和实践。',

    // Promise
    'promise.title': '承诺',
    'promise.metaDescription': '承诺',
    'promise.leadPrefix': '这是一个',
    'promise.leadHighlight': '承诺',
    'promise.classicalQuote': '「徒临川以羡鱼，俟河清乎未期」',
    'promise.chasingPrefix': '追逐那束',
    'promise.chasingHighlight': '光',
    'promise.chasingSuffix': '，即使遥不可及。',

    // Header Toast
    'header.themeSet': '已切换主题：{{theme}}',
    'theme.system': '跟随系统',
    'theme.light': '浅色',
    'theme.dark': '深色',

    // Component
    'friendList.empty': '这里还没有内容。',
    'quote.loading': '加载中...',
    'github.loadingDescription': '正在等待 api.github.com...',
    'github.descriptionNotSet': '暂无描述',
    'github.fetchFailed': '获取数据失败',
    'github.notAvailable': '暂无',
    'copyright.author': '作者',
    'copyright.publishedAt': '发布于',
    'copyright.linkCopied': '链接已复制！',
    'waline.loadingFallback': '评论似乎卡住了，尝试刷新页面？✨',
    'waline.likeSuffix': '次赞',

    // 404
    'error404.description': '页面未找到',
    'error404.oops': '哎呀，出了点问题。',
    'error404.notFound': '抱歉，找不到你访问的页面。',
    'error404.backHome': '返回首页'
  },
  'en-US': {
    // Common
    'common.back': 'Back',
    'common.noPostsYet': 'No posts yet.',
    'common.noTagsYet': 'No tags yet.',
    'common.tableOfContents': 'Table of Contents',
    'common.blogPostsList': 'Blog posts list',
    'common.toggleSidebar': 'Toggle sidebar',
    'common.backToTop': 'Back to top',
    'common.notAvailable': 'N/A',
    'common.loading': 'Loading...',
    'common.linkCopied': 'Link copied!',

    // Locale
    'locale.switchAria': 'Switch language',
    'locale.switchToEnglish': 'Switch to English',
    'locale.switchToChinese': 'Switch to Chinese',

    // Header
    'nav.blog': 'Blog',
    'nav.projects': 'Projects',
    'nav.about': 'About',
    'nav.search': 'Search',
    'nav.darkTheme': 'Dark Theme',
    'nav.menu': 'Menu',

    // Home
    'home.sectionToday': 'Today',
    'home.sectionPosts': 'Posts',
    'home.moreAboutMe': 'More about me',
    'home.morePosts': 'More posts',
    'home.title': 'Home',
    'home.location': 'China',
    'home.githubLabel': 'GitHub',
    'home.todayTodoTitle': "Today's dream checklist:",
    'home.todoReadBook': '[ ] Finish a good book',
    'home.todoKeepSmile': '[✓] Keep smiling',
    'home.todoCheerUp': '[✓] Tell yourself: keep going',

    // Blog
    'blog.title': 'Blog',
    'blog.metaDescription': 'Posts and archives from the blog',
    'blog.pageSummary': 'Page {{current}} - Showing {{shown}} of {{total}} posts',
    'blog.viewByYears': 'View all posts by years →',
    'blog.tagsTitle': 'Tags',
    'blog.viewAllTags': 'View all →',
    'blog.viewByYearsAria': 'View all posts by year',
    'blog.viewAllTagsAria': 'View all tags',
    'blog.prevPosts': '← Previous Posts',
    'blog.nextPosts': 'Next Posts →',

    // Archives
    'archives.title': 'Archives',
    'archives.metaDescription': 'View all posts by year',
    'archives.postCount': '{{count}} posts',

    // Tags
    'tags.allTitle': 'All Tags',
    'tags.metaDescription': 'A list of all topics used in blog posts',
    'tags.title': 'Tags',
    'tagPosts.metaDescription': 'View all posts with the tag {{tag}}',
    'tagPosts.titlePrefix': 'Tag:',
    'tagPosts.prev': '← Previous Tags',
    'tagPosts.next': 'Next Tags →',

    // Search
    'search.title': 'Search',
    'search.metaDescription': 'Search posts across the whole site',
    'search.prompt': 'Enter keywords to search blog posts',
    'search.disabled': 'Pagefind is disabled.',

    // About
    'about.title': 'About',
    'about.headingProfile': 'Who Am I',
    'about.profileIntro':
      'I mainly work on frontend development, use AI in daily coding workflows, and have some C++ experience.',
    'about.headingBlog': 'About This Site',
    'about.blogIntro':
      'This site shares frontend practice, AI-assisted development notes, and some C++ learning/projects.',

    // Links
    'links.title': 'Links',
    'links.randomHint': 'The order is random and may change on each refresh.',
    'links.sectionCommon': 'Common Links',
    'links.sectionSpecial': 'Special Links',
    'links.sectionApply': 'Apply Links',
    'links.sectionCircle': 'Friend Circle',
    'links.badStatusTitle': 'Links with Bad Status',
    'links.historyTitle': 'Link History Book',
    'links.siteInfoIntro': 'Site information (click to copy):',
    'links.applyIntro': 'Please follow this template when applying, and make sure:',
    'links.ruleRecommended': 'You have added this site to your links page.',
    'links.ruleAlive': 'Your site is reachable and active.',
    'links.ruleLegal': 'Your content complies with local laws and regulations.',
    'links.loading': 'Loading...',
    'links.copyToClipboard': 'Copied "{{value}}" to clipboard!',

    // Projects
    'projects.title': 'Projects',
    'projects.sectionOverview': 'Overview',
    'projects.intro': 'This page showcases my projects and hands-on work.',

    // Promise
    'promise.title': 'Promise',
    'promise.metaDescription': 'Promise',
    'promise.leadPrefix': 'This is a',
    'promise.leadHighlight': 'promise',
    'promise.classicalQuote':
      '"To stand by a river envying fish is futile; waiting for clear waters may never end."',
    'promise.chasingPrefix': 'Chasing a',
    'promise.chasingHighlight': 'light',
    'promise.chasingSuffix': 'beyond reach.',

    // Header Toast
    'header.themeSet': 'Theme set to {{theme}}',
    'theme.system': 'System',
    'theme.light': 'Light',
    'theme.dark': 'Dark',

    // Component
    'friendList.empty': 'Nothing here.',
    'quote.loading': 'Loading...',
    'github.loadingDescription': 'Waiting for api.github.com...',
    'github.descriptionNotSet': 'Description not set',
    'github.fetchFailed': 'Failed to fetch data',
    'github.notAvailable': 'N/A',
    'copyright.author': 'Author',
    'copyright.publishedAt': 'Published at',
    'copyright.linkCopied': 'Link copied!',
    'waline.loadingFallback': 'Comment seems stuck. Try refreshing?✨',
    'waline.likeSuffix': 'Like(s)',

    // 404
    'error404.description': 'Not found',
    'error404.oops': 'Oops, something went wrong.',
    'error404.notFound': "Sorry, we couldn't find your page.",
    'error404.backHome': 'Back to home'
  }
} as const

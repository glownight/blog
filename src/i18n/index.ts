import { DEFAULT_LOCALE, MESSAGES, SUPPORTED_LOCALES, type Locale } from './messages'

export { DEFAULT_LOCALE, MESSAGES, SUPPORTED_LOCALES, type Locale }

export function normalizeLocale(input?: string | null): Locale {
  if (!input) return DEFAULT_LOCALE

  if (SUPPORTED_LOCALES.includes(input as Locale)) {
    return input as Locale
  }

  const normalized = input.toLowerCase()
  if (normalized.startsWith('zh')) return 'zh-CN'
  if (normalized.startsWith('en')) return 'en-US'
  return DEFAULT_LOCALE
}

export function t(
  key: keyof (typeof MESSAGES)['zh-CN'] | string,
  vars: Record<string, string | number> = {},
  locale: Locale = DEFAULT_LOCALE
) {
  const localeMessages = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE]
  const fallbackMessages = MESSAGES[DEFAULT_LOCALE]
  const template =
    (localeMessages as Record<string, string>)[key] ??
    (fallbackMessages as Record<string, string>)[key] ??
    key

  return template.replace(/\{\{(\w+)\}\}/g, (_, varName: string) => {
    const value = vars[varName]
    return value === undefined ? '' : String(value)
  })
}


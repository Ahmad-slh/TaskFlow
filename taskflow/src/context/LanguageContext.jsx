import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { DirectionProvider } from '@radix-ui/react-direction'
import en from '@/i18n/en'
import ar from '@/i18n/ar'

const DICTIONARIES = { en, ar }
const STORAGE_KEY = 'lang'

const LanguageContext = createContext(null)

/** Resolve a dot-path like "dashboard.welcome" against a nested dictionary. */
function resolve(dict, key) {
  return key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), dict)
}

/** Replace {placeholders} in a string with values from `vars`. */
function interpolate(str, vars) {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  )
}

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'ar' || stored === 'en' ? stored : 'en'
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage)

  const dir = language === 'ar' ? 'rtl' : 'ltr'

  // Keep <html lang/dir> and the stored preference in sync with the active language.
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = dir
    window.localStorage.setItem(STORAGE_KEY, language)
  }, [language, dir])

  const setLanguage = useCallback((lang) => {
    if (lang !== 'ar' && lang !== 'en') return
    window.localStorage.setItem(STORAGE_KEY, lang)
    setLanguageState(lang)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ar' : 'en')
  }, [language, setLanguage])

  // t(key, vars): look up the active dictionary, fall back to English, then the raw key.
  const t = useCallback(
    (key, vars) => {
      const value = resolve(DICTIONARIES[language], key) ?? resolve(DICTIONARIES.en, key)
      if (typeof value !== 'string') return key
      return interpolate(value, vars)
    },
    [language]
  )

  const value = useMemo(
    () => ({ language, dir, setLanguage, toggleLanguage, t }),
    [language, dir, setLanguage, toggleLanguage, t]
  )

  // DirectionProvider lets Radix primitives (Select, DropdownMenu, Dialog…) mirror in RTL.
  return (
    <LanguageContext.Provider value={value}>
      <DirectionProvider dir={dir}>{children}</DirectionProvider>
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useTranslation must be used within a LanguageProvider')
  return ctx
}

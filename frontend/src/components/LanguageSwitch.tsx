import type { Language } from '../i18n'

interface Props {
  language: Language
  label: string
  variant?: 'default' | 'ocean'
  onChange: (language: Language) => void
}

export function LanguageSwitch({ language, label, variant = 'default', onChange }: Props) {
  return (
    <div className={`language-switch ${variant}`} aria-label={label} role="group">
      <button
        className={language === 'en' ? 'is-active' : ''}
        aria-pressed={language === 'en'}
        onClick={() => onChange('en')}
      >
        EN
      </button>
      <button
        className={language === 'zh' ? 'is-active' : ''}
        aria-pressed={language === 'zh'}
        onClick={() => onChange('zh')}
      >
        中文
      </button>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { CreateView } from './views/CreateView'
import { OceanView } from './views/OceanView'
import { COPY, type Language } from './i18n'
import { hasDrawn, loadLanguage, rememberFish, saveLanguage } from './storage'
import type { Fish } from './types'

export default function App() {
  const [language, setLanguage] = useState<Language>(loadLanguage)
  // 画过鱼的人（本机记录）刷新后直接进大海，不再要求重新绘制
  const [view, setView] = useState<'create' | 'ocean'>(hasDrawn() ? 'ocean' : 'create')
  const [myFish, setMyFish] = useState<Fish | null>(null)

  useEffect(() => {
    const t = COPY[language]
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    document.title = t.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.metaDescription)
    saveLanguage(language)
  }, [language])

  if (view === 'ocean') {
    return (
      <OceanView
        myFish={myFish}
        language={language}
        onLanguageChange={setLanguage}
        onAddFish={() => {
          setMyFish(null)
          setView('create')
        }}
      />
    )
  }

  return (
    <CreateView
      language={language}
      onLanguageChange={setLanguage}
      // 已经画过的人才能中途返回大海
      canReturn={hasDrawn()}
      onCancel={() => setView('ocean')}
      onDone={(fish) => {
        rememberFish(fish)
        setMyFish(fish)
        setView('ocean')
      }}
    />
  )
}

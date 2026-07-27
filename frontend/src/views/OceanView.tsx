import { useEffect, useRef, useState } from 'react'
import { Button } from 'animal-island-ui'
import { fetchFishes, subscribeFishes } from '../api'
import { AdminLoginModal } from '../components/AdminLoginModal'
import { LanguageSwitch } from '../components/LanguageSwitch'
import { COPY, type Language } from '../i18n'
import { OceanEngine } from '../ocean/engine'
import type { Fish } from '../types'

interface Props {
  /** 刚放生的鱼；从大海直接进来（刷新后）时为 null */
  myFish: Fish | null
  language: Language
  onLanguageChange: (language: Language) => void
  onAddFish: () => void
  onAdmin: (token: string) => void
}

type Toast = { kind: 'load-error' } | { kind: 'released'; name: string }

export function OceanView({ myFish, language, onLanguageChange, onAddFish, onAdmin }: Props) {
  const t = COPY[language]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<OceanEngine | null>(null)
  const adminClickCountRef = useRef(0)
  const adminClickTimerRef = useRef<number | undefined>(undefined)
  const [total, setTotal] = useState(0)
  const [toast, setToast] = useState<Toast | null>(null)
  const [adminVisible, setAdminVisible] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new OceanEngine(canvas, language)
    engineRef.current = engine
    if (myFish) engine.setHighlight(myFish.id)
    engine.start()

    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)

    let cancelled = false
    fetchFishes(120)
      .then((list) => {
        if (cancelled) return
        engine.setFishes(list)
        // 自己刚放生的鱼通常已在列表里（提交时就入库了），
        // addFish 会按 id 去重，重复时只弹名字牌不再多画一条
        if (myFish) engine.addFish(myFish, true)
        setTotal(engine.count)
      })
      .catch(() => setToast({ kind: 'load-error' }))

    const unsub = subscribeFishes(
      (fish) => {
        // 自己提交的鱼也会被广播回来，去重后不重复计数、不重复提示
        if (!engine.addFish(fish, true)) return
        setTotal(engine.count)
        setToast({ kind: 'released', name: fish.name })
        window.setTimeout(() => setToast(null), 2600)
      },
      (fishId) => {
        if (engine.removeFish(fishId)) setTotal(engine.count)
      },
    )

    return () => {
      cancelled = true
      unsub()
      engine.stop()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [myFish])

  useEffect(() => {
    engineRef.current?.setLanguage(language)
  }, [language])

  useEffect(() => () => window.clearTimeout(adminClickTimerRef.current), [])

  const onAdminTrigger = () => {
    window.clearTimeout(adminClickTimerRef.current)
    adminClickCountRef.current += 1
    if (adminClickCountRef.current >= 3) {
      adminClickCountRef.current = 0
      setAdminVisible(true)
      return
    }
    adminClickTimerRef.current = window.setTimeout(() => {
      adminClickCountRef.current = 0
    }, 1200)
  }

  const onTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    engineRef.current?.handleTap(e.clientX, e.clientY)
  }

  return (
    <div className="ocean-view">
      <canvas
        ref={canvasRef}
        aria-label={t.ocean.canvasLabel}
        onPointerDown={onTap}
        className="ocean-canvas"
      />

      <header className="ocean-header">
        <div className="ocean-brand">
          <span
            className="brand-mark admin-trigger"
            aria-hidden="true"
            onClick={onAdminTrigger}
          ><span /></span>
          <div>
            <strong>{t.title}</strong>
            <span>{t.ocean.count(total)}</span>
          </div>
        </div>
        <div className="ocean-actions">
          {adminVisible && (
            <Button type="text" size="small" className="admin-entry-button" onClick={() => setLoginOpen(true)}>
              {t.ocean.manage}
            </Button>
          )}
          <LanguageSwitch
            language={language}
            label={t.languageLabel}
            variant="ocean"
            onChange={onLanguageChange}
          />
          <Button
            type="primary"
            size="small"
            icon={<span aria-hidden="true">＋</span>}
            onClick={onAddFish}
            className="add-fish-button"
          >
            {t.ocean.addFish}
          </Button>
        </div>
      </header>

      <div className="ocean-tip">
        <span aria-hidden="true">⌁</span>
        {t.ocean.tip}
      </div>

      {toast && (
        <div className="ocean-toast">
          {toast.kind === 'load-error' ? t.errors.loadFailed : t.ocean.released(toast.name)}
        </div>
      )}

      {loginOpen && (
        <AdminLoginModal
          language={language}
          onClose={() => setLoginOpen(false)}
          onSuccess={onAdmin}
        />
      )}
    </div>
  )
}

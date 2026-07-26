import { useEffect, useRef, useState } from 'react'
import { fetchFishes, subscribeFishes } from '../api'
import { theme } from '../theme'
import { OceanEngine } from '../ocean/engine'
import type { Fish } from '../types'

interface Props {
  myFish: Fish | null
  onBack: () => void
}

export function OceanView({ myFish, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<OceanEngine | null>(null)
  const [total, setTotal] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new OceanEngine(canvas)
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
        setTotal(list.length)
        // 自己的鱼从边缘游入并弹出名字
        if (myFish) engine.addFish(myFish, true)
      })
      .catch(() => setToast('鱼群加载失败，检查后端是否已启动'))

    const unsub = subscribeFishes((fish) => {
      engine.addFish(fish, true)
      setTotal((n) => n + 1)
      setToast(`${fish.name} 放生了一条鱼`)
      window.setTimeout(() => setToast(null), 2600)
    })

    return () => {
      cancelled = true
      unsub()
      engine.stop()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [myFish])

  const onTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    engineRef.current?.handleTap(e.clientX, e.clientY)
  }

  return (
    <div style={wrap}>
      <canvas
        ref={canvasRef}
        onPointerDown={onTap}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />

      <div style={hud}>
        <button onClick={onBack} style={ghostBtn}>
          ← 再画一条
        </button>
        <span style={counter}>海里有 {total} 条鱼 · 点一下鱼看看是谁画的</span>
      </div>

      {toast && <div style={toastStyle}>{toast}</div>}
    </div>
  )
}

const wrap: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: theme.deepBottom,
  fontFamily: theme.font,
  overflow: 'hidden',
}

const hud: React.CSSProperties = {
  position: 'absolute',
  top: 'max(14px, env(safe-area-inset-top))',
  left: 14,
  right: 14,
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
  pointerEvents: 'none',
}

const ghostBtn: React.CSSProperties = {
  pointerEvents: 'auto',
  padding: '8px 14px',
  borderRadius: 999,
  border: `1px solid ${theme.panelBorder}`,
  background: 'rgba(6, 32, 45, 0.55)',
  color: theme.ink,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
  backdropFilter: 'blur(6px)',
}

const counter: React.CSSProperties = {
  fontSize: 12.5,
  color: theme.inkDim,
  background: 'rgba(6, 32, 45, 0.45)',
  padding: '6px 12px',
  borderRadius: 999,
  backdropFilter: 'blur(6px)',
}

const toastStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 'max(22px, env(safe-area-inset-bottom))',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '10px 18px',
  borderRadius: 999,
  background: 'rgba(6, 32, 45, 0.85)',
  border: `1px solid ${theme.accentDim}`,
  color: theme.ink,
  fontSize: 13.5,
  whiteSpace: 'nowrap',
  backdropFilter: 'blur(6px)',
}

import { useEffect, useRef, useState } from 'react'
import { fetchFishes, subscribeFishes } from '../api'
import { OceanEngine } from '../ocean/engine'
import type { Fish } from '../types'

interface Props {
  /** 刚放生的鱼；从大海直接进来（刷新后）时为 null */
  myFish: Fish | null
  onAddFish: () => void
}

export function OceanView({ myFish, onAddFish }: Props) {
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
        // 自己刚放生的鱼通常已在列表里（提交时就入库了），
        // addFish 会按 id 去重，重复时只弹名字牌不再多画一条
        if (myFish) engine.addFish(myFish, true)
        setTotal(engine.count)
      })
      .catch(() => setToast('鱼群加载失败，检查后端是否已启动'))

    const unsub = subscribeFishes((fish) => {
      // 自己提交的鱼也会被广播回来，去重后不重复计数、不重复提示
      if (!engine.addFish(fish, true)) return
      setTotal(engine.count)
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
    <div className="ocean-view">
      <canvas
        ref={canvasRef}
        onPointerDown={onTap}
        className="ocean-canvas"
      />

      <header className="ocean-header">
        <div className="ocean-brand">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <div>
            <strong>深海共创</strong>
            <span>海里有 {total} 条鱼</span>
          </div>
        </div>
        <button onClick={onAddFish} className="add-fish-button">
          <span aria-hidden="true">＋</span> 添加一条鱼
        </button>
      </header>

      <div className="ocean-tip">
        <span aria-hidden="true">⌁</span>
        点按看名字 · 双击听它说话
      </div>

      {toast && <div className="ocean-toast">{toast}</div>}
    </div>
  )
}

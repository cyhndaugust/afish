import { useCallback, useEffect, useImperativeHandle, useRef, forwardRef } from 'react'
import { CANVAS_H, CANVAS_W, type Point, type Stroke } from '../types'

export interface DrawCanvasHandle {
  undo: () => void
  clear: () => void
  getStrokes: () => Stroke[]
}

interface Props {
  color: string
  size: number
  eraser: boolean
  showGuide: boolean
  onChange: (strokeCount: number) => void
}

/** 橡皮判定半径系数：擦除时命中笔触即整笔删除，简单直观 */
const ERASER_HIT = 1.2

function dist(a: Point, b: [number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

export const DrawCanvas = forwardRef<DrawCanvasHandle, Props>(function DrawCanvas(
  { color, size, eraser, showGuide, onChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const currentRef = useRef<Stroke | null>(null)
  const drawingRef = useRef(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    if (showGuide) drawGuide(ctx)

    const all = currentRef.current
      ? [...strokesRef.current, currentRef.current]
      : strokesRef.current
    for (const s of all) paintStroke(ctx, s)
    ctx.restore()
  }, [showGuide])

  // 初始化尺寸（含 dpr）
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = CANVAS_W * dpr
    canvas.height = CANVAS_H * dpr
    redraw()
  }, [redraw])

  useEffect(redraw, [redraw])

  useImperativeHandle(ref, () => ({
    undo() {
      strokesRef.current = strokesRef.current.slice(0, -1)
      onChange(strokesRef.current.length)
      redraw()
    },
    clear() {
      strokesRef.current = []
      onChange(0)
      redraw()
    },
    getStrokes: () => strokesRef.current,
  }))

  /** 屏幕坐标 → 画布逻辑坐标（画布用 CSS 缩放，需按实际显示尺寸换算） */
  const toLogical = (e: React.PointerEvent): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [
      ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    ]
  }

  const eraseAt = (p: [number, number]) => {
    const before = strokesRef.current.length
    strokesRef.current = strokesRef.current.filter(
      (s) => !s.points.some((pt) => dist(pt, p) < (s.size / 2 + size) * ERASER_HIT),
    )
    if (strokesRef.current.length !== before) onChange(strokesRef.current.length)
    redraw()
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const p = toLogical(e)
    if (eraser) {
      eraseAt(p)
      return
    }
    currentRef.current = { color, size, points: [p] }
    redraw()
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return
    const p = toLogical(e)
    if (eraser) {
      eraseAt(p)
      return
    }
    const cur = currentRef.current
    if (!cur) return
    const last = cur.points[cur.points.length - 1]
    // 抽稀：过近的点丢弃，减少数据量
    if (dist(last, p) < 1.5) return
    cur.points.push(p)
    redraw()
  }

  const onPointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const cur = currentRef.current
    if (cur) {
      strokesRef.current = [...strokesRef.current, cur]
      currentRef.current = null
      onChange(strokesRef.current.length)
    }
    redraw()
  }

  return (
    <canvas
      ref={canvasRef}
      className={`draw-canvas${eraser ? ' is-erasing' : ''}`}
      aria-label="小鱼绘制画布"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        width: '100%',
        aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
      }}
    />
  )
})

function paintStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  ctx.strokeStyle = s.color
  ctx.lineWidth = s.size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const pts = s.points
  ctx.beginPath()
  if (pts.length === 1) {
    // 单点用圆点表示
    ctx.fillStyle = s.color
    ctx.arc(pts[0][0], pts[0][1], s.size / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2
    const my = (pts[i][1] + pts[i + 1][1]) / 2
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my)
  }
  ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1])
  ctx.stroke()
}

/** 鱼形参考底图：仅提示朝向与构图，不计入笔触 */
function drawGuide(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 8])

  // 身体
  ctx.beginPath()
  ctx.ellipse(200, 160, 140, 78, 0, 0, Math.PI * 2)
  ctx.stroke()

  // 尾鳍
  ctx.beginPath()
  ctx.moveTo(338, 160)
  ctx.lineTo(438, 96)
  ctx.lineTo(438, 224)
  ctx.closePath()
  ctx.stroke()

  // 眼睛位置
  ctx.beginPath()
  ctx.arc(108, 138, 9, 0, Math.PI * 2)
  ctx.stroke()

  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(255,255,255,0.22)'
  ctx.font = '13px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('← 鱼头朝左', 16, 26)
  ctx.restore()
}

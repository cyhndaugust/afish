import { theme } from '../theme'

/**
 * 背景分两部分：
 * - 静态层（渐变 + 暗角）缓存到离屏 canvas，只在 resize 时重画
 * - 动态层（光束、气泡、水草）每帧绘制，都是廉价图元
 */

export class Background {
  private still: HTMLCanvasElement | null = null
  private w = 0
  private h = 0
  private bubbles: Bubble[] = []
  private weeds: Weed[] = []

  resize(w: number, h: number, dpr: number) {
    this.w = w
    this.h = h

    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.floor(w * dpr))
    c.height = Math.max(1, Math.floor(h * dpr))
    const g = c.getContext('2d')!
    g.scale(dpr, dpr)

    const grad = g.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, theme.deepTop)
    grad.addColorStop(0.55, '#072433')
    grad.addColorStop(1, theme.deepBottom)
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)

    // 四周压暗，突出中间的鱼
    const vig = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(0,0,0,0.45)')
    g.fillStyle = vig
    g.fillRect(0, 0, w, h)

    this.still = c

    const bubbleCount = Math.round((w * h) / 26000)
    this.bubbles = Array.from({ length: Math.min(70, Math.max(16, bubbleCount)) }, () =>
      makeBubble(w, h, true),
    )

    const weedCount = Math.max(5, Math.round(w / 110))
    this.weeds = Array.from({ length: weedCount }, (_, i) => ({
      x: ((i + 0.5) / weedCount) * w + (Math.random() - 0.5) * 40,
      height: h * (0.12 + Math.random() * 0.16),
      sway: 0.5 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      blades: 3 + Math.floor(Math.random() * 3),
    }))
  }

  draw(ctx: CanvasRenderingContext2D, t: number, dt: number) {
    const { w, h } = this
    if (this.still) ctx.drawImage(this.still, 0, 0, w, h)

    drawLightShafts(ctx, w, h, t)

    // 气泡
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.30)'
    for (const b of this.bubbles) {
      b.y -= b.speed * dt
      b.x += Math.sin(t * b.drift + b.phase) * 6 * dt
      if (b.y < -10) Object.assign(b, makeBubble(w, h, false))
      ctx.globalAlpha = b.alpha
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    drawWeeds(ctx, this.weeds, h, t)
  }
}

interface Bubble {
  x: number
  y: number
  r: number
  speed: number
  alpha: number
  drift: number
  phase: number
}

function makeBubble(w: number, h: number, spread: boolean): Bubble {
  return {
    x: Math.random() * w,
    y: spread ? Math.random() * h : h + Math.random() * 40,
    r: 1 + Math.random() * 2.6,
    speed: 14 + Math.random() * 34,
    alpha: 0.12 + Math.random() * 0.35,
    drift: 0.4 + Math.random() * 0.8,
    phase: Math.random() * Math.PI * 2,
  }
}

function drawLightShafts(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const count = 4
  for (let i = 0; i < count; i++) {
    const base = ((i + 0.5) / count) * w
    const x = base + Math.sin(t * 0.09 + i * 1.7) * w * 0.06
    const width = w * (0.07 + 0.03 * Math.sin(t * 0.13 + i))
    const alpha = 0.045 + 0.025 * Math.sin(t * 0.21 + i * 2.1)

    const g = ctx.createLinearGradient(x, 0, x - h * 0.35, h)
    g.addColorStop(0, `rgba(180, 240, 255, ${alpha})`)
    g.addColorStop(0.7, `rgba(150, 220, 245, ${alpha * 0.35})`)
    g.addColorStop(1, 'rgba(120, 200, 235, 0)')
    ctx.fillStyle = g

    ctx.beginPath()
    ctx.moveTo(x - width / 2, 0)
    ctx.lineTo(x + width / 2, 0)
    ctx.lineTo(x + width * 1.6 - h * 0.35, h)
    ctx.lineTo(x - width * 1.6 - h * 0.35, h)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

interface Weed {
  x: number
  height: number
  sway: number
  phase: number
  blades: number
}

function drawWeeds(ctx: CanvasRenderingContext2D, weeds: Weed[], h: number, t: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(10, 60, 70, 0.55)'
  ctx.lineCap = 'round'
  for (const wd of weeds) {
    for (let b = 0; b < wd.blades; b++) {
      const off = (b - wd.blades / 2) * 9
      const len = wd.height * (0.6 + 0.4 * ((b + 1) / wd.blades))
      const bend = Math.sin(t * wd.sway + wd.phase + b) * 22
      ctx.lineWidth = 5 - b * 0.6
      ctx.beginPath()
      ctx.moveTo(wd.x + off, h)
      ctx.quadraticCurveTo(wd.x + off + bend * 0.5, h - len * 0.55, wd.x + off + bend, h - len)
      ctx.stroke()
    }
  }
  ctx.restore()
}

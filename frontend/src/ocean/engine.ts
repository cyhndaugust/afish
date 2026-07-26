import type { Fish } from '../types'
import { theme } from '../theme'
import { Background } from './background'
import { FishSprite } from './FishSprite'

const DESKTOP_MAX = 40
const MOBILE_MAX = 20
const MIN_FISH = 8 // 性能降级的下限，再卡也保留这么多
const LABEL_HOLD = 2.5 // 名字牌停留秒数
const LABEL_FADE = 0.35

interface Label {
  sprite: FishSprite
  born: number
  dying: number | null // 开始淡出的时刻
}

export class OceanEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private bg = new Background()
  private sprites: FishSprite[] = []
  private pool: Fish[] = [] // 未上场的鱼，轮换进场
  private raf = 0
  private last = 0
  private t = 0
  private w = 0
  private h = 0
  private maxFish: number
  private isMobile: boolean
  private label: Label | null = null
  private frameTimes: number[] = []
  private highlightId: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 720
    this.maxFish = this.isMobile ? MOBILE_MAX : DESKTOP_MAX
    this.resize()
  }

  /** 高亮某条鱼（刚提交的自己的鱼），进场时自动弹出名字 */
  setHighlight(id: number) {
    this.highlightId = id
  }

  resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    this.w = rect.width
    this.h = rect.height
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.floor(this.w * dpr)
    this.canvas.height = Math.floor(this.h * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.bg.resize(this.w, this.h, dpr)
  }

  /** 大海中的统一缩放：窄屏鱼稍小一点，保证同屏能容下多条 */
  private fishScale(): number {
    const base = Math.min(this.w, this.h * 1.6)
    return Math.max(0.16, Math.min(0.38, base / 1500))
  }

  setFishes(fishes: Fish[]) {
    this.sprites = []
    this.pool = []
    this.label = null
    for (const f of fishes) {
      if (this.sprites.length < this.maxFish) this.spawn(f, false)
      else this.pool.push(f) // 超出上限的排队，等空位或帧率允许时再游进来
    }
  }

  /** 新鱼加入：满员时挤掉场上最早的一条（它退回池子，数据完整保留） */
  addFish(f: Fish, entering: boolean) {
    if (this.sprites.length >= this.maxFish) {
      if (!entering) {
        this.pool.push(f)
        return
      }
      this.retireOldest(1)
    }
    this.spawn(f, entering)
  }

  private spawn(f: Fish, entering: boolean) {
    const sp = new FishSprite(f, this.t)
    const s = this.fishScale()
    if (entering) {
      // 从左右边缘游入，朝向指着画面内侧
      const fromLeft = Math.random() < 0.5
      sp.place(fromLeft ? -60 : this.w + 60, this.h * (0.2 + Math.random() * 0.6), fromLeft ? 1 : -1, s)
    } else {
      sp.place(
        this.w * (0.1 + Math.random() * 0.8),
        this.h * (0.15 + Math.random() * 0.7),
        Math.random() < 0.5 ? 1 : -1,
        s,
      )
    }
    this.sprites.push(sp)
    if (entering && this.highlightId === f.id) {
      this.label = { sprite: sp, born: this.t, dying: null }
    }
  }

  /** 点击/触摸：从最上层往下命中，命中就显示名字 */
  handleTap(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect()
    const px = clientX - rect.left
    const py = clientY - rect.top
    const pad = this.isMobile ? 8 : 2

    for (let i = this.sprites.length - 1; i >= 0; i--) {
      if (this.sprites[i].hitTest(px, py, pad)) {
        this.label = { sprite: this.sprites[i], born: this.t, dying: null }
        return this.sprites[i].name
      }
    }
    // 点空白：立即开始淡出
    if (this.label && this.label.dying === null) this.label.dying = this.t
    return null
  }

  start() {
    this.last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      this.t += dt
      this.step(dt)
      this.monitorPerf(dt)
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop() {
    cancelAnimationFrame(this.raf)
  }

  private step(dt: number) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.w, this.h)
    this.bg.draw(ctx, this.t, dt)

    const s = this.fishScale()
    for (const sp of this.sprites) {
      sp.scale = s
      sp.update(dt, this.t, this.w, this.h)
      sp.draw(ctx, this.t)
    }

    this.drawLabel(ctx)
  }

  /** 名字牌：画在鱼层之上，尺寸固定不随鱼缩放 */
  private drawLabel(ctx: CanvasRenderingContext2D) {
    const lb = this.label
    if (!lb) return

    const age = this.t - lb.born
    if (lb.dying === null && age > LABEL_HOLD) lb.dying = this.t

    let alpha = Math.min(1, age / LABEL_FADE)
    if (lb.dying !== null) {
      alpha = Math.min(alpha, 1 - (this.t - lb.dying) / LABEL_FADE)
      if (alpha <= 0) {
        this.label = null
        return
      }
    }

    const sp = lb.sprite
    const text = sp.name
    ctx.save()
    ctx.font = `600 14px ${theme.font}`
    const tw = ctx.measureText(text).width
    const padX = 12
    const padY = 7
    const bw = tw + padX * 2
    const bh = 14 + padY * 2

    // 挂在鱼身上方，贴边时自动收回画面内
    let bx = (sp.bounds.minX + sp.bounds.maxX) / 2 - bw / 2
    let by = sp.bounds.minY - bh - 12
    bx = Math.min(Math.max(bx, 8), this.w - bw - 8)
    if (by < 8) by = sp.bounds.maxY + 12

    ctx.globalAlpha = alpha
    ctx.translate(0, (1 - alpha) * 6) // 淡入时轻微上浮

    // 气泡底
    ctx.fillStyle = 'rgba(6, 32, 45, 0.82)'
    ctx.strokeStyle = 'rgba(79, 209, 197, 0.55)'
    ctx.lineWidth = 1
    roundRect(ctx, bx, by, bw, bh, 999)
    ctx.fill()
    ctx.stroke()

    // 指向鱼的小尾巴
    const tipX = Math.min(Math.max((sp.bounds.minX + sp.bounds.maxX) / 2, bx + 14), bx + bw - 14)
    const pointingDown = by < sp.bounds.minY
    ctx.beginPath()
    if (pointingDown) {
      ctx.moveTo(tipX - 6, by + bh - 1)
      ctx.lineTo(tipX + 6, by + bh - 1)
      ctx.lineTo(tipX, by + bh + 7)
    } else {
      ctx.moveTo(tipX - 6, by + 1)
      ctx.lineTo(tipX + 6, by + 1)
      ctx.lineTo(tipX, by - 7)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(6, 32, 45, 0.82)'
    ctx.fill()

    ctx.fillStyle = theme.ink
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, bx + bw / 2, by + bh / 2 + 0.5)
    ctx.restore()
  }

  /** 帧率过低时减少同屏鱼数（多出来的退回池子），帧率恢复后再放回来 */
  private monitorPerf(dt: number) {
    this.frameTimes.push(dt)
    if (this.frameTimes.length < 90) return
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    this.frameTimes = []
    const fps = 1 / avg
    const hardMax = this.isMobile ? MOBILE_MAX : DESKTOP_MAX

    if (fps < 40 && this.sprites.length > MIN_FISH) {
      this.maxFish = Math.max(MIN_FISH, this.sprites.length - 4)
      this.retireOldest(this.sprites.length - this.maxFish)
    } else if (fps > 55 && this.maxFish < hardMax) {
      this.maxFish = Math.min(hardMax, this.maxFish + 2)
      this.admitFromPool()
    }
  }

  /** 把最早的几条鱼退回池子，保留完整数据以便之后再放出来 */
  private retireOldest(n: number) {
    for (let i = 0; i < n; i++) {
      const out = this.sprites.shift()
      if (!out) break
      if (this.label?.sprite === out) this.label = null
      this.pool.push(out.fish)
    }
  }

  /** 池子里还有鱼且有空位时，让它们从边缘游进来 */
  private admitFromPool() {
    while (this.sprites.length < this.maxFish && this.pool.length > 0) {
      const f = this.pool.shift()!
      this.spawn(f, true)
    }
  }

  get count(): number {
    return this.sprites.length + this.pool.length
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h / 2, w / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

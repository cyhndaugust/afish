import { CANVAS_H, CANVAS_W, type Fish, type Stroke } from '../types'

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** 上下倾角上限，约 ±26°。鱼主要水平游动，不会头朝天或倒栽 */
const MAX_PITCH = 0.46

/**
 * 一条在海里游动的鱼。
 *
 * 坐标模型：原画布鱼头在左 (x=0)、尾在右 (x=CANVAS_W)。
 * 渲染时体轴 a = CANVAS_W/2 - px，头为正值 —— 也就是头永远朝着前进方向。
 * 掉头用 x 轴镜像（flip 从 1 平滑过渡到 -1），而不是旋转 180°，
 * 否则鱼会上下颠倒。过渡中鱼被压扁再反向展开，正好就是真鱼转身的样子。
 */
export class FishSprite {
  readonly id: number
  readonly name: string
  /** 原始数据，退回池子后还能原样再放出来 */
  readonly fish: Fish
  private strokes: Stroke[]

  x = 0
  y = 0
  scale = 0.35

  /** 朝向：1 朝右，-1 朝左 */
  private dir: 1 | -1 = 1
  /** 平滑后的镜像系数，-1..1，用于渲染与水平位移 */
  private flip = 1
  /** 上下倾角（弧度） */
  private pitch = 0

  private speed = 26
  private baseSpeed = 26
  private phase = Math.random() * Math.PI * 2
  private tailFreq = 2.2
  private waves = 1.15
  private amp = 26
  private wanderT = Math.random() * 1000
  private dashUntil = 0
  private nextDash: number
  private nextTurn: number

  /** 上一帧变换后的包围盒，用于点击命中测试 */
  bounds: Bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 }

  constructor(fish: Fish, seedTime = 0) {
    this.id = fish.id
    this.name = fish.name
    this.fish = fish
    this.strokes = fish.strokes
    this.tailFreq = 1.8 + Math.random() * 0.9
    this.waves = 1.0 + Math.random() * 0.4
    this.amp = 20 + Math.random() * 14
    this.baseSpeed = 22 + Math.random() * 22
    this.speed = this.baseSpeed
    this.nextDash = seedTime + 4 + Math.random() * 10
    this.nextTurn = seedTime + 8 + Math.random() * 18
  }

  place(x: number, y: number, dir: 1 | -1, scale: number) {
    this.x = x
    this.y = y
    this.dir = dir
    this.flip = dir
    this.scale = scale
  }

  /** 被双击时立即冲刺，方向保持不变并带一点随机的上下偏移。 */
  triggerDash(t: number) {
    this.dashUntil = Math.max(this.dashUntil, t + 1.35)
    this.speed = Math.max(this.speed, this.baseSpeed * 3.4)
    this.pitch = Math.min(
      Math.max(this.pitch + (Math.random() - 0.5) * 0.22, -MAX_PITCH),
      MAX_PITCH,
    )
    this.nextDash = t + 8 + Math.random() * 10
  }

  update(dt: number, t: number, w: number, h: number) {
    // 游荡：两个不同频率的正弦叠加，够自然且无需噪声库
    this.wanderT += dt
    const wander =
      Math.sin(this.wanderT * 0.33 + this.id * 1.7) * 0.6 +
      Math.sin(this.wanderT * 0.11 + this.id * 0.9) * 0.4
    this.pitch += wander * dt * 0.5
    this.pitch = Math.min(Math.max(this.pitch, -MAX_PITCH), MAX_PITCH)

    // 冲刺：短暂加速，摆尾同步变快
    if (t > this.nextDash) {
      this.dashUntil = t + 0.8 + Math.random() * 0.8
      this.nextDash = t + 6 + Math.random() * 12
    }
    const dashing = t < this.dashUntil
    const target = dashing ? this.baseSpeed * 2.9 : this.baseSpeed
    this.speed += (target - this.speed) * Math.min(1, dt * 3)

    // 偶尔自发掉头，避免所有鱼都贴着边界折返
    if (t > this.nextTurn) {
      this.dir = (this.dir * -1) as 1 | -1
      this.nextTurn = t + 10 + Math.random() * 20
    }

    // 靠近左右边缘就掉头；上下边界改用倾角回正
    const margin = 70
    if (this.x < margin && this.dir === -1) this.dir = 1
    if (this.x > w - margin && this.dir === 1) this.dir = -1
    if (this.y < margin) this.pitch = Math.max(this.pitch, 0.12)
    if (this.y > h - margin) this.pitch = Math.min(this.pitch, -0.12)

    // 镜像系数平滑追上朝向 —— 这就是转身动画
    this.flip += (this.dir - this.flip) * Math.min(1, dt * 3.5)

    // 水平速度随 flip 走：转身瞬间水平速度趋近 0，像真鱼一样停顿再反向
    this.x += this.flip * Math.cos(this.pitch) * this.speed * dt
    this.y += Math.sin(this.pitch) * this.speed * dt
    this.x = Math.min(Math.max(this.x, -40), w + 40)
    this.y = Math.min(Math.max(this.y, 24), h - 24)

    this.phase += dt * Math.PI * 2 * this.tailFreq * (dashing ? 2.05 : 1)
  }

  /** 逐点变形并绘制；侧向偏移按体轴位置平方增长，头几乎不动、尾摆幅最大 */
  draw(ctx: CanvasRenderingContext2D, t: number) {
    const cos = Math.cos(this.pitch)
    const sin = Math.sin(this.pitch)
    const s = this.scale
    const breathe = Math.sin(t * 1.3 + this.id) * 2
    const dashAmp = t < this.dashUntil ? 1.28 : 1

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    const transform = (px: number, py: number): [number, number] => {
      const u = px / CANVAS_W // 0=头 1=尾
      const bend = this.amp * dashAmp * u * u * Math.sin(Math.PI * 2 * (u * this.waves) - this.phase)
      // a：体轴方向，头为正 → 头永远朝着前进方向
      const a = (CANVAS_W / 2 - px) * this.flip
      const b = py - CANVAS_H / 2 + bend + breathe
      const X = this.x + (a * cos - b * sin) * s
      const Y = this.y + (a * sin + b * cos) * s
      if (X < minX) minX = X
      if (X > maxX) maxX = X
      if (Y < minY) minY = Y
      if (Y > maxY) maxY = Y
      return [X, Y]
    }

    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const stroke of this.strokes) {
      const pts = stroke.points
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = Math.max(0.8, stroke.size * s)

      if (pts.length === 1) {
        const [X, Y] = transform(pts[0][0], pts[0][1])
        ctx.fillStyle = stroke.color
        ctx.beginPath()
        ctx.arc(X, Y, Math.max(0.6, (stroke.size / 2) * s), 0, Math.PI * 2)
        ctx.fill()
        continue
      }

      ctx.beginPath()
      const first = transform(pts[0][0], pts[0][1])
      ctx.moveTo(first[0], first[1])
      for (let i = 1; i < pts.length - 1; i++) {
        const cur = transform(pts[i][0], pts[i][1])
        const next = transform(pts[i + 1][0], pts[i + 1][1])
        ctx.quadraticCurveTo(cur[0], cur[1], (cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2)
      }
      const last = transform(pts[pts.length - 1][0], pts[pts.length - 1][1])
      ctx.lineTo(last[0], last[1])
      ctx.stroke()
    }
    ctx.restore()

    if (minX !== Infinity) this.bounds = { minX, minY, maxX, maxY }
  }

  /** 点击命中测试：包围盒 + 外扩容差 */
  hitTest(px: number, py: number, pad: number): boolean {
    const b = this.bounds
    return px >= b.minX - pad && px <= b.maxX + pad && py >= b.minY - pad && py <= b.maxY + pad
  }
}

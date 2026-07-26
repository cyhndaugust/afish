import type { Fish, Stroke } from './types'

export async function fetchFishes(limit = 120): Promise<Fish[]> {
  const res = await fetch(`/api/fishes?limit=${limit}`)
  if (!res.ok) throw new Error(`加载鱼群失败 (${res.status})`)
  return res.json()
}

export async function createFish(name: string, strokes: Stroke[]): Promise<Fish> {
  const res = await fetch('/api/fishes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, strokes }),
  })
  if (!res.ok) {
    let detail = `提交失败 (${res.status})`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      /* 忽略解析失败，用默认文案 */
    }
    throw new Error(detail)
  }
  return res.json()
}

/** 订阅新鱼事件；返回取消订阅函数。断线后自动重连。 */
export function subscribeFishes(onFish: (fish: Fish) => void): () => void {
  let ws: WebSocket | null = null
  let timer: number | undefined
  let closed = false

  const connect = () => {
    if (closed) return
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    ws = new WebSocket(`${proto}://${location.host}/ws`)
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg.type === 'fish_added' && msg.fish) onFish(msg.fish as Fish)
      } catch {
        /* 忽略非法消息 */
      }
    }
    ws.onclose = () => {
      if (!closed) timer = window.setTimeout(connect, 2000)
    }
    ws.onerror = () => ws?.close()
  }
  connect()

  return () => {
    closed = true
    if (timer) clearTimeout(timer)
    ws?.close()
  }
}

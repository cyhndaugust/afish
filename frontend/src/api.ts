import type { AdminFish, AdminSession, Fish, Stroke } from './types'

export async function fetchFishes(limit = 120): Promise<Fish[]> {
  const res = await fetch(`/api/fishes?limit=${limit}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createFish(name: string, strokes: Stroke[], authorId: string): Promise<Fish> {
  const res = await fetch('/api/fishes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, strokes, author_id: authorId }),
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json()
}

export async function loginAdmin(username: string, password: string): Promise<AdminSession> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function adminHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

export async function fetchAdminFishes(token: string): Promise<AdminFish[]> {
  const res = await fetch('/api/admin/fishes', { headers: adminHeaders(token) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteAdminFish(
  token: string,
  fishId: number,
  mode: 'soft' | 'hard',
): Promise<void> {
  const res = await fetch(`/api/admin/fishes/${fishId}?mode=${mode}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function restoreAdminFish(token: string, fishId: number): Promise<Fish> {
  const res = await fetch(`/api/admin/fishes/${fishId}/restore`, {
    method: 'POST',
    headers: adminHeaders(token),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** 订阅新鱼事件；返回取消订阅函数。断线后自动重连。 */
export function subscribeFishes(
  onFish: (fish: Fish) => void,
  onDelete?: (fishId: number) => void,
): () => void {
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
        if (msg.type === 'fish_deleted' && typeof msg.fish_id === 'number') onDelete?.(msg.fish_id)
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

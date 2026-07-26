import type { Fish } from './types'

/**
 * 本地记住「我是谁、我画过哪些鱼」。
 * 目的：刷新后直接进大海，不再重复要求画鱼。
 */
const NAME_KEY = 'fish.name'
const MINE_KEY = 'fish.mine'

export function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return '' // 隐私模式下 localStorage 可能不可用
  }
}

export function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    /* 存不了就算了，不影响主流程 */
  }
}

/** 我放生过的鱼（只留 id 与名字，笔触从服务端拉，避免占满本地存储） */
export function loadMine(): { id: number; name: string }[] {
  try {
    const raw = localStorage.getItem(MINE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((x) => typeof x?.id === 'number') : []
  } catch {
    return []
  }
}

export function rememberFish(fish: Fish): void {
  try {
    const mine = loadMine()
    mine.push({ id: fish.id, name: fish.name })
    localStorage.setItem(MINE_KEY, JSON.stringify(mine.slice(-20)))
    saveName(fish.name)
  } catch {
    /* 忽略 */
  }
}

export function hasDrawn(): boolean {
  return loadMine().length > 0
}

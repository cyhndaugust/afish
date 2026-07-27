import type { Fish, Stroke } from './types'
import type { Language } from './i18n'

/**
 * 本地记住「我是谁、我画过哪些鱼」。
 * 目的：刷新后直接进大海，不再重复要求画鱼。
 */
const NAME_KEY = 'fish.name'
const MINE_KEY = 'fish.mine'
const LANGUAGE_KEY = 'fish.language'
const DRAFT_KEY = 'fish.draft'

export interface FishDraft {
  name: string
  strokes: Stroke[]
}

function isStroke(value: unknown): value is Stroke {
  if (!value || typeof value !== 'object') return false
  const stroke = value as { color?: unknown; size?: unknown; points?: unknown }
  return typeof stroke.color === 'string'
    && typeof stroke.size === 'number'
    && Array.isArray(stroke.points)
    && stroke.points.length > 0
    && stroke.points.every((point) => (
      Array.isArray(point)
      && point.length === 2
      && typeof point[0] === 'number'
      && Number.isFinite(point[0])
      && typeof point[1] === 'number'
      && Number.isFinite(point[1])
    ))
}

/** 首次访问默认英文；选择过语言后沿用本机设置。 */
export function loadLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === 'zh' ? 'zh' : 'en'
  } catch {
    return 'en'
  }
}

export function saveLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, language)
  } catch {
    /* 隐私模式下无法保存时仍可在当前页面切换 */
  }
}

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

/** 仅保存提交失败的绘制，接口恢复后可继续上传。 */
export function loadDraft(): FishDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null
    const draft = value as { name?: unknown; strokes?: unknown }
    if (typeof draft.name !== 'string' || !Array.isArray(draft.strokes)) return null
    if (draft.strokes.length === 0 || !draft.strokes.every(isStroke)) return null
    return { name: draft.name, strokes: draft.strokes }
  } catch {
    return null
  }
}

export function saveDraft(name: string, strokes: Stroke[]): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, strokes }))
  } catch {
    /* 存储空间不足或隐私模式下仍保留当前页面内容 */
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* 忽略 */
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

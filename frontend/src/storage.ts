import type { Fish } from './types'
import type { Language } from './i18n'

/**
 * 本地记住「我是谁、我画过哪些鱼」。
 * 目的：刷新后直接进大海，不再重复要求画鱼。
 */
const NAME_KEY = 'fish.name'
const MINE_KEY = 'fish.mine'
const LANGUAGE_KEY = 'fish.language'

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

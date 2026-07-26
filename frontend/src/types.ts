export type Point = [number, number]

export interface Stroke {
  color: string
  size: number
  points: Point[]
}

export interface Fish {
  id: number
  name: string
  strokes: Stroke[]
  created_at: string
}

/** 绘制画布的逻辑尺寸，必须与后端 models.py 保持一致 */
export const CANVAS_W = 480
export const CANVAS_H = 320

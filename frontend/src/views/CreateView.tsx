import { useRef, useState } from 'react'
import { DrawCanvas, type DrawCanvasHandle } from '../components/DrawCanvas'
import { Toolbar } from '../components/Toolbar'
import { PALETTE, SIZES } from '../theme'
import { createFish } from '../api'
import { loadName } from '../storage'
import type { Fish } from '../types'

interface Props {
  onDone: (fish: Fish) => void
  /** 已经画过鱼的人可以中途返回大海 */
  canReturn: boolean
  onCancel: () => void
}

export function CreateView({ onDone, canReturn, onCancel }: Props) {
  const canvasRef = useRef<DrawCanvasHandle>(null)
  // 老用户名字自动带出来，不用重新输
  const [name, setName] = useState(loadName)
  const [color, setColor] = useState(PALETTE[1])
  const [size, setSize] = useState(SIZES[1])
  const [eraser, setEraser] = useState(false)
  const [showGuide, setShowGuide] = useState(true)
  const [strokeCount, setStrokeCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) return setError('先给自己起个名字吧')
    if (trimmed.length > 16) return setError('名字最多 16 个字')
    const strokes = canvasRef.current?.getStrokes() ?? []
    if (strokes.length === 0) return setError('还没画鱼呢')

    setSubmitting(true)
    try {
      const fish = await createFish(trimmed, strokes)
      onDone(fish)
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败，稍后再试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="create-page">
      <main className="create-shell">
        <header className="site-header">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <span />
            </span>
            <span>深海共创</span>
          </div>
          {canReturn && (
            <button className="header-link" onClick={onCancel}>
              返回大海
            </button>
          )}
        </header>

        <section className="create-card">
          <header className="create-intro">
            <div>
              <p className="eyebrow">深海共创计划</p>
              <h1>{canReturn ? '再画一条，加入鱼群' : '画一条鱼，放进深海'}</h1>
              <p className="create-description">
                {canReturn
                  ? '留下新的颜色和笔触，让它和你之前的小鱼一起游。'
                  : '写下名字，画出你的小鱼。它会和大家的作品一起，在同一片海里游下去。'}
              </p>
            </div>
            <div className="step-list" aria-label="创作步骤">
              <span className="step-item step-active"><b>1</b> 留名</span>
              <i aria-hidden="true" />
              <span className="step-item"><b>2</b> 画鱼</span>
              <i aria-hidden="true" />
              <span className="step-item"><b>3</b> 放生</span>
            </div>
          </header>

          <div className="name-row">
            <label className="field-label" htmlFor="creator-name">
              <span>你的名字</span>
              <small>会显示在小鱼的名字牌上</small>
            </label>
            <div className="input-wrap">
              <input
                id="creator-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="怎么称呼你？"
                maxLength={16}
              />
              <span>{name.length}/16</span>
            </div>
          </div>

          <div className="canvas-section">
            <div className="section-heading">
              <div>
                <span className="section-number">第二步</span>
                <strong>画出你的小鱼</strong>
              </div>
              <span>鱼头朝左 · 大胆下笔</span>
            </div>

            <DrawCanvas
              ref={canvasRef}
              color={color}
              size={size}
              eraser={eraser}
              showGuide={showGuide}
              onChange={setStrokeCount}
            />
          </div>

          <Toolbar
            color={color}
            size={size}
            eraser={eraser}
            showGuide={showGuide}
            canUndo={strokeCount > 0}
            onColor={setColor}
            onSize={setSize}
            onEraser={setEraser}
            onGuide={setShowGuide}
            onUndo={() => canvasRef.current?.undo()}
            onClear={() => canvasRef.current?.clear()}
          />

          <div className="submit-row">
            <div className="submit-message" role="status">
              {error ? <span className="error-text">{error}</span> : <span>完成后，它会马上游进大海</span>}
            </div>
            <button className="primary-button" onClick={submit} disabled={submitting}>
              <span>{submitting ? '正在放生…' : '放进大海'}</span>
              {!submitting && <b aria-hidden="true">→</b>}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

import { PALETTE, SIZES } from '../theme'

interface Props {
  color: string
  size: number
  eraser: boolean
  showGuide: boolean
  canUndo: boolean
  onColor: (c: string) => void
  onSize: (s: number) => void
  onEraser: (v: boolean) => void
  onGuide: (v: boolean) => void
  onUndo: () => void
  onClear: () => void
}

export function Toolbar(p: Props) {
  return (
    <div className="toolbar">
      <div className="tool-group color-group">
        <span className="tool-label">颜色</span>
        <div className="swatch-list">
          {PALETTE.map((c) => {
            const active = !p.eraser && p.color === c
            return (
              <button
                key={c}
                className={`color-swatch${active ? ' is-active' : ''}`}
                aria-label={`选择颜色 ${c}`}
                aria-pressed={active}
                onClick={() => {
                  p.onColor(c)
                  p.onEraser(false)
                }}
                style={{ background: c }}
              >
                {active && <span aria-hidden="true">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="tool-group size-group">
        <span className="tool-label">笔触</span>
        <div className="segmented-control">
          {SIZES.map((s, index) => (
            <button
              key={s}
              className={p.size === s ? 'is-active' : ''}
              aria-label={`选择${['细', '中', '粗'][index]}笔触`}
              aria-pressed={p.size === s}
              onClick={() => p.onSize(s)}
            >
              <span style={{ width: s, height: s }} />
            </button>
          ))}
        </div>
      </div>

      <div className="tool-group action-group">
        <span className="tool-label">工具</span>
        <div className="tool-actions">
          <button
            className={p.eraser ? 'is-active' : ''}
            aria-pressed={p.eraser}
            onClick={() => p.onEraser(!p.eraser)}
          >
            橡皮
          </button>
          <button onClick={p.onUndo} disabled={!p.canUndo}>撤销</button>
          <button onClick={p.onClear} disabled={!p.canUndo}>清空</button>
          <button
            className={p.showGuide ? 'is-active' : ''}
            aria-pressed={p.showGuide}
            onClick={() => p.onGuide(!p.showGuide)}
          >
            参考线
          </button>
        </div>
      </div>
    </div>
  )
}

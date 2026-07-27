import { PALETTE, SIZES } from '../theme'
import { COPY, type Language } from '../i18n'

interface Props {
  language: Language
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
  const t = COPY[p.language].toolbar

  return (
    <div className="toolbar">
      <div className="tool-group color-group">
        <span className="tool-label">{t.color}</span>
        <div className="swatch-list">
          {PALETTE.map((c) => {
            const active = !p.eraser && p.color === c
            return (
              <button
                key={c}
                className={`color-swatch${active ? ' is-active' : ''}`}
                aria-label={`${t.chooseColor} ${c}`}
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
        <span className="tool-label">{t.brush}</span>
        <div className="segmented-control">
          {SIZES.map((s, index) => (
            <button
              key={s}
              className={p.size === s ? 'is-active' : ''}
              aria-label={t.chooseSize(t.sizes[index])}
              aria-pressed={p.size === s}
              onClick={() => p.onSize(s)}
            >
              <span style={{ width: s, height: s }} />
            </button>
          ))}
        </div>
      </div>

      <div className="tool-group action-group">
        <span className="tool-label">{t.tools}</span>
        <div className="tool-actions">
          <button
            className={p.eraser ? 'is-active' : ''}
            aria-pressed={p.eraser}
            onClick={() => p.onEraser(!p.eraser)}
          >
            {t.eraser}
          </button>
          <button onClick={p.onUndo} disabled={!p.canUndo}>{t.undo}</button>
          <button onClick={p.onClear} disabled={!p.canUndo}>{t.clear}</button>
          <button
            className={p.showGuide ? 'is-active' : ''}
            aria-pressed={p.showGuide}
            onClick={() => p.onGuide(!p.showGuide)}
          >
            {t.guide}
          </button>
        </div>
      </div>
    </div>
  )
}

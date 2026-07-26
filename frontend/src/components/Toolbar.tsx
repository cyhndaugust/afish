import { PALETTE, SIZES, theme } from '../theme'

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
    <div style={wrap}>
      <div style={row}>
        {PALETTE.map((c) => (
          <button
            key={c}
            aria-label={`颜色 ${c}`}
            onClick={() => {
              p.onColor(c)
              p.onEraser(false)
            }}
            style={{
              ...swatch,
              background: c,
              outline:
                !p.eraser && p.color === c ? `2px solid ${theme.accent}` : '2px solid transparent',
              outlineOffset: 2,
            }}
          />
        ))}
      </div>

      <div style={row}>
        {SIZES.map((s) => (
          <button
            key={s}
            aria-label={`粗细 ${s}`}
            onClick={() => p.onSize(s)}
            style={{ ...chip, ...(p.size === s ? chipOn : null) }}
          >
            <span
              style={{
                width: s,
                height: s,
                borderRadius: '50%',
                background: p.size === s ? theme.accent : theme.inkDim,
                display: 'block',
              }}
            />
          </button>
        ))}

        <button
          onClick={() => p.onEraser(!p.eraser)}
          style={{ ...btn, ...(p.eraser ? chipOn : null) }}
        >
          橡皮
        </button>
        <button onClick={p.onUndo} disabled={!p.canUndo} style={{ ...btn, opacity: p.canUndo ? 1 : 0.4 }}>
          撤销
        </button>
        <button onClick={p.onClear} style={btn}>
          清空
        </button>
        <button
          onClick={() => p.onGuide(!p.showGuide)}
          style={{ ...btn, ...(p.showGuide ? chipOn : null) }}
        >
          参考线
        </button>
      </div>
    </div>
  )
}

const wrap: React.CSSProperties = { display: 'grid', gap: 10 }
const row: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }

const swatch: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.25)',
  cursor: 'pointer',
  padding: 0,
}

const btn: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 999,
  border: `1px solid ${theme.panelBorder}`,
  background: theme.panel,
  color: theme.ink,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const chip: React.CSSProperties = {
  ...btn,
  width: 38,
  height: 34,
  padding: 0,
  display: 'grid',
  placeItems: 'center',
}

const chipOn: React.CSSProperties = {
  borderColor: theme.accent,
  background: theme.accentDim,
  color: theme.accent,
}

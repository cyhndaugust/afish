import { useRef, useState } from 'react'
import { DrawCanvas, type DrawCanvasHandle } from '../components/DrawCanvas'
import { Toolbar } from '../components/Toolbar'
import { PALETTE, SIZES, theme } from '../theme'
import { createFish } from '../api'
import type { Fish } from '../types'

interface Props {
  onDone: (fish: Fish) => void
}

export function CreateView({ onDone }: Props) {
  const canvasRef = useRef<DrawCanvasHandle>(null)
  const [name, setName] = useState('')
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
    <div style={page}>
      <div style={card}>
        <header style={{ marginBottom: 18 }}>
          <h1 style={title}>画一条鱼，放进深海</h1>
          <p style={sub}>它会和其他人的鱼一起，在同一片海里游下去。</p>
        </header>

        <label style={label}>
          <span style={labelText}>你的名字</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="最多 16 个字"
            maxLength={16}
            style={input}
          />
        </label>

        <div style={{ margin: '16px 0 12px' }}>
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

        {error && <p style={errorText}>{error}</p>}

        <button onClick={submit} disabled={submitting} style={primaryBtn}>
          {submitting ? '正在放生…' : '放进大海 →'}
        </button>
      </div>
    </div>
  )
}

const page: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'grid',
  placeItems: 'center',
  padding: '24px 16px',
  background: `linear-gradient(180deg, ${theme.deepTop} 0%, ${theme.deepBottom} 100%)`,
  fontFamily: theme.font,
  color: theme.ink,
}

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 560,
  background: 'rgba(255,255,255,0.045)',
  border: `1px solid ${theme.panelBorder}`,
  borderRadius: 24,
  padding: 24,
  backdropFilter: 'blur(8px)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
}

const title: React.CSSProperties = { margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: 0.5 }
const sub: React.CSSProperties = { margin: '6px 0 0', fontSize: 14, color: theme.inkDim }
const label: React.CSSProperties = { display: 'grid', gap: 6 }
const labelText: React.CSSProperties = { fontSize: 13, color: theme.inkDim }

const input: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 12,
  border: `1px solid ${theme.panelBorder}`,
  background: 'rgba(6, 32, 45, 0.6)',
  color: theme.ink,
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

const errorText: React.CSSProperties = { color: '#fca5a5', fontSize: 13, margin: '12px 0 0' }

const primaryBtn: React.CSSProperties = {
  width: '100%',
  marginTop: 18,
  padding: '13px 20px',
  borderRadius: 999,
  border: 'none',
  background: `linear-gradient(135deg, ${theme.accent}, #38bdf8)`,
  color: '#052b32',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

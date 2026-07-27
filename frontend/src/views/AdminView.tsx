import { useEffect, useRef, useState } from 'react'
import { Button } from 'animal-island-ui'
import { deleteAdminFish, fetchAdminFishes, restoreAdminFish } from '../api'
import { LanguageSwitch } from '../components/LanguageSwitch'
import { COPY, type Language } from '../i18n'
import { CANVAS_H, CANVAS_W, type AdminFish, type Stroke } from '../types'

interface Props {
  token: string
  language: Language
  onLanguageChange: (language: Language) => void
  onClose: () => void
}

function FishPreview({ name, strokes }: { name: string; strokes: Stroke[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const width = 220
    const height = 128
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    const scale = Math.min(width / CANVAS_W, height / CANVAS_H) * 0.86
    ctx.translate((width - CANVAS_W * scale) / 2, (height - CANVAS_H * scale) / 2)
    ctx.scale(scale, scale)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (const stroke of strokes) {
      const points = stroke.points
      ctx.strokeStyle = stroke.color
      ctx.fillStyle = stroke.color
      ctx.lineWidth = stroke.size
      ctx.beginPath()
      if (points.length === 1) {
        ctx.arc(points[0][0], points[0][1], stroke.size / 2, 0, Math.PI * 2)
        ctx.fill()
        continue
      }
      ctx.moveTo(points[0][0], points[0][1])
      for (let index = 1; index < points.length; index += 1) {
        ctx.lineTo(points[index][0], points[index][1])
      }
      ctx.stroke()
    }
  }, [strokes])

  return <canvas ref={canvasRef} className="admin-fish-preview" aria-label={name} />
}

export function AdminView({ token, language, onLanguageChange, onClose }: Props) {
  const t = COPY[language].admin
  const [fishes, setFishes] = useState<AdminFish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<'load' | 'operation' | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchAdminFishes(token)
      .then((list) => {
        if (!cancelled) setFishes(list)
      })
      .catch(() => {
        if (!cancelled) setError('load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const refresh = async () => {
    setFishes(await fetchAdminFishes(token))
  }

  const operate = async (fish: AdminFish, action: 'soft' | 'hard' | 'restore') => {
    if (action === 'hard' && !window.confirm(t.hardConfirm(fish.name))) return
    setBusyId(fish.id)
    setError(null)
    try {
      if (action === 'restore') await restoreAdminFish(token, fish.id)
      else await deleteAdminFish(token, fish.id, action)
      await refresh()
    } catch {
      setError('operation')
    } finally {
      setBusyId(null)
    }
  }

  const formatDate = (value: string) => new Intl.DateTimeFormat(
    language === 'zh' ? 'zh-CN' : 'en-US',
    { dateStyle: 'medium', timeStyle: 'short' },
  ).format(new Date(value))

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p>{t.subtitle}</p>
          <h1>{t.title}</h1>
          <span>{t.count(fishes.length)}</span>
        </div>
        <div className="admin-header-actions">
          <LanguageSwitch language={language} label={COPY[language].languageLabel} onChange={onLanguageChange} />
          <Button type="text" onClick={onClose}>{t.back}</Button>
        </div>
      </header>

      <div className="admin-warning">{t.weakPasswordWarning}</div>
      {error && <div className="admin-error" role="status">{error === 'load' ? t.loadFailed : t.operationFailed}</div>}

      {loading ? (
        <div className="admin-empty">{t.loading}</div>
      ) : fishes.length === 0 ? (
        <div className="admin-empty">{t.empty}</div>
      ) : (
        <main className="admin-fish-list">
          {fishes.map((fish) => (
            <article className={`admin-fish-card${fish.deleted_at ? ' is-deleted' : ''}`} key={fish.id}>
              <FishPreview name={fish.name} strokes={fish.strokes} />
              <div className="admin-fish-info">
                <div className="admin-fish-title">
                  <h2>{fish.name}</h2>
                  <span className={fish.deleted_at ? 'deleted' : 'active'}>
                    {fish.deleted_at ? t.deleted : t.active}
                  </span>
                </div>
                <dl>
                  <div><dt>ID</dt><dd>#{fish.id}</dd></div>
                  <div><dt>{t.created}</dt><dd>{formatDate(fish.created_at)}</dd></div>
                  <div>
                    <dt>{t.author}</dt>
                    <dd title={fish.author_id ?? undefined}>{fish.author_id ?? t.legacyAuthor}</dd>
                  </div>
                </dl>
              </div>
              <div className="admin-fish-actions">
                {fish.deleted_at ? (
                  <button disabled={busyId === fish.id} onClick={() => operate(fish, 'restore')}>
                    {t.restore}
                  </button>
                ) : (
                  <button disabled={busyId === fish.id} onClick={() => operate(fish, 'soft')}>
                    {t.softDelete}
                  </button>
                )}
                <button
                  className="danger"
                  disabled={busyId === fish.id}
                  onClick={() => operate(fish, 'hard')}
                >
                  {t.hardDelete}
                </button>
              </div>
            </article>
          ))}
        </main>
      )}
    </div>
  )
}

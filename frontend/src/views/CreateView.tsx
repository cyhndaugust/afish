import { useRef, useState } from 'react'
import { Button, Card, Divider, Footer, Input, Title } from 'animal-island-ui'
import { DrawCanvas, type DrawCanvasHandle } from '../components/DrawCanvas'
import { LanguageSwitch } from '../components/LanguageSwitch'
import { Toolbar } from '../components/Toolbar'
import { PALETTE, SIZES } from '../theme'
import { createFish } from '../api'
import { COPY, type Language } from '../i18n'
import { loadName } from '../storage'
import type { Fish } from '../types'

interface Props {
  onDone: (fish: Fish) => void
  language: Language
  onLanguageChange: (language: Language) => void
  /** 已经画过鱼的人可以中途返回大海 */
  canReturn: boolean
  onCancel: () => void
}

type ErrorKey = keyof typeof COPY.en.errors

export function CreateView({ onDone, language, onLanguageChange, canReturn, onCancel }: Props) {
  const t = COPY[language]
  const canvasRef = useRef<DrawCanvasHandle>(null)
  // 老用户名字自动带出来，不用重新输
  const [name, setName] = useState(loadName)
  const [color, setColor] = useState(PALETTE[1])
  const [size, setSize] = useState(SIZES[1])
  const [eraser, setEraser] = useState(false)
  const [showGuide, setShowGuide] = useState(true)
  const [strokeCount, setStrokeCount] = useState(0)
  const [error, setError] = useState<ErrorKey | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) return setError('nameRequired')
    if (trimmed.length > 16) return setError('nameTooLong')
    const strokes = canvasRef.current?.getStrokes() ?? []
    if (strokes.length === 0) return setError('fishRequired')

    setSubmitting(true)
    try {
      const fish = await createFish(trimmed, strokes)
      onDone(fish)
    } catch {
      setError('submitFailed')
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
            <span>{t.title}</span>
          </div>
          <div className="header-actions">
            {canReturn && (
              <Button type="text" size="small" className="header-link" onClick={onCancel}>
                {t.create.backToOcean}
              </Button>
            )}
            <LanguageSwitch
              language={language}
              label={t.languageLabel}
              onChange={onLanguageChange}
            />
          </div>
        </header>

        <Card className="create-card" pattern="default">
          <header className="create-intro">
            <div>
              <p className="eyebrow">{t.create.eyebrow}</p>
              <h1>
                <Title size="large" color="app-teal">
                  {canReturn ? t.create.headingReturning : t.create.heading}
                </Title>
              </h1>
              <p className="create-description">
                {canReturn ? t.create.descriptionReturning : t.create.description}
              </p>
            </div>
            <div className="step-list" aria-label={t.create.stepsLabel}>
              <span className="step-item step-active"><b>1</b> {t.create.stepName}</span>
              <i aria-hidden="true" />
              <span className="step-item"><b>2</b> {t.create.stepDraw}</span>
              <i aria-hidden="true" />
              <span className="step-item"><b>3</b> {t.create.stepRelease}</span>
            </div>
          </header>

          <Divider type="dashed-brown" className="form-divider" />

          <div className="name-row">
            <label className="field-label" htmlFor="creator-name">
              <span>{t.create.nameLabel}</span>
              <small>{t.create.nameHint}</small>
            </label>
            <div className="input-wrap">
              <Input
                id="creator-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.create.namePlaceholder}
                maxLength={16}
                size="large"
                shadow
                status={error === 'nameRequired' || error === 'nameTooLong' ? 'error' : undefined}
                suffix={<span>{name.length}/16</span>}
              />
            </div>
          </div>

          <div className="canvas-section">
            <div className="section-heading">
              <div>
                <span className="section-number">{t.create.secondStep}</span>
                <strong>{t.create.drawHeading}</strong>
              </div>
              <span>{t.create.drawHint}</span>
            </div>

            <DrawCanvas
              ref={canvasRef}
              color={color}
              size={size}
              eraser={eraser}
              showGuide={showGuide}
              label={t.canvas.label}
              guideText={t.canvas.guide}
              onChange={setStrokeCount}
            />
          </div>

          <Divider type="dashed-brown" className="form-divider toolbar-divider" />

          <Toolbar
            language={language}
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
              {error ? <span className="error-text">{t.errors[error]}</span> : <span>{t.create.readyHint}</span>}
            </div>
            <Button
              type="primary"
              size="large"
              className="primary-button"
              onClick={submit}
              loading={submitting}
              disabled={submitting}
              icon={!submitting ? <span aria-hidden="true">→</span> : undefined}
            >
              {submitting ? t.create.submitting : t.create.submit}
            </Button>
          </div>
        </Card>
      </main>
      <Footer type="sea" seamless className="create-footer" />
    </div>
  )
}

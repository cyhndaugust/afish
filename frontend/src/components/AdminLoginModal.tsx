import { useState, type FormEvent } from 'react'
import { Button } from 'animal-island-ui'
import { loginAdmin } from '../api'
import { COPY, type Language } from '../i18n'

interface Props {
  language: Language
  onClose: () => void
  onSuccess: (token: string) => void
}

export function AdminLoginModal({ language, onClose, onSuccess }: Props) {
  const t = COPY[language].admin
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [failed, setFailed] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFailed(false)
    setSubmitting(true)
    try {
      const session = await loginAdmin(username.trim(), password)
      onSuccess(session.token)
    } catch {
      setFailed(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <form className="admin-login-modal" role="dialog" aria-modal="true" onSubmit={submit}>
        <button type="button" className="admin-modal-close" onClick={onClose} aria-label={t.cancel}>×</button>
        <h2>{t.loginTitle}</h2>
        <p>{t.loginDescription}</p>

        <label>
          <span>{t.username}</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            maxLength={64}
            required
          />
        </label>
        <label>
          <span>{t.password}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            maxLength={128}
            required
            autoFocus
          />
        </label>

        <div className="admin-login-message" role="status">
          {failed && t.loginFailed}
        </div>
        <div className="admin-login-actions">
          <Button type="text" onClick={onClose} disabled={submitting}>{t.cancel}</Button>
          <Button type="primary" htmlType="submit" loading={submitting} disabled={submitting}>
            {submitting ? t.loggingIn : t.login}
          </Button>
        </div>
      </form>
    </div>
  )
}

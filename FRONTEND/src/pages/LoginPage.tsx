import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../api/client'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { usuario, carregando, login } = useAuth()
  const navigate = useNavigate()
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!carregando && usuario) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await login(nomeUsuario, senha)
      navigate('/')
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={styles.outer}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.logo}>
          <span>izzi</span>
        </div>
        <div className={styles.title}>ASTECA</div>
        <div className={styles.subtitle}>IZZI Celulares · Vendas e Assistência Técnica</div>

        <div className={styles.field}>
          <label>Usuário</label>
          <input className={styles.input} value={nomeUsuario} onChange={(e) => setNomeUsuario(e.target.value)} autoFocus />
        </div>
        <div className={styles.field}>
          <label>Senha</label>
          <input className={styles.input} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>

        {erro && <div className={styles.error}>{erro}</div>}

        <button className={styles.submit} type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

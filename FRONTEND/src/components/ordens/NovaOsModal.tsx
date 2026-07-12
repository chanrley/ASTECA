import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNovaOsModal } from '../../hooks/useNovaOsModal'
import { useCreateOrdem } from '../../hooks/api/useOrdens'
import { useToast } from '../shared/Toast'
import { ReciboModal } from './ReciboModal'
import type { OrdemServicoDto, TipoOrdemServico } from '../../api/types'
import styles from './NovaOsModal.module.css'

interface FormState {
  cpfCnpj: string
  nome: string
  telefone: string
  celular: string
  tipo: TipoOrdemServico
  chip: boolean
  bateria: boolean
  marca: string
  modelo: string
  defeito: string
  valor: string
  observacoes: string
}

const FORM_VAZIO: FormState = {
  cpfCnpj: '',
  nome: '',
  telefone: '',
  celular: '',
  tipo: 'Assistencia',
  chip: false,
  bateria: false,
  marca: '',
  modelo: '',
  defeito: '',
  valor: '',
  observacoes: '',
}

function parseValorBr(valor: string): number {
  const limpo = valor.trim().replace(/\./g, '').replace(',', '.')
  const n = parseFloat(limpo)
  return Number.isFinite(n) ? n : 0
}

export function NovaOsModal() {
  const { aberto, fechar } = useNovaOsModal()
  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [osSalva, setOsSalva] = useState<OrdemServicoDto | null>(null)
  const criar = useCreateOrdem()
  const { showToast } = useToast()
  const navigate = useNavigate()

  function irParaOrdem() {
    const os = osSalva
    setOsSalva(null)
    if (os) navigate(`/ordens/${os.id}`)
  }

  if (osSalva) {
    return <ReciboModal ordem={osSalva} onClose={irParaOrdem} closeLabel="Não imprimir" />
  }

  if (!aberto) return null

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function fecharEResetar() {
    setForm(FORM_VAZIO)
    fechar()
  }

  function stop(e: MouseEvent) {
    e.stopPropagation()
  }

  async function salvar() {
    if (!form.nome.trim()) {
      showToast('Informe o nome do cliente')
      return
    }
    if (!form.marca.trim() && !form.defeito.trim()) {
      showToast('Informe aparelho ou item')
      return
    }

    const digitos = form.cpfCnpj.replace(/\D/g, '')
    const isCnpj = digitos.length > 11

    try {
      const novaOs = await criar.mutateAsync({
        cliente: {
          cpf: !isCnpj && digitos ? form.cpfCnpj.trim() : null,
          cnpj: isCnpj ? form.cpfCnpj.trim() : null,
          nome: form.nome.trim(),
          telefone: form.telefone.trim() || null,
          celular: form.celular.trim() || null,
          endereco: null,
          email: null,
          dataNascimento: null,
          rg: null,
        },
        tipo: form.tipo,
        chip: form.chip,
        bateria: form.bateria,
        marca: form.marca.trim() || null,
        modelo: form.modelo.trim() || null,
        defeito: form.defeito.trim() || null,
        valor: parseValorBr(form.valor),
        observacoes: form.observacoes.trim() || null,
      })
      showToast(`OS ${novaOs.numero} salva com sucesso`)
      setForm(FORM_VAZIO)
      fechar()
      setOsSalva(novaOs)
    } catch {
      showToast('Não foi possível salvar a OS. Tente novamente.')
    }
  }

  return (
    <div className={styles.overlay} onClick={fecharEResetar}>
      <div className={styles.dialog} onClick={stop}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>Nova Ordem de Serviço</div>
            <div className={styles.subtitle}>Cadastro de cliente + aparelho</div>
          </div>
          <button className={styles.closeButton} onClick={fecharEResetar}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div>
            <div className={styles.sectionLabel}>Cliente</div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>CPF / CNPJ</label>
                <input className={styles.input} value={form.cpfCnpj} onChange={(e) => set('cpfCnpj', e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className={styles.field}>
                <label>Nome</label>
                <input className={styles.input} value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Nome do cliente" />
              </div>
              <div className={styles.field}>
                <label>Telefone</label>
                <input className={styles.input} value={form.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(11) 0000-0000" />
              </div>
              <div className={styles.field}>
                <label>Celular</label>
                <input className={styles.input} value={form.celular} onChange={(e) => set('celular', e.target.value)} placeholder="(11) 90000-0000" />
              </div>
            </div>
          </div>

          <div>
            <div className={styles.sectionLabel}>Atendimento</div>
            <div className={styles.row}>
              <div className={styles.toggleGroup}>
                {(['Assistencia', 'Venda'] as TipoOrdemServico[]).map((t) => (
                  <button key={t} className={`${styles.toggleButton} ${form.tipo === t ? styles.on : ''}`} onClick={() => set('tipo', t)}>
                    {t === 'Assistencia' ? 'Assistência' : 'Venda'}
                  </button>
                ))}
              </div>
              <div className={styles.vDivider} />
              <button className={`${styles.toggleButton} ${form.chip ? styles.on : ''}`} onClick={() => set('chip', !form.chip)}>
                Chip
              </button>
              <button className={`${styles.toggleButton} ${form.bateria ? styles.on : ''}`} onClick={() => set('bateria', !form.bateria)}>
                Bateria
              </button>
            </div>
          </div>

          <div>
            <div className={styles.sectionLabel}>Aparelho</div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Marca</label>
                <input className={styles.input} value={form.marca} onChange={(e) => set('marca', e.target.value)} placeholder="Samsung, Motorola…" />
              </div>
              <div className={styles.field}>
                <label>Modelo</label>
                <input className={styles.input} value={form.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="Galaxy A14…" />
              </div>
              <div className={styles.field}>
                <label>Defeito / Item</label>
                <input className={styles.input} value={form.defeito} onChange={(e) => set('defeito', e.target.value)} placeholder="Troca de tela…" />
              </div>
              <div className={styles.field}>
                <label>Valor (R$)</label>
                <input className={styles.input} value={form.valor} onChange={(e) => set('valor', e.target.value)} placeholder="0,00" />
              </div>
            </div>
            <div className={styles.field} style={{ marginTop: 11 }}>
              <label>Observações</label>
              <textarea
                className={styles.textarea}
                rows={2}
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                placeholder="Senha do aparelho, acessórios entregues, prazo…"
              />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={() => setForm(FORM_VAZIO)}>
            Limpar
          </button>
          <button className={styles.btnPrimary} onClick={salvar} disabled={criar.isPending}>
            Salvar OS
          </button>
        </div>
      </div>
    </div>
  )
}

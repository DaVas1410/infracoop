import { useState } from 'react'
import { Layout } from '../components/Layout'
import { submitFormulario, submitNormativa, updateEmbedding } from '../services/dataService'
import { useEmbedder } from '../context/EmbedderContext'
import { useAuth } from '../context/AuthContext'
import type { FormularioData, NormativaFormData } from '../types'

type TipoIngreso = 'dataset' | 'normativa'
type FormStatus = 'idle' | 'loading' | 'success' | 'error'

const AGENDAS = ['Ag. Tecnológica', 'Ag. Datos', 'Ag. Género']

const EMPTY_DATASET: FormularioData = {
  titulo: '', fuente_organismo: '', pais_iso3: '', anio_publicacion: null,
  subtema: '', agendas: [], frecuencia: '', desagregacion_geo: '',
  accesibilidad_formato: '', url_descarga: '', descripcion_notas: '', ingresado_por: '',
}

const EMPTY_NORMATIVA: NormativaFormData = {
  nombre: '', organismo_emisor: '', tipo: '', pais_alcance: '', anio_adopcion: null,
  articulo_numeral: '', obligacion_datos: '', agendas: [],
  url_texto_oficial: '', descripcion_notas: '', ingresado_por: '',
}

export function IngresoForm() {
  const [tipo, setTipo] = useState<TipoIngreso>('dataset')
  const [datasetData, setDatasetData] = useState<FormularioData>(EMPTY_DATASET)
  const [normativaData, setNormativaData] = useState<NormativaFormData>(EMPTY_NORMATIVA)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const { status: embedderStatus, embed } = useEmbedder()
  const { perfil } = useAuth()
  const modo: 'directo' | 'revision' = perfil?.rol === 'admin' ? 'directo' : 'revision'

  function handleAgendasChange(agenda: string, checked: boolean, isDataset: boolean) {
    if (isDataset) {
      setDatasetData(prev => ({
        ...prev,
        agendas: checked ? [...prev.agendas, agenda] : prev.agendas.filter(a => a !== agenda),
      }))
    } else {
      setNormativaData(prev => ({
        ...prev,
        agendas: checked ? [...prev.agendas, agenda] : prev.agendas.filter(a => a !== agenda),
      }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      let insertedId: string | null = null
      if (tipo === 'dataset') {
        insertedId = await submitFormulario(datasetData, modo)
      } else {
        insertedId = await submitNormativa(normativaData, modo)
      }
      setStatus('success')

      if (modo === 'directo' && insertedId && embedderStatus === 'ready') {
        const tabla = tipo === 'dataset' ? 'datasets' : 'normativas'
        const text = tipo === 'dataset'
          ? `${datasetData.titulo} ${datasetData.subtema} ${datasetData.descripcion_notas}`
          : `${normativaData.nombre} ${normativaData.obligacion_datos} ${normativaData.descripcion_notas}`
        embed(text)
          .then(vec => updateEmbedding(tabla, insertedId!, Array.from(vec)))
          .catch(() => {})
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  function handleReset() {
    setDatasetData(EMPTY_DATASET)
    setNormativaData(EMPTY_NORMATIVA)
    setStatus('idle')
    setErrorMsg('')
  }

  const currentAgendas = tipo === 'dataset' ? datasetData.agendas : normativaData.agendas

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="section-label" style={{ marginBottom: '1.5rem' }}>
          <span>05 · Ingresar datos</span>
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', marginBottom: '0.5rem' }}>
          Someter al corpus
        </h1>
        <p style={{ color: 'var(--ink-mid)', fontSize: '14px', marginBottom: '2rem' }}>
          {modo === 'revision'
            ? 'Los envíos pasarán por revisión antes de publicarse.'
            : 'Los envíos se publican directamente en el corpus.'}
        </p>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '2rem' }}>
          {(['dataset', 'normativa'] as TipoIngreso[]).map(t => (
            <button
              key={t}
              type="button"
              className={tipo === t ? 'btn-primary' : 'btn-ghost'}
              onClick={() => { setTipo(t); setStatus('idle'); setErrorMsg('') }}
              style={{ textTransform: 'capitalize' }}
            >
              {t === 'dataset' ? 'Dataset' : 'Normativa'}
            </button>
          ))}
        </div>

        {status === 'success' ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✓</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              {tipo === 'dataset' ? 'Dataset' : 'Normativa'} recibido
            </p>
            <p style={{ color: 'var(--ink-mid)', fontSize: '14px', marginBottom: '1.5rem' }}>
              {modo === 'revision'
                ? 'Está en cola de revisión. El equipo curatorial lo evaluará pronto.'
                : 'Se publicó directamente en el corpus.'}
            </p>
            <button className="btn-ghost" onClick={handleReset}>Ingresar otro</button>
          </div>
        ) : (
          <form className="card" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {tipo === 'dataset' ? (
              <DatasetFields data={datasetData} onChange={setDatasetData} agendas={currentAgendas} onAgendasChange={(a, c) => handleAgendasChange(a, c, true)} />
            ) : (
              <NormativaFields data={normativaData} onChange={setNormativaData} agendas={currentAgendas} onAgendasChange={(a, c) => handleAgendasChange(a, c, false)} />
            )}

            {/* ingresado_por — shared */}
            <Field label="Ingresado por">
              <input
                type="text"
                value={tipo === 'dataset' ? datasetData.ingresado_por : normativaData.ingresado_por}
                onChange={e => tipo === 'dataset'
                  ? setDatasetData(prev => ({ ...prev, ingresado_por: e.target.value }))
                  : setNormativaData(prev => ({ ...prev, ingresado_por: e.target.value }))}
              />
            </Field>

            {status === 'error' && (
              <p style={{ color: 'var(--gap-crit)', fontSize: '13px', fontFamily: 'var(--mono)' }}>
                Error: {errorMsg}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
}

function Field({ label, required, children }: FieldProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--ink-mid)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}{required && <span style={{ color: 'var(--gap-crit)' }}> *</span>}
      </span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--sans)',
  fontSize: '14px',
  background: 'var(--paper-warm)',
  border: '1px solid var(--ink-faint)',
  borderRadius: 'var(--r)',
  padding: '8px 12px',
  color: 'var(--ink)',
  width: '100%',
}

interface DatasetFieldsProps {
  data: FormularioData
  onChange: React.Dispatch<React.SetStateAction<FormularioData>>
  agendas: string[]
  onAgendasChange: (agenda: string, checked: boolean) => void
}

function DatasetFields({ data, onChange, agendas, onAgendasChange }: DatasetFieldsProps) {
  function set(field: keyof FormularioData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <>
      <Field label="Título" required>
        <input style={inputStyle} type="text" value={data.titulo} onChange={set('titulo')} required />
      </Field>
      <Field label="Fuente / Organismo">
        <input style={inputStyle} type="text" value={data.fuente_organismo} onChange={set('fuente_organismo')} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="País (ISO3)">
          <input style={inputStyle} type="text" maxLength={3} value={data.pais_iso3} onChange={set('pais_iso3')} />
        </Field>
        <Field label="Año publicación">
          <input style={inputStyle} type="number" min={1900} max={2100}
            value={data.anio_publicacion ?? ''}
            onChange={e => onChange(prev => ({ ...prev, anio_publicacion: e.target.value ? parseInt(e.target.value) : null }))} />
        </Field>
      </div>
      <Field label="Subtema">
        <input style={inputStyle} type="text" value={data.subtema} onChange={set('subtema')} />
      </Field>
      <AgendasCheckboxes selected={agendas} onChange={onAgendasChange} />
      <Field label="Frecuencia">
        <input style={inputStyle} type="text" value={data.frecuencia} onChange={set('frecuencia')} />
      </Field>
      <Field label="Desagregación geográfica">
        <input style={inputStyle} type="text" value={data.desagregacion_geo} onChange={set('desagregacion_geo')} />
      </Field>
      <Field label="Accesibilidad / Formato">
        <input style={inputStyle} type="text" value={data.accesibilidad_formato} onChange={set('accesibilidad_formato')} />
      </Field>
      <Field label="URL de descarga">
        <input style={inputStyle} type="url" value={data.url_descarga} onChange={set('url_descarga')} />
      </Field>
      <Field label="Descripción / Notas">
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={data.descripcion_notas} onChange={set('descripcion_notas')} />
      </Field>
    </>
  )
}

interface NormativaFieldsProps {
  data: NormativaFormData
  onChange: React.Dispatch<React.SetStateAction<NormativaFormData>>
  agendas: string[]
  onAgendasChange: (agenda: string, checked: boolean) => void
}

function NormativaFields({ data, onChange, agendas, onAgendasChange }: NormativaFieldsProps) {
  function set(field: keyof NormativaFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <>
      <Field label="Nombre" required>
        <input style={inputStyle} type="text" value={data.nombre} onChange={set('nombre')} required />
      </Field>
      <Field label="Organismo emisor">
        <input style={inputStyle} type="text" value={data.organismo_emisor} onChange={set('organismo_emisor')} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Tipo">
          <input style={inputStyle} type="text" value={data.tipo} onChange={set('tipo')} />
        </Field>
        <Field label="País de alcance">
          <input style={inputStyle} type="text" value={data.pais_alcance} onChange={set('pais_alcance')} />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Año adopción">
          <input style={inputStyle} type="number" min={1900} max={2100}
            value={data.anio_adopcion ?? ''}
            onChange={e => onChange(prev => ({ ...prev, anio_adopcion: e.target.value ? parseInt(e.target.value) : null }))} />
        </Field>
        <Field label="Artículo / Numeral">
          <input style={inputStyle} type="text" value={data.articulo_numeral} onChange={set('articulo_numeral')} />
        </Field>
      </div>
      <Field label="Obligación de datos">
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={data.obligacion_datos} onChange={set('obligacion_datos')} />
      </Field>
      <AgendasCheckboxes selected={agendas} onChange={onAgendasChange} />
      <Field label="URL texto oficial">
        <input style={inputStyle} type="url" value={data.url_texto_oficial} onChange={set('url_texto_oficial')} />
      </Field>
      <Field label="Descripción / Notas">
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={data.descripcion_notas} onChange={set('descripcion_notas')} />
      </Field>
    </>
  )
}

interface AgendasCheckboxesProps {
  selected: string[]
  onChange: (agenda: string, checked: boolean) => void
}

function AgendasCheckboxes({ selected, onChange }: AgendasCheckboxesProps) {
  return (
    <Field label="Agendas">
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: 4 }}>
        {AGENDAS.map(ag => (
          <label key={ag} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selected.includes(ag)}
              onChange={e => onChange(ag, e.target.checked)}
            />
            {ag}
          </label>
        ))}
      </div>
    </Field>
  )
}

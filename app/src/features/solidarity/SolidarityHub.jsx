import { useCallback, useEffect, useState } from 'react'
import { apiEmergencia, apiSolidaridad, obtenerToken } from '../../api/veciredApi'
import './solidarity.css'

const TYPES = { prestamo: 'Préstamo', donacion: 'Donación', intercambio_habilidad: 'Habilidad / servicio', ayuda_temporal: 'Necesidad / ofrecimiento', movilidad: 'Movilidad solidaria' }
const PRIORITIES = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }
const EMPTY = { type: 'ayuda_temporal', intent: 'necesidad', title: '', description: '', category: '', neighborhood: '', urgency: 'media', departure: '', destination: '', travel_at: '', passengers: '1', reason: '' }

export default function SolidarityHub({ mode = 'solidaridad', onBack }) {
  const [tab, setTab] = useState(mode === 'emergencia' ? 'emergencias' : 'muro')
  const [requests, setRequests] = useState([])
  const [resources, setResources] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [resourceForm, setResourceForm] = useState({ name: '', type: 'comedor_popular', description: '', contact_phone: '', emergency_phone: '', address: '', neighborhood: '', operating_hours: '' })
  const [detail, setDetail] = useState(null)
  const [editing, setEditing] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const logged = Boolean(obtenerToken())

  const load = useCallback(async () => {
    try {
      const [rs, res] = await Promise.all([
        apiSolidaridad(`/requests?q=${encodeURIComponent(search)}${filter ? `&type=${filter}` : ''}`),
        apiEmergencia(`/resources?q=${encodeURIComponent(search)}`),
      ])
      setRequests(Array.isArray(rs) ? rs : [])
      setResources(Array.isArray(res) ? res : [])
    } catch (e) { setError(e.message) }
  }, [search, filter])

  useEffect(() => { setTab(mode === 'emergencia' ? 'emergencias' : 'muro') }, [mode])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const refresh = () => load()
    window.addEventListener('vecired:auth-changed', refresh)
    return () => window.removeEventListener('vecired:auth-changed', refresh)
  }, [load])

  const act = async (fn, success) => {
    setBusy(true); setError(''); setNotice('')
    try { await fn(); setNotice(success); await load() }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  const createRequest = (e) => {
    e.preventDefault()
    act(async () => {
      await apiSolidaridad('/requests', { method: 'POST', autenticado: true, body: { ...form, passengers: form.type === 'movilidad' ? Number(form.passengers) : undefined, is_emergency: tab === 'emergencias', urgency: tab === 'emergencias' ? form.urgency : 'media' } })
      setForm(EMPTY)
    }, 'Tu publicación quedó guardada.')
  }
  const createResource = (e) => {
    e.preventDefault()
    act(async () => { await apiEmergencia('/resources', { method: 'POST', autenticado: true, body: resourceForm }); setResourceForm({ name: '', type: 'comedor_popular', description: '', contact_phone: '', emergency_phone: '', address: '', neighborhood: '', operating_hours: '' }) }, 'Recurso agregado al directorio.')
  }
  const openDetail = async (item) => {
    try { setDetail(await apiSolidaridad(`/requests/${item.id}`)); setResponseText(''); setError('') }
    catch (e) { setError(e.message) }
  }
  const offerHelp = (e) => {
    e.preventDefault()
    act(async () => { await apiSolidaridad(`/requests/${detail.id}/responses`, { method: 'POST', autenticado: true, body: { message: responseText } }); setDetail(await apiSolidaridad(`/requests/${detail.id}`)); setResponseText('') }, 'Tu ofrecimiento fue enviado.')
  }
  const decide = (responseId, decision) => act(async () => {
    await apiSolidaridad(`/requests/${detail.id}/responses/${responseId}`, { method: 'PUT', autenticado: true, body: { decision } })
    setDetail(await apiSolidaridad(`/requests/${detail.id}`))
  }, decision === 'aceptado' ? 'Ayuda aceptada. La solicitud está en atención.' : 'Propuesta actualizada.')
  const loanAction = (event) => act(async () => {
    await apiSolidaridad(`/requests/${detail.id}/loan`, { method: 'PUT', autenticado: true, body: { event } })
    setDetail(await apiSolidaridad(`/requests/${detail.id}`))
  }, event === 'entregado' ? 'Entrega registrada.' : 'DevoluciÃ³n registrada. El prÃ©stamo quedÃ³ resuelto.')
  const update = (id, body) => act(async () => { await apiSolidaridad(`/requests/${id}`, { method: 'PUT', autenticado: true, body }); if (detail?.id === id) setDetail(await apiSolidaridad(`/requests/${id}`)) }, 'Estado actualizado.')
  const remove = (id) => act(async () => { await apiSolidaridad(`/requests/${id}`, { method: 'DELETE', autenticado: true }); setDetail(null) }, 'Publicación eliminada.')
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  return <section className="solidarity container">
    <div className="solidarity-heading"><div><span className="section-kicker">VECIRED · APOYO MUTUO</span><h1>{tab === 'emergencias' ? 'Emergencias y recursos' : 'Red de solidaridad'}</h1><p>Necesidades, ofrecimientos y apoyo organizado entre vecinos.</p></div>{onBack && <button className="solidarity-back" onClick={onBack}>← Inicio</button>}</div>
    <div className="solidarity-tabs" role="tablist">{[['muro','Muro solidario'],['emergencias','Emergencias'],['recursos','Directorio']].map(([id,label]) => <button key={id} role="tab" aria-selected={tab===id} className={tab===id?'selected':''} onClick={() => {setTab(id);setDetail(null)}}>{label}</button>)}</div>
    {notice && <p className="solidarity-notice" role="status">{notice}</p>}{error && <p className="solidarity-error" role="alert">{error}</p>}
    {tab !== 'recursos' && <>
      <div className="solidarity-tools"><input aria-label="Buscar solicitudes" placeholder="Buscar por título, categoría o descripción" value={search} onChange={e=>setSearch(e.target.value)} />{tab==='muro' && <select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filtrar tipo"><option value="">Todos los apoyos</option>{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>}</div>
      {logged ? <form className="solidarity-form" onSubmit={createRequest}><h2>{tab==='emergencias'?'Publicar una alerta':'Publicar en el muro'}</h2><div className="solidarity-grid">
        {tab==='muro' && <label>Tipo<select value={form.type} onChange={e=>set('type',e.target.value)}>{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>}
        {tab==='muro' && <label>Publicación<select value={form.intent} onChange={e=>set('intent',e.target.value)}><option value="necesidad">Necesito ayuda</option><option value="ofrecimiento">Ofrezco ayuda / recurso</option></select></label>}
        <label>Título<input required maxLength="150" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="¿Qué necesitas o puedes ofrecer?" /></label>
        <label>Categoría<input required value={form.category} onChange={e=>set('category',e.target.value)} placeholder="Alimentos, salud, hogar…" /></label>
        <label>Zona<input value={form.neighborhood} onChange={e=>set('neighborhood',e.target.value)} placeholder="Tu barrio" /></label>
        {tab==='emergencias' && <label>Prioridad<select value={form.urgency} onChange={e=>set('urgency',e.target.value)}>{Object.entries(PRIORITIES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>}
        <label className="wide">Descripción y motivo<textarea required rows="3" value={form.description} onChange={e=>{set('description',e.target.value);set('reason',e.target.value)}} placeholder="Cuéntale a la comunidad qué ocurre…" /></label>
        {form.type==='movilidad' && tab==='muro' && <><label>Partida<input required value={form.departure} onChange={e=>set('departure',e.target.value)} /></label><label>Destino<input required value={form.destination} onChange={e=>set('destination',e.target.value)} /></label><label>Fecha y hora<input required type="datetime-local" value={form.travel_at} onChange={e=>set('travel_at',e.target.value)} /></label><label>Pasajeros<input required type="number" min="1" max="20" value={form.passengers} onChange={e=>set('passengers',e.target.value)} /></label></>}
      </div><button className="solidarity-primary" disabled={busy}>{busy?'Guardando…':'Publicar solicitud'}</button></form> : <div className="solidarity-signin">Inicia sesión en <strong>Mi cuenta</strong> para publicar, responder o registrar recursos.</div>}
      {detail ? <article className="solidarity-detail"><button className="solidarity-back" onClick={()=>{setDetail(null);setEditing(false)}}>← Volver al listado</button><span className={`priority priority-${detail.urgency}`}>{detail.is_emergency?'EMERGENCIA · ':''}{PRIORITIES[detail.urgency]}</span>{editing ? <form onSubmit={e=>{e.preventDefault();act(async()=>{await apiSolidaridad(`/requests/${detail.id}`,{method:'PUT',autenticado:true,body:{title:detail.title,description:detail.description,category:detail.category,neighborhood:detail.neighborhood}});setDetail(await apiSolidaridad(`/requests/${detail.id}`));setEditing(false)},'Cambios guardados.')}}><label className="solidarity-label">Título<input value={detail.title} onChange={e=>setDetail({...detail,title:e.target.value})}/></label><label className="solidarity-label">Descripción<textarea rows="4" value={detail.description} onChange={e=>setDetail({...detail,description:e.target.value})}/></label><label className="solidarity-label">Categoría<input value={detail.category} onChange={e=>setDetail({...detail,category:e.target.value})}/></label><button className="solidarity-primary">Guardar cambios</button></form> : <><h2>{detail.title}</h2><p>{detail.description}</p><p className="muted">{detail.intent==='ofrecimiento'?'Ofrecimiento':'Necesidad'} · {TYPES[detail.type]} · {detail.category} · {detail.neighborhood} · {detail.author_name} · {detail.status}</p></>}{detail.type==='movilidad'&&<p><b>Ruta:</b> {detail.departure} → {detail.destination} · {new Date(detail.travel_at).toLocaleString()} · {detail.passengers} pasajeros</p>}
        {detail.type==='prestamo'&&<div className="loan-progress"><strong>Estado del préstamo: {detail.loan_status||'solicitado'}</strong><p>Recibe: {detail.author_name}{detail.lender_name&&<> · Presta: {detail.lender_name}</>}</p>{detail.loan_delivered_at&&<small>Entrega: {new Date(detail.loan_delivered_at).toLocaleString()}</small>}{detail.loan_returned_at&&<small> · Devolución: {new Date(detail.loan_returned_at).toLocaleString()}</small>}</div>}
        {logged&&detail.type==='prestamo'&&detail.resolved_by_user_id===readUserId()&&detail.loan_status==='aceptado'&&<button className="solidarity-primary" disabled={busy} onClick={()=>loanAction('entregado')}>Confirmar entrega del artículo</button>}
        {logged&&detail.type==='prestamo'&&detail.user_id===readUserId()&&detail.loan_status==='entregado'&&<button className="solidarity-primary" disabled={busy} onClick={()=>loanAction('devuelto')}>Registrar devolución y resolver</button>}        <h3>Respuestas ({detail.responses?.length||0})</h3>{detail.responses?.map(r=><div className="response-row" key={r.id}><div><b>{r.helper_name}</b><p>{r.message}</p><small>{r.status}</small></div>{logged&&detail.user_id===readUserId()&&r.status==='ofrecido'&&<div className="response-actions"><button onClick={()=>decide(r.id,'aceptado')}>Aceptar</button><button onClick={()=>decide(r.id,'rechazado')}>Rechazar</button></div>}</div>)}
        {logged&&detail.user_id!==readUserId()&&detail.status==='abierta'&&<form onSubmit={offerHelp}><label className="solidarity-label">{detail.type==='prestamo'?'Ofrece prestar este artículo':'Ofrece tu ayuda'}<textarea required rows="2" value={responseText} onChange={e=>setResponseText(e.target.value)} placeholder={detail.type==='prestamo'?'Confirma qué artículo prestarás y las condiciones…':'¿Cómo puedes ayudar?'} /></label><button className="solidarity-primary" disabled={busy}>{detail.type==='prestamo'?'Enviar propuesta de préstamo':'Enviar ofrecimiento'}</button></form>}
        {logged&&detail.user_id===readUserId()&&<div className="own-actions"><button onClick={()=>setEditing(!editing)}>{editing?'Cancelar edición':'Editar publicación'}</button><button disabled={detail.type==='prestamo'} onClick={()=>update(detail.id,{status:detail.status==='resuelta'?'abierta':'resuelta'})}>{detail.status==='resuelta'?'Reabrir':'Marcar resuelta'}</button><button className="danger" onClick={()=>remove(detail.id)}>Eliminar publicación</button></div>}
      </article> : <div className="solidarity-list">{requests.filter(r=>tab==='emergencias'?r.is_emergency:true).map(r=><article className={`request-card ${r.is_emergency?'is-emergency':''}`} key={r.id}><div className="request-meta"><span>{r.intent==='ofrecimiento'?'Ofrecimiento':'Necesidad'} · {TYPES[r.type]||r.type}</span><span className={`priority priority-${r.urgency}`}>{PRIORITIES[r.urgency]}</span></div><h2>{r.title}</h2><p>{r.description}</p>{r.type==='movilidad'&&<p className="route-line">{r.departure} → {r.destination} · {r.passengers} pasajeros</p>}<div className="request-footer"><span>{r.category} · {r.neighborhood} · {r.status.replace('_',' ')}</span><button onClick={()=>openDetail(r)}>Ver detalle y responder →</button></div></article>)}{requests.filter(r=>tab==='emergencias'?r.is_emergency:true).length===0&&<div className="solidarity-empty">No hay solicitudes que coincidan. Puedes crear una nueva arriba.</div>}</div>}
    </>}
    {tab==='recursos'&&<><div className="solidarity-tools"><input aria-label="Buscar recursos" placeholder="Buscar organización o recurso" value={search} onChange={e=>setSearch(e.target.value)} /></div>{logged&&<form className="solidarity-form" onSubmit={createResource}><h2>Registrar un recurso comunitario</h2><div className="solidarity-grid"><label>Nombre<input required value={resourceForm.name} onChange={e=>setResourceForm({...resourceForm,name:e.target.value})}/></label><label>Categoría<select value={resourceForm.type} onChange={e=>setResourceForm({...resourceForm,type:e.target.value})}>{[['salud','Salud'],['bomberos','Bomberos'],['seguridad_vecinal','Seguridad vecinal'],['comedor_popular','Comedor popular'],['refugio','Refugio'],['voluntariado','Grupo de apoyo']].map(([v,t])=><option value={v} key={v}>{t}</option>)}</select></label><label>Teléfono de contacto<input required value={resourceForm.contact_phone} onChange={e=>setResourceForm({...resourceForm,contact_phone:e.target.value})}/></label><label>Teléfono de emergencia<input value={resourceForm.emergency_phone} onChange={e=>setResourceForm({...resourceForm,emergency_phone:e.target.value})}/></label><label>Ubicación / dirección<input value={resourceForm.address} onChange={e=>setResourceForm({...resourceForm,address:e.target.value})}/></label><label>Zona<input value={resourceForm.neighborhood} onChange={e=>setResourceForm({...resourceForm,neighborhood:e.target.value})}/></label><label>Horario<input value={resourceForm.operating_hours} onChange={e=>setResourceForm({...resourceForm,operating_hours:e.target.value})} placeholder="Lun–Vie 9:00–17:00"/></label><label className="wide">Descripción<input value={resourceForm.description} onChange={e=>setResourceForm({...resourceForm,description:e.target.value})}/></label></div><button className="solidarity-primary" disabled={busy}>Agregar al directorio</button></form>}{resources.map(r=><article className="resource-card" key={r.id}><div><span className="section-kicker">{r.type.replaceAll('_',' ')}</span><h2>{r.name}</h2><p>{r.description}</p><small>{r.address} · {r.neighborhood} · {r.operating_hours}</small></div><a href={`tel:${r.emergency_phone||r.contact_phone}`}>Llamar {r.emergency_phone||r.contact_phone}</a></article>)}{!resources.length&&<div className="solidarity-empty">Todavía no hay recursos registrados.</div>}</>}
  </section>
}

function readUserId() { try { const payload = obtenerToken()?.split('.')[1] || ''; const decoded = JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/'))); return decoded.id || decoded.sub } catch { return null } }

import { useEffect, useMemo, useRef, useState } from 'react'
import { Archive, ArrowLeft, Check, CheckCircle2, ChevronRight, Circle, List, Moon, Plus, Search, ShoppingBasket, Sun, X } from 'lucide-react'
import { loadData, saveData, type Data, type Product } from './storage'

type Tab = 'list' | 'products'
const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
type Theme = 'light' | 'dark'
function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('shopping-list-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* Storage may be unavailable; use the device preference. */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [data, setData] = useState<Data>(loadData)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [tab, setTab] = useState<Tab>('list')
  const [shopping, setShopping] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null)
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (!saveData(data)) setNotice('Impossibile salvare: spazio locale non disponibile.') }, [data])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#151915' : '#f6f7f4')
    document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default')
    try { localStorage.setItem('shopping-list-theme', theme) } catch { /* Theme remains active until the app closes. */ }
  }, [theme])
  useEffect(() => { if (notice) { const t = setTimeout(() => setNotice(''), 3000); return () => clearTimeout(t) } }, [notice])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4500); return () => clearTimeout(t) } }, [toast])

  const products = data.products
  const entries = data.list
  const remaining = entries.filter(e => !e.purchased)
  const bought = entries.filter(e => e.purchased)
  const percent = entries.length ? Math.round(bought.length / entries.length * 100) : 0
  const names = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products])
  const filteredProducts = products.filter(p => p.name.toLocaleLowerCase('it').includes(query.trim().toLocaleLowerCase('it')))
  const change = (fn: (current: Data) => Data) => setData(current => fn(current))

  function addItem(id: string) {
    if (entries.some(e => e.productId === id)) return
    change(d => ({ ...d, list: [...d.list, { productId: id, purchased: false }] }))
  }
  function removeItem(id: string) { change(d => ({ ...d, list: d.list.filter(e => e.productId !== id) })) }
  function purchase(id: string) {
    change(d => ({ ...d, list: d.list.map(e => e.productId === id ? { ...e, purchased: true } : e) }))
    setToast({ id, name: names.get(id) ?? 'Prodotto' })
  }
  function undo() {
    if (!toast) return
    const id = toast.id
    change(d => ({ ...d, list: d.list.map(e => e.productId === id ? { ...e, purchased: false } : e) }))
    setToast(null)
  }
  function saveProduct() {
    const name = draft.trim()
    if (!name) return
    if (products.some(p => p.name.toLocaleLowerCase('it') === name.toLocaleLowerCase('it') && p.id !== editing?.id)) { setNotice('Questo prodotto è già nell’archivio.'); return }
    if (editing) change(d => ({ ...d, products: d.products.map(p => p.id === editing.id ? { ...p, name } : p) }))
    else change(d => ({ ...d, products: [...d.products, { id: uid(), name }] }))
    setDraft(''); setEditing(null); setNotice(editing ? 'Nome aggiornato.' : 'Prodotto aggiunto.')
  }
  function editProduct(p: Product) { setEditing(p); setDraft(p.name); setTimeout(() => inputRef.current?.focus(), 20) }
  function deleteProduct(p: Product) {
    if (!window.confirm(`Eliminare “${p.name}” dall’archivio e dalla lista?`)) return
    change(d => ({ products: d.products.filter(x => x.id !== p.id), list: d.list.filter(e => e.productId !== p.id) }))
    setNotice('Prodotto eliminato.')
  }
  function finishShopping() {
    if (!window.confirm('Hai acquistato tutti i prodotti. Vuoi eliminare la lista della spesa? I prodotti resteranno nell’archivio.')) return
    change(d => ({ ...d, list: [] })); setShopping(false); setTab('list'); setToast(null)
  }

  return <main className={`app-shell ${shopping ? 'shopping-mode' : ''}`}>
    {shopping ? <>
      <header className="shop-header"><button className="icon-btn back" aria-label="Torna alla lista" onClick={() => setShopping(false)}><ArrowLeft /></button><div><span className="eyebrow">LA MIA SPESA</span><h1>Al supermercato</h1></div><button className="theme-toggle" aria-label={theme === 'dark' ? 'Attiva modalità giorno' : 'Attiva modalità notte'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}</button></header>
      <section className="progress-card" aria-label="Avanzamento spesa"><div className="progress-copy"><strong>{bought.length} di {entries.length} prodotti acquistati</strong><span>{percent}%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${percent}%` }}/></div></section>
      {entries.length > 0 && remaining.length === 0 && <section className="completion"><span className="completion-icon"><Check size={30}/></span><h2>Spesa completata!</h2><p>Hai acquistato tutti i prodotti.</p><button className="primary-btn finish" onClick={finishShopping}>Termina spesa <ChevronRight size={18}/></button></section>}
      {!(entries.length > 0 && remaining.length === 0) && <div className="section-heading"><div><h2>Da prendere</h2><span>{remaining.length} {remaining.length === 1 ? 'prodotto' : 'prodotti'}</span></div></div>}
      <div className="shopping-products-scroll">
        {!(entries.length > 0 && remaining.length === 0) && <div className="shopping-list">{remaining.map(e => <SwipeCard key={e.productId} name={names.get(e.productId) ?? ''} onBought={() => purchase(e.productId)} onRemove={() => removeItem(e.productId)} />)}</div>}
        {remaining.length === 0 && entries.length === 0 && <Empty icon={<ShoppingBasket/>} title="La lista è vuota" body="Aggiungi i prodotti che ti servono prima di iniziare." action={<button className="text-action" onClick={() => setShopping(false)}>Torna alla lista</button>} />}
        {bought.length > 0 && <section className="bought-section"><h2>Nel carrello <span>{bought.length}</span></h2>{bought.map(e => <div className="bought-row" key={e.productId}><button className="check-btn checked" aria-label={`Annulla acquisto ${names.get(e.productId)}`} onClick={() => { change(d => ({ ...d, list: d.list.map(x => x.productId === e.productId ? { ...x, purchased: false } : x) })); setToast(null) }}><CheckCircle2/></button><span>{names.get(e.productId)}</span><button className="remove-btn" aria-label={`Rimuovi ${names.get(e.productId)}`} onClick={() => removeItem(e.productId)}><X size={18}/></button></div>)}</section>}
      </div>
    </> : <>
      <header className="page-header"><div className="header-top">{tab === 'products' && <span className="eyebrow">IL TUO ARCHIVIO</span>}<div className="header-actions"><button className="theme-toggle" aria-label={theme === 'dark' ? 'Attiva modalità giorno' : 'Attiva modalità notte'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>{tab === 'products' && <span className="date-mark"><Archive size={19}/></span>}</div></div><h1>{tab === 'list' ? 'La mia spesa' : 'I prodotti'}</h1><p>{tab === 'list' ? `${remaining.length} ${remaining.length === 1 ? 'prodotto da acquistare' : 'prodotti da acquistare'}` : `${products.length} ${products.length === 1 ? 'prodotto salvato' : 'prodotti salvati'}`}</p></header>
      {tab === 'list' ? <>
        <section className="progress-card"><div className="progress-copy"><strong>{bought.length} di {entries.length} prodotti acquistati</strong><span>{percent}%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${percent}%` }}/></div></section>
        <div className="section-heading list-title"><div><h2>Lista corrente</h2><span>{entries.length ? 'Pronta per la tua prossima spesa' : 'Tutto quello che ti serve, in un posto'}</span></div><button className="add-circle" aria-label="Aggiungi prodotti" onClick={() => { setQuery(''); setSheet(true) }}><Plus size={22}/></button></div>
        {entries.length === 0 ? <Empty icon={<List/>} title="La lista è vuota" body="Aggiungi i tuoi prodotti preferiti e prepara la prossima spesa." action={<button className="primary-btn" onClick={() => { setQuery(''); setSheet(true) }}><Plus size={18}/> Aggiungi prodotti</button>} /> : <>
          <div className="list-card">{remaining.map(e => <div className="list-row" key={e.productId}><button className="check-btn" aria-label={`Segna ${names.get(e.productId)} come acquistato`} onClick={() => purchase(e.productId)}><Circle/></button><span>{names.get(e.productId)}</span><button className="remove-btn" aria-label={`Rimuovi ${names.get(e.productId)}`} onClick={() => removeItem(e.productId)}><X size={18}/></button></div>)}{bought.length > 0 && <><div className="subheading">ACQUISTATI</div>{bought.map(e => <div className="list-row purchased" key={e.productId}><button className="check-btn checked" aria-label={`Annulla acquisto ${names.get(e.productId)}`} onClick={() => change(d => ({ ...d, list: d.list.map(x => x.productId === e.productId ? { ...x, purchased: false } : x) }))}><CheckCircle2/></button><span>{names.get(e.productId)}</span><button className="remove-btn" aria-label={`Rimuovi ${names.get(e.productId)}`} onClick={() => removeItem(e.productId)}><X size={18}/></button></div>)}</>}</div>
          <button className="primary-btn start-btn" onClick={() => setShopping(true)}><ShoppingBasket size={18}/> Inizia la spesa</button>
        </>}
      </> : <>
        <div className="product-entry"><form onSubmit={e => { e.preventDefault(); saveProduct() }}><div className="input-wrap"><Plus size={19}/><input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} placeholder={editing ? 'Modifica nome' : 'Nome del prodotto'} aria-label="Nome del prodotto" maxLength={60}/>{draft && <button type="button" className="clear-input" onClick={() => { setDraft(''); setEditing(null) }} aria-label="Annulla"><X size={17}/></button>}</div><button className="primary-btn add-product" type="submit" disabled={!draft.trim()}>{editing ? 'Salva' : 'Aggiungi'}</button></form></div>
        <div className="search-field"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cerca prodotti" aria-label="Cerca prodotti"/>{query && <button onClick={() => setQuery('')} aria-label="Cancella ricerca"><X size={17}/></button>}</div>
        <div className="section-heading products-heading"><div><h2>Il tuo archivio</h2><span>Scorri a destra per modificare, a sinistra per eliminare</span></div><span className="count-pill">{filteredProducts.length}</span></div>
        {filteredProducts.length === 0 ? <Empty icon={<Archive/>} title={products.length ? 'Nessun risultato' : 'Ancora nessun prodotto'} body={products.length ? 'Prova con un altro nome.' : 'Aggiungi i prodotti che compri più spesso.'} /> : <div className="list-card archive-card">{filteredProducts.map(p => <ArchiveSwipeRow key={p.id} product={p} onEdit={() => editProduct(p)} onDelete={() => deleteProduct(p)} />)}</div>}
      </>}
      <nav className="bottom-nav" aria-label="Navigazione principale"><button className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}><List size={21}/><span>Lista</span></button><button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}><Archive size={21}/><span>Prodotti</span></button></nav>
    </>}
    {sheet && <div className="sheet-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSheet(false) }}><section className="add-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div className="sheet-handle"/><div className="sheet-header"><div><span className="eyebrow">IL TUO ARCHIVIO</span><h2 id="sheet-title">Aggiungi prodotti</h2></div><button className="close-sheet" onClick={() => setSheet(false)} aria-label="Chiudi"><X/></button></div><div className="search-field sheet-search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cerca un prodotto" aria-label="Cerca un prodotto"/>{query && <button onClick={() => setQuery('')} aria-label="Cancella ricerca"><X size={17}/></button>}</div><div className="sheet-list">{filteredProducts.length ? filteredProducts.map(p => { const added = entries.some(e => e.productId === p.id); return <button className={`sheet-product ${added ? 'is-added' : ''}`} key={p.id} disabled={added} onClick={() => addItem(p.id)}><span>{p.name}</span>{added ? <span className="added-label"><Check size={15}/> Aggiunto</span> : <Plus size={19}/>}</button> }) : <Empty icon={<Archive/>} title={products.length ? 'Nessun risultato' : 'Archivio vuoto'} body={products.length ? 'Prova con un altro nome.' : 'Crea prima i tuoi prodotti nella sezione Prodotti.'} />}</div><div className="sheet-footer"><button className="primary-btn" onClick={() => setSheet(false)}>Fatto</button></div></section></div>}
    {toast && <div className="toast" role="status"><span className="toast-check"><Check size={15}/></span><span>Prodotto aggiunto al carrello</span><button onClick={undo}>Annulla</button></div>}
    {notice && <div className="notice" role="status">{notice}</div>}
  </main>
}

function Empty({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{body}</p>{action}</div>
}

function ArchiveSwipeRow({ product, onEdit, onDelete }: { product: Product; onEdit: () => void; onDelete: () => void }) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ x: number; y: number } | null>(null)
  const threshold = 78
  function pointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function pointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    if (Math.abs(dx) > Math.abs(dy) * 1.1) setOffset(Math.max(-130, Math.min(dx, 130)))
  }
  function pointerEnd() {
    if (!start.current) return
    start.current = null
    setDragging(false)
    if (offset >= threshold) { setOffset(0); onEdit() }
    else if (offset <= -threshold) { setOffset(0); onDelete() }
    else setOffset(0)
  }
  function keyAction(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight') { e.preventDefault(); onEdit() }
    if (e.key === 'ArrowLeft') { e.preventDefault(); onDelete() }
    if (e.key === 'Enter') { e.preventDefault(); onEdit() }
  }
  return <div className="archive-swipe-wrap"><span className="archive-swipe-hint edit-hint" style={{ opacity: Math.max(0, offset) / threshold }}>Modifica</span><span className="archive-swipe-hint delete-hint" style={{ opacity: Math.max(0, -offset) / threshold }}>Elimina</span><div className={`list-row archive-row ${dragging ? 'dragging' : ''}`} style={{ transform: `translateX(${offset}px)` }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onKeyDown={keyAction} role="group" tabIndex={0} aria-label={`${product.name}. Scorri a destra per modificare, a sinistra per eliminare.`}><span>{product.name}</span></div></div>
}

function SwipeCard({ name, onBought, onRemove }: { name: string; onBought: () => void; onRemove: () => void }) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ x: number; y: number } | null>(null)
  const threshold = 86
  function pointerDown(e: React.PointerEvent<HTMLDivElement>) { if (e.pointerType === 'mouse' && e.button !== 0) return; start.current = { x: e.clientX, y: e.clientY }; setDragging(true); e.currentTarget.setPointerCapture(e.pointerId) }
  function pointerMove(e: React.PointerEvent<HTMLDivElement>) { if (!start.current) return; const dx = e.clientX - start.current.x; const dy = e.clientY - start.current.y; if (Math.abs(dx) > Math.abs(dy) * 1.1 && dx > 0) setOffset(Math.min(dx, 150)); else if (dx < 0) setOffset(Math.max(dx, -60)) }
  function pointerEnd() { if (!start.current) return; setDragging(false); start.current = null; if (offset >= threshold) { setOffset(0); onBought() } else if (offset < -48) { setOffset(0); onRemove() } else setOffset(0) }
  return <div className="swipe-wrap"><div className="swipe-feedback" style={{ opacity: Math.min(offset / threshold, 1) }}><CheckCircle2 size={22}/><span>Acquistato</span></div><div className={`swipe-card ${dragging ? 'dragging' : ''}`} style={{ transform: `translateX(${offset}px)` }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}><button className="check-btn" aria-label={`Segna ${name} come acquistato`} onClick={onBought}><Circle/></button><span>{name}</span><button className="remove-btn" aria-label={`Rimuovi ${name}`} onClick={onRemove}><X size={18}/></button></div></div>
}

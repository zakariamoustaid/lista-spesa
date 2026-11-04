export type Product = { id: string; name: string }
export type Entry = { productId: string; purchased: boolean }
export type Data = { products: Product[]; list: Entry[] }
const KEY = 'shopping-list-data-v1'

export function loadData(): Data {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { products: [], list: [] }
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return { products: [], list: [] }
    const v = value as Record<string, unknown>
    const products = Array.isArray(v.products) ? v.products.filter((p): p is Product => !!p && typeof p.id === 'string' && typeof p.name === 'string' && !!p.name.trim()) : []
    const ids = new Set(products.map(p => p.id))
    const seen = new Set<string>()
    const list = Array.isArray(v.list) ? v.list.filter((e): e is Entry => !!e && typeof e.productId === 'string' && ids.has(e.productId) && !seen.has(e.productId) && (seen.add(e.productId), true)).map(e => ({ productId: e.productId, purchased: e.purchased === true })) : []
    return { products, list }
  } catch { return { products: [], list: [] } }
}

export function saveData(data: Data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true } catch { return false }
}

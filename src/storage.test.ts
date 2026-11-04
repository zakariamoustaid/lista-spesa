import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadData, saveData } from './storage'

const memory = new Map<string, string>()
const localStorageMock = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, String(value)) },
  removeItem: (key: string) => { memory.delete(key) },
  clear: () => { memory.clear() },
}
vi.stubGlobal('localStorage', localStorageMock)

describe('local data persistence', () => {
  beforeEach(() => { localStorage.clear() })
  it('persists products and purchased state', () => {
    const data = { products: [{ id: 'a', name: 'Pane' }], list: [{ productId: 'a', purchased: true }] }
    expect(saveData(data)).toBe(true)
    expect(loadData()).toEqual(data)
  })
  it('drops malformed, duplicate, and orphaned list entries', () => {
    localStorage.setItem('shopping-list-data-v1', JSON.stringify({ products: [{ id: 'a', name: 'Pane' }], list: [{ productId: 'a' }, { productId: 'a', purchased: true }, { productId: 'lost', purchased: false }] }))
    expect(loadData().list).toEqual([{ productId: 'a', purchased: false }])
  })
  it('recovers safely from invalid data and storage failures', () => {
    localStorage.setItem('shopping-list-data-v1', '{')
    expect(loadData()).toEqual({ products: [], list: [] })
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('full') })
    expect(saveData({ products: [], list: [] })).toBe(false)
    spy.mockRestore()
  })
})

const store = new Map()

export function saveQuoted(id, data) {
  store.set(id, { data, ts: Date.now() })
  setTimeout(() => store.delete(id), 10 * 60 * 1000)
}

export function getQuoted(id) {
  return store.get(id)?.data || null
}

export function deleteQuoted(id) {
  store.delete(id)
}

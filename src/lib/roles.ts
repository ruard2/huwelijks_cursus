export function isEditor(name: string) {
  const n = name.toLowerCase()
  return n === 'elianek' || n === 'ruard' || n === 'admin'
}

export function isAdmin(name: string) {
  const n = name.toLowerCase()
  return n === 'ruard' || n === 'admin'
}

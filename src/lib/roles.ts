export function isEditor(name: string) {
  return name.toLowerCase() === 'elianek'
}

export function isAdmin(name: string) {
  const n = name.toLowerCase()
  return n === 'ruard' || n === 'admin'
}

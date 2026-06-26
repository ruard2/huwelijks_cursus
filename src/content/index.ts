export * from './types'
export { vooraf } from './vooraf'
export { deelA } from './deel-a'
export { deelB } from './deel-b'
export { deelC } from './deel-c'
export { deelD } from './deel-d'
export { deelE } from './deel-e'
export { deelF } from './deel-f'
export { deelG } from './deel-g'
export { deelH } from './deel-h'

import { vooraf } from './vooraf'
import { deelA } from './deel-a'
import { deelB } from './deel-b'
import { deelC } from './deel-c'
import { deelD } from './deel-d'
import { deelE } from './deel-e'
import { deelF } from './deel-f'
import { deelG } from './deel-g'
import { deelH } from './deel-h'
import { Deel, Chapter } from './types'

export const DELEN: Deel[] = [vooraf, deelA, deelB, deelC, deelD, deelE, deelF, deelG, deelH]

export function getDeel(id: string): Deel | undefined {
  return DELEN.find(d => d.id === id)
}

export function getChapter(chapterId: string): { chapter: Chapter; deel: Deel } | undefined {
  for (const deel of DELEN) {
    const chapter = deel.chapters.find(c => c.id === chapterId)
    if (chapter) return { chapter, deel }
  }
  return undefined
}

export function getAllChapters(): Array<{ chapter: Chapter; deel: Deel }> {
  return DELEN.flatMap(deel => deel.chapters.map(chapter => ({ chapter, deel })))
}

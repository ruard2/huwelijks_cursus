export type QuestionType = 'textarea' | 'checkbox' | 'parts' | 'readonly'

export interface QuestionPart {
  id: string
  label: string
  placeholder?: string
}

export interface Question {
  id: string
  text: string
  hint?: string
  type?: QuestionType
  options?: string[]
  other?: boolean
  parts?: QuestionPart[]
  placeholder?: string
  value?: string
}

export type SectionType = 'personal' | 'samen' | 'reflection' | 'personal_man' | 'personal_vrouw'

export interface Section {
  id: string
  title: string
  type: SectionType
  intro?: string
  questions: Question[]
}

export interface Subsection {
  id: string
  number: string
  title: string
  intro: string
  sections: Section[]
}

export interface Verse {
  ref: string
  text: string
  pretext?: string
}

export interface Chapter {
  id: string
  number: number | string
  title: string
  deelId: string
  verse?: Verse
  intro?: string
  sections: Section[]
  subsections?: Subsection[]
}

export interface Deel {
  id: string
  letter?: string
  title: string
  subtitle: string
  intro: string
  color: string
  chapters: Chapter[]
}

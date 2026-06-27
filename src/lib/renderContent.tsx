import React from 'react'

export function renderContent(value: string, className: string): React.ReactNode {
  if (!value) return null
  if (value.trimStart().startsWith('<')) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: value }} />
  }
  return value.split('\n\n').map((para, i) => (
    <p key={i} className={className}>{para}</p>
  ))
}

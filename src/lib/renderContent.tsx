import React from 'react'

export function renderContent(value: string, className: string): React.ReactNode {
  if (!value) return null
  if (value.trimStart().startsWith('<')) {
    return (
      <>
        <style>{`
          .rc-html p { margin-bottom: 0.6em; line-height: 1.65; }
          .rc-html p:last-child { margin-bottom: 0; }
          .rc-html p:empty { min-height: 1em; }
          .rc-html ul { margin: 0.25em 0 0.6em 1.25em; list-style: disc; }
          .rc-html li { margin-bottom: 0.2em; line-height: 1.55; }
          .rc-html strong { font-weight: 700; }
          .rc-html em { font-style: italic; }
          .rc-html u { text-decoration: underline; }
        `}</style>
        <div className={`rc-html ${className}`} dangerouslySetInnerHTML={{ __html: value }} />
      </>
    )
  }
  return value.split('\n\n').map((para, i) => (
    <p key={i} className={className}>{para}</p>
  ))
}

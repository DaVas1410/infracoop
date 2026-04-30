interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <main className="container">{children}</main>
      <footer style={{
        borderTop: '1px solid var(--ink-faint)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem',
        fontFamily: 'var(--mono)',
        fontSize: '11px',
        color: 'var(--ink-light)',
        maxWidth: 1000,
        margin: '0 auto',
      }}>
        <span>
          Diseño Data Cooperativas Latina, Desarrollo e Implementación{' '}
          <a
            href="https://diversa.studio/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'underline' }}
          >
            Diversa
          </a>
        </span>
        <span>DataCooperativas Latinas. BY-NC-SA</span>
      </footer>
    </>
  )
}

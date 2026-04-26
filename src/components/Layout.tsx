interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <main className="container">{children}</main>
      <footer style={{
        textAlign: 'center',
        padding: '2rem 0 1.5rem',
        fontFamily: 'var(--mono)',
        fontSize: '10px',
        color: 'var(--ink-light)',
        letterSpacing: '0.08em',
      }}>
        Desarrollado por Diversa
      </footer>
    </>
  )
}

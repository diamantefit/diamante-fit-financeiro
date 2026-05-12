export const metadata = {
  title: 'Diamante Fit ATM — Financeiro',
  description: 'Sistema financeiro de vendas Diamante Fit ATM',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0a' }}>{children}</body>
    </html>
  )
}

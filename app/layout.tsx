export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-gradient-to-br from-blue-900 to-purple-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}

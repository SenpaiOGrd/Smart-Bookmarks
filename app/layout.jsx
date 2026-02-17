import './globals.css'

export const metadata = {
  title: 'Smart Bookmark App',
  description: 'Save and manage your bookmarks',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
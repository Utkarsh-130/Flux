import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/sidebar'
import { AppProvider } from '@/lib/AppContext'
import { ThemeProvider } from '@/components/theme-provider'
import { TelegramSettingsModal } from '@/components/TelegramSettingsModal'
import { SearchOverlay } from '@/components/SearchOverlay'
import { TitleBar } from '@/components/TitleBar'

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: 'flux - Telegram Job Scraper',
  description: 'Scrape job postings from Telegram channels',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/icon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/icon.ico',
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-white dark:bg-[#121315] text-text-primary flex flex-col h-screen overflow-hidden">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <AppProvider>
          <div className="fixed top-0 left-0 right-0 h-[30px] z-50">
            <TitleBar />
          </div>
          <div className="relative flex-1 flex pt-[30px] h-[calc(100vh-30px)] overflow-hidden">
            <Sidebar />
            <main className="flex-1 pl-80 pr-6 py-6 h-full overflow-y-auto">
              {children}
            </main>
          </div>
          <TelegramSettingsModal />
          <SearchOverlay />
        </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

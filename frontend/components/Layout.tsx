'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { clearTokens, isAuthenticated } from '@/lib/auth'
import { useEffect, useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    clearTokens()
    router.push('/login')
  }

  if (!mounted) {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Phone Numbers', href: '/phone-numbers' },
    { name: 'AI Agents', href: '/ai-agents' },
    { name: 'Call Logs', href: '/call-logs' },
    { name: 'Orders', href: '/orders' },
  ]

  return (
    <div className="min-h-screen bg-[#05080a] text-white selection:bg-[#5e9cb9]/30">
      <nav className="bg-[#0b1114]/80 backdrop-blur-md border-b border-[#1a2126] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#5e9cb9] to-[#3b82f6] rounded-xl flex items-center justify-center shadow-lg shadow-[#5e9cb9]/20">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-[#8a99a8] tracking-tight">PEGASUS</h1>
              </div>
              <div className="hidden lg:ml-12 lg:flex lg:space-x-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${isActive
                          ? 'bg-[#121a1e] text-[#5e9cb9]'
                          : 'text-[#8a99a8] hover:text-white hover:bg-[#121a1e]/50'
                        } px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="text-[#8a99a8] hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border border-transparent hover:border-[#1a2126]"
              >
                Logout
              </button>
              <div className="h-8 w-[1px] bg-[#1a2126]"></div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1a2126] to-[#2d383f] flex items-center justify-center border border-[#2d383f]">
                <span className="text-xs font-bold text-[#5e9cb9]">JD</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}


'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from './ui/button'
import { Info, LayoutDashboard, PenBox } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import ThemeToggle from './ThemeToggle'

export default function HeaderClient() {
  const pathname = usePathname()
  const isActive = (href) => pathname === href || pathname?.startsWith(`${href}/`)

  return (
    <div className="flex items-center space-x-4">
      <ThemeToggle />

      <SignedIn>
        <Link href="/dashboard">
          <Button
            variant="outline"
            className={isActive('/dashboard') ? 'border-blue-400 text-blue-600 bg-blue-50' : ''}
          >
            <LayoutDashboard size={18} />
            <span className="hidden md:inline"> Dashboard</span>
          </Button>
        </Link>

        <Link
          href="/transaction/create"
          className="flex items-center gap-2"
        >
          <Button
            className={`flex items-center gap-2 ${
              isActive('/transaction/create')
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-slate-900 border border-slate-200 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <PenBox size={18} />
            <span className="hidden md:inline"> Add Transaction</span>
          </Button>
        </Link>

        <Link href="/about">
          <Button
            variant="outline"
            className={`flex items-center gap-2 ${isActive('/about') ? 'border-blue-400 text-blue-600 bg-blue-50' : ''}`}
          >
            <Info size={18} />
            <span className="hidden md:inline"> About</span>
          </Button>
        </Link>

        <Link href="/contact">
          <Button
            variant="outline"
            className={`flex items-center gap-2 ${isActive('/contact') ? 'border-blue-400 text-blue-600 bg-blue-50' : ''}`}
          >
            <Info size={18} />
            <span className="hidden md:inline"> Contact</span>
          </Button>
        </Link>
      </SignedIn>

      <SignedOut>
        <SignInButton forceRedirectUrl="/dashboard">
          <Button variant="outline">Login</Button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-10 h-10',
            },
          }}
        />
      </SignedIn>
    </div>
  )
}

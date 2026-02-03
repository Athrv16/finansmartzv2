'use client'
import Link from 'next/link'
import { Button } from './ui/button'
import { LayoutDashboard, PenBox } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import ThemeToggle from './ThemeToggle'

export default function HeaderClient() {
  return (
    <div className="flex items-center space-x-4">
      <ThemeToggle />

      <SignedIn>
        <Link href="/dashboard">
          <Button variant="outline">
            <LayoutDashboard size={18} />
            <span className="hidden md:inline"> Dashboard</span>
          </Button>
        </Link>

        <Link
          href="/transaction/create"
          className="text-gray-600 hover:text-blue-600 flex items-center gap-2"
        >
          <Button className="flex items-center gap-2">
            <PenBox size={18} />
            <span className="hidden md:inline"> Add Transaction</span>
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

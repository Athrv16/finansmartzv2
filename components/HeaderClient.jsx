'use client'
import { Button } from './ui/button'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

export default function HeaderClient() {
  return (
    <div className="flex items-center space-x-4">
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

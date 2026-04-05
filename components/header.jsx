import Image from 'next/image'
import Link from 'next/link'
import { checkUser } from '@/lib/checkUser'
import HeaderClient from './HeaderClient'
import MarketTicker from './MarketTicker'
import ThemeToggle from './ThemeToggle'

const Header = async () => {
  const user=await checkUser()

  return (
    <div className="fixed top-0 z-50 h-[var(--header-height)] w-full border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
      <nav className="container mx-auto flex h-full items-center gap-3 px-4 md:gap-4">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.png"
            alt="finan logo"
            height={90}
            width={300}
            className="h-12 w-auto object-contain"
          />
        </Link>
        <div className="min-w-0 flex-1">
          {user && <MarketTicker />}
        </div>
        <div className="shrink-0">
          <ThemeToggle />
        </div>
        <div className="shrink-0">
          <HeaderClient />
        </div>
      </nav>
    </div>
  )
}

export default Header

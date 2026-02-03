import Image from 'next/image'
import Link from 'next/link'
import { checkUser } from '@/lib/checkUser'
import HeaderClient from './HeaderClient'

const Header = async () => {
  await checkUser()

  return (
    <div className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="finan logo"
            height={90}
            width={300}
            className="h-12 w-auto object-contain"
          />
        </Link>
        <HeaderClient />
      </nav>
    </div>
  )
}

export default Header

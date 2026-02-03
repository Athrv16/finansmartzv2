import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner"
import { ThemeProvider } from "next-themes";



const inter = Inter({subsets: ["latin"]});

export const metadata = {
  title: "FinanSmartz",
  description: "One Stop Finance Platform",
  icons: {
    icon: "/top.ico",
    shortcut: "/top.ico",
    apple: "/top.png",
  },
};

export default function RootLayout({ children }) {
  return (
        <ClerkProvider>
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${inter.className}`}
        >
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>

          {/*header*/}
          <Header/>
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster richColors/>
        {/*footer*/}
        <footer className="bg-gray-50 dark:bg-gray-900 py-8">
          <div className="container mx-auto px-4 text-center text-gray-600 dark:text-white">
            <p>© 2025 FinanSmartz. All rights reserved.</p>
          </div>
        </footer>
            </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}

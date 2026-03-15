import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import FloatingChat from "@/components/FloatingChat";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner"
import { ThemeProvider } from "next-themes";



const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

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
            <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-28 md:pt-32 lg:px-6">
              <div className="page-shell px-4 py-6 md:px-6 md:py-8 lg:px-8">
                {children}
              </div>
            </div>
          </main>
          <FloatingChat />
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

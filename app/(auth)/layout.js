import React from 'react'

export const AuthLayout = ({children}) => {
  return (
    <div className='flex min-h-[70vh] items-center justify-center px-4 py-16'>
      <div className="w-full max-w-md rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] dark:border-slate-800/70 dark:bg-slate-900/80">
        {children}
      </div>
    </div>
  )
}

export default AuthLayout;

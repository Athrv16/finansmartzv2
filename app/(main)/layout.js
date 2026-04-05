import React from 'react'
import SidebarNav from '@/components/SidebarNav'

export const MainLayout = ({children}) => {
  return (
   <div className='-mx-4 -my-6 min-h-[calc(100vh-5rem)] overflow-hidden md:-mx-6 md:-my-8 lg:-mx-8'>
     <div className="main-layout-shell h-[calc(100vh-5rem)] w-full">
       <SidebarNav />
       <main className="h-full min-w-0 overflow-y-auto px-4 pb-10 lg:px-8">
         {children}
       </main>
     </div>
   </div>
  ) 
};
 export default MainLayout;

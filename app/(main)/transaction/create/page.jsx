import { getUserAccounts } from '@/actions/dashboard';
import { defaultCategories } from '@/data/categories';
import React from 'react'
import AddTransactionForm from '../_components/transaction-form';
import { getTransaction } from '@/actions/transaction';
import { Card, CardContent } from '@/components/ui/card';

const AddTransactionPage = async ({searchParams}) => {
    const accounts = await getUserAccounts();

 const { edit: editId } = await searchParams || {};
    

    let initialData = null;
    if (editId) {
      const transaction = await getTransaction(editId);
      initialData = transaction;
    }
   
    


  return (
    <div className='mx-auto max-w-5xl space-y-6 px-5 pb-8 animate-fade-in' style={{ animation: 'fadeIn 0.7s cubic-bezier(0.4,0,0.2,1)' }}>
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-slate-100 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-all duration-500 ease-out hover:shadow-xl">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-200/40 blur-2xl dark:bg-blue-500/10" />
        <div className="absolute -bottom-14 left-10 h-36 w-36 rounded-full bg-indigo-200/30 blur-2xl dark:bg-indigo-500/10" />
        <div className="relative">
          <p className="section-title">Transactions</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">
            <span className="bg-gradient-to-r from-blue-600 to-slate-900 bg-clip-text text-transparent">
              {editId ? "Edit" : "Add"} Transaction
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Capture spending quickly with auto-fill and recurring options.
          </p>
        </div>
      </div>

      <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-slate-900/70 transition-transform duration-300 hover:scale-105 hover:shadow-lg">
        <CardContent className="p-5 md:p-7">
          <AddTransactionForm
            accounts={accounts}
            categories={defaultCategories}
            editMode={!!editId}
            initialData={initialData}
          />
        </CardContent>
      </Card>
    </div>
  )
}


// Add keyframes for fadeIn and slideUp
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
      0% { opacity: 0; transform: translateY(40px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

export default AddTransactionPage;

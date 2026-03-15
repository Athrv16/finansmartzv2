import React, { Suspense } from "react";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Landmark, Plus, Wallet } from "lucide-react";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import BudgetProgress  from "./_components/budget-progress";
import AccountCard from "./_components/account-card";
import { getCurrentBudget } from "@/actions/budget";
import DashboardOverview from "./_components/transaction-overview";
import GmailConnectCard from "@/components/gmail-connect-card";



async function DashboardPage() {
const accounts = await getUserAccounts();

const defaultAccount = accounts?.find((account) => account.isDefault);

 // Get budget for default account
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  
  const transactions = await getDashboardData();
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const monthlyTxCount = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    const now = new Date();
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  }).length;


  return (
    <div
      className="space-y-8 px-2 pt-4 md:px-0 animate-fade-in"
      style={{ animation: 'fadeIn 0.7s cubic-bezier(0.4,0,0.2,1)' }}
    >
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-slate-100 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-all duration-500 ease-out hover:shadow-xl">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-200/40 blur-2xl dark:bg-blue-500/10" />
      <div className="absolute bottom-0 left-10 h-28 w-28 rounded-full bg-indigo-200/30 blur-2xl dark:bg-indigo-500/10" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-title">Dashboard</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
            <span className="bg-gradient-to-r from-blue-600 to-slate-900 bg-clip-text text-transparent">Financial Command Center</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Track balances, recent activity, and monthly trends in one place.</p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto">
          <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-slate-900/70 transition-transform duration-300 hover:scale-105 hover:shadow-lg">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Balance</p>
                <p className="text-lg font-semibold">₹{totalBalance.toFixed(2)}</p>
              </div>
              <Wallet className="h-5 w-5 text-slate-800 dark:text-slate-200" />
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-slate-900/70 transition-transform duration-300 hover:scale-105 hover:shadow-lg">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">Accounts</p>
                <p className="text-lg font-semibold">{accounts.length}</p>
              </div>
              <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-slate-900/70 transition-transform duration-300 hover:scale-105 hover:shadow-lg">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">This Month Tx</p>
                <p className="text-lg font-semibold">{monthlyTxCount}</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
    {/* Budget Progress*/}
    <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />
    <GmailConnectCard />

    {/* Overview */}
      <Suspense fallback={"Loading Overview..."}>
      
        {/* Goals Planner */}
        <Suspense fallback={"Loading Goals..."}>
        {/* Removed placeholder comment */}
        </Suspense>
        <DashboardOverview 
        accounts = {accounts}
        transactions= { transactions || []}
        />

      </Suspense>


    {/* Account Grid */} 
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <CreateAccountDrawer>
        <Card className="group cursor-pointer border-dashed border-blue-300/60 bg-gradient-to-b from-blue-50/60 to-transparent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-blue-500/30 dark:from-blue-950/20 animate-slide-up"
          style={{ animation: 'slideUp 0.7s cubic-bezier(0.4,0,0.2,1)' }}>
          <CardContent className="flex h-full flex-col items-center justify-center py-8 text-muted-foreground">
            <Plus className="mb-2 h-10 w-10 transition-transform duration-300 group-hover:scale-125 group-hover:text-blue-600"/>
            <p className="text-sm font-medium transition-colors duration-300 group-hover:text-blue-600">Add new Account</p>
          </CardContent>
        </Card>
      </CreateAccountDrawer>

      {accounts.length>0 && accounts?.map((account)=>{
        return (
            <div
              key={account.id}
              className="animate-slide-up"
              style={{ animation: 'slideUp 0.7s cubic-bezier(0.4,0,0.2,1)' }}
            >
              <AccountCard account={account}/>
          </div>
        );
      })}
      </div>
      </div>
    )
};


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

export default DashboardPage;

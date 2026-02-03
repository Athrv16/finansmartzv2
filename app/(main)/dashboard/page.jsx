import React, { Suspense } from "react";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import BudgetProgress  from "./_components/budget-progress";
import AccountCard from "./_components/account-card";
import { getCurrentBudget } from "@/actions/budget";
import { logDisallowedDynamicError } from "next/dist/server/app-render/dynamic-rendering";
import DashboardOverview from "./_components/transaction-overview";
import AssistantChat from "@/components/AssistantChat"; // Adjust path if needed
import FloatingChat from "@/components/FloatingChat";


async function DashboardPage() {
const accounts = await getUserAccounts();

const defaultAccount = accounts?.find((account) => account.isDefault);

 // Get budget for default account
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  
  const transactions = await getDashboardData();



  return <div className='space-y-8'>
    {/* Budget Progress*/}
    <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />
    
    {/* Overview */}
      <Suspense fallback={"Loading Overview..."}>
        <DashboardOverview 
        accounts = {accounts}
        transactions= { transactions || []}
        />

      </Suspense>


    {/* Account Grid */} 
    <div className="grid gap-4 mb:grid-cols-2 lg:grid-cols-3">
      <CreateAccountDrawer>
        <Card className="hover: shadow-md transition-shadow cursor-pointer border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
            <Plus className="h-10 w-10 mb-2"/>
            <p className="text-sm font-medium">Add new Account</p>
          </CardContent>
        </Card>
      </CreateAccountDrawer>

      {accounts.length>0 && accounts?.map((account)=>{
        return <AccountCard key={account.id} account={account}/>;
      })}
      </div>   
      {/* <div className="mt-8">
  <AssistantChat />
</div> */}
<FloatingChat />
    </div>;
};

export default DashboardPage;
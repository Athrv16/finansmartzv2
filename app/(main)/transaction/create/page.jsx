import { getUserAccounts } from '@/actions/dashboard';
import { defaultCategories } from '@/data/categories';
import React from 'react'
import AddTransactionForm from '../_components/transaction-form';
import { getTransaction } from '@/actions/transaction';

const AddTransactionPage = async ({searchParams}) => {
    const accounts = await getUserAccounts();

 const { edit: editId } = await searchParams || {};
    

    let initialData = null;
    if (editId) {
      const transaction = await getTransaction(editId);
      initialData = transaction;
    }
   
    


  return (
    <div className='max-w-3xl mx-auto px-5'>
        <h1 style={{
        fontSize: '3.75rem', // same as text-6xl
        fontWeight: 'bold',
        marginBottom: '1.25rem', // same as mb-5
        background: 'linear-gradient(90deg, #2A6DF4 0%, #8A3FFC 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>{editId?"Edit":"Add"} Transaction</h1>

        <AddTransactionForm accounts={accounts} categories={defaultCategories}
        editMode = {!!editId}
        initialData= {initialData}
        />

    </div>
  )
}

export default AddTransactionPage;
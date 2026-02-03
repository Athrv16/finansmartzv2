import React, { Suspense } from "react";
import DashboardPage from "./page";
import { BarLoader } from "react-spinners"

const DashboardLayout = () => {
  return (
    <div className='px-5'>
      <h1 style={{
        fontSize: '3.75rem', // same as text-6xl
        fontWeight: 'bold',
        marginBottom: '1.25rem', // same as mb-5
        background: 'linear-gradient(90deg, #2A6DF4 0%, #8A3FFC 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>Dashboard</h1>

      {/* Dashboard Page */}
      <Suspense fallback={<BarLoader className="mt-4" width={"100%"} color='#9333ea' />}>
        <DashboardPage />
      </Suspense>

    </div>
  );
};

export default DashboardLayout;
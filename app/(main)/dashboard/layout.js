import React, { Suspense } from "react";
import DashboardPage from "./page";
import RouteLoadingScreen from "../_components/route-loading-screen";

const DashboardLayout = () => {
  return (
    <div className='px-5'>
      {/* Dashboard Page */}
      <Suspense fallback={<RouteLoadingScreen />}>
        <DashboardPage />
      </Suspense>

    </div>
  );
};

export default DashboardLayout;
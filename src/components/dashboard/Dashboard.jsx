import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import HomeView from './views/HomeView';
import MerchantsView from './views/MerchantsView';
import DonationsView from './views/DonationsView';
import CampaignsView from './views/CampaignsView';


const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState(0);

  // Update currentView based on URL path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setCurrentView(0);
    else if (path === '/merchants') setCurrentView(1);
    else if (path === '/charities') setCurrentView(2);
    else if (path === '/donations') setCurrentView(2); // Keep charities selected when in donations
  }, [location]);

  const handleViewChange = (index) => {
    setCurrentView(index);
    switch (index) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/merchants');
        break;
      case 2:
        navigate('/charities');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/merchants" element={<MerchantsView />} />
            <Route path="/charities" element={<CampaignsView />} />
            <Route path="/donations" element={<DonationsView />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 
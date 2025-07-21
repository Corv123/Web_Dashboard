import React from 'react';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Home Dashboard';
      case '/merchants':
        return 'Merchants Dashboard';
      case '/charities':
        return 'Charities Dashboard';
      case '/donations':
        return 'Donations Dashboard';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="px-8 py-4">
        <h1 className="text-2xl font-bold text-gray-800">{getTitle()}</h1>
      </div>
    </header>
  );
};

export default Header; 
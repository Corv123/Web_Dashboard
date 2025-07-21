import React from 'react';
import { Home, Users, Heart } from 'lucide-react';

const Sidebar = ({ currentView, onViewChange }) => {
  const navItems = [
    { icon: Home, label: 'Home', index: 0 },
    { icon: Users, label: 'Merchants', index: 1 },
    { icon: Heart, label: 'Charities', index: 2 }
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800">DSGD</h1>
      </div>
      <nav className="mt-8">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onViewChange(item.index)}
            className={`w-full flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${
              currentView === item.index ? 'bg-purple-50 text-purple-600 border-r-4 border-purple-600' : ''
            }`}
          >
            <item.icon size={20} className="mr-3" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar; 
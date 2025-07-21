import React from 'react';

const StatCard = ({ title, value, subtitle, trend, icon: Icon, bgGradient, iconColor }) => (
  <div className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${bgGradient}`} style={{ minHeight: '160px' }}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
    <div className="relative p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          <p className={`text-sm ${trend && trend.startsWith('+') ? 'text-green-200' : trend && trend.startsWith('-') ? 'text-red-200' : 'text-white/70'}`}>
            {trend || subtitle}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${iconColor} bg-white/20 backdrop-blur-sm`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  </div>
);

export default StatCard; 
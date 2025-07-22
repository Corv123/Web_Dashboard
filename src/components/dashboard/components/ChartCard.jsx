const ChartCard = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 ${className}`} style={{ minHeight: '300px' }}>
    <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
      <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
      {title}
    </h3>
    <div style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  </div>
);

export default ChartCard; 
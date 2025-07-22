// Chart Configuration
export const chartConfig = {
  gradients: [
    { id: 'gradient1', colors: ['#6366F1', '#8B5CF6'] },
    { id: 'gradient2', colors: ['#F59E0B', '#EF4444'] },
    { id: 'gradient3', colors: ['#8B5CF6', '#EC4899'] },
    { id: 'gradient4', colors: ['#10B981', '#059669'] },
  ],
  pieColors: ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'],
  chartHeights: {
    small: 250,
    medium: 300,
    large: 350
  }
};

// Time format configurations
export const timeFormats = {
  hour: 'HH:00',
  day: 'ddd',
  week: 'W[W]',
  month: 'MMM',
  year: 'YYYY'
};

// Reusable gradient component
export const ChartGradients = () => (
  <defs>
    {chartConfig.gradients.map(gradient => (
      <linearGradient key={gradient.id} id={gradient.id} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={gradient.colors[0]} />
        <stop offset="100%" stopColor={gradient.colors[1]} />
      </linearGradient>
    ))}
  </defs>
);

// Time Grouping and Controls Selector Component
export const ChartControlsSelector = ({ timeGrouping, setTimeGrouping, topMerchantsLimit, setTopMerchantsLimit }) => (
  <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="text-gray-700 font-medium">Group by:</span>
        <select 
          value={timeGrouping}
          onChange={(e) => setTimeGrouping(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        >
          <option value="hour">Hour</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-gray-700 font-medium">Show top:</span>
        <select 
          value={topMerchantsLimit}
          onChange={(e) => setTopMerchantsLimit(Number(e.target.value))}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        >
          <option value={3}>3 merchants</option>
          <option value={5}>5 merchants</option>
          <option value={10}>10 merchants</option>
          <option value={-1}>All merchants</option>
        </select>
      </div>
    </div>
  </div>
);

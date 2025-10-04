import '../types';
import React, { useMemo } from 'react';
import type { TimeLogEntry } from '../types';

interface TimeAnalyticsChartsProps {
  timeLogs: TimeLogEntry[];
}

// Helper to get the start of the week (Sunday) for a given date
const getStartOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
};

export const TimeAnalyticsCharts: React.FC<TimeAnalyticsChartsProps> = ({ timeLogs }) => {
  
  const weeklyData = useMemo(() => {
    if (timeLogs.length === 0) return [];

    const dataByWeek: Record<string, number> = {};
    
    timeLogs.forEach(log => {
      const logDate = new Date(log.date + 'T00:00:00');
      const weekStartDate = getStartOfWeek(logDate);
      const weekKey = weekStartDate.toISOString().split('T')[0];
      
      dataByWeek[weekKey] = (dataByWeek[weekKey] || 0) + log.hours;
    });
    
    // Get the last 8 weeks
    const sortedWeeks = Object.keys(dataByWeek).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const recentWeeks = sortedWeeks.slice(-8);

    const chartData = recentWeeks.map(weekKey => ({
      week: new Date(weekKey + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      hours: dataByWeek[weekKey]
    }));

    const maxHours = Math.max(...chartData.map(d => d.hours), 1); // Avoid division by zero

    return chartData.map(data => ({
        ...data,
        percentage: (data.hours / maxHours) * 100
    }));

  }, [timeLogs]);

  if (timeLogs.length === 0) {
    return (
        <div className="flex items-center justify-center h-full text-center text-gray-500">
            <div>
                {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                <ion-icon name="bar-chart-outline" className="text-4xl mb-2"></ion-icon>
                <p>Not enough data for charts.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full h-64 flex flex-col justify-end">
        <div className="flex items-end justify-around h-full space-x-2">
            {weeklyData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center justify-end group">
                     <div className="relative">
                        <div
                            className="w-8 bg-blue-600 rounded-t-md transition-all duration-300 ease-in-out group-hover:bg-blue-500"
                            style={{ height: `${data.percentage}%` }}
                        ></div>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            {data.hours.toFixed(1)}h
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 mt-2">{data.week}</span>
                </div>
            ))}
        </div>
        <div className="border-t border-gray-700 mt-2"></div>
    </div>
  );
};
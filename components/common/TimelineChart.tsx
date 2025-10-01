import React from 'react';
// FIX: Add a side-effect import to ensure global JSX types are loaded.
import {} from '../../types';
import type { TimelineMilestone } from '../../types';

interface TimelineChartProps {
  timeline: TimelineMilestone[];
}

const parseDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const diffDays = (date1: Date, date2: Date) => {
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
};

export const TimelineChart: React.FC<TimelineChartProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return <p className="text-gray-500 text-center py-4">No timeline data available.</p>;
  }

  const dates = timeline.flatMap(m => [parseDate(m.startDate), parseDate(m.endDate)]);
  const projectStartDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const projectEndDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const totalProjectDuration = diffDays(projectStartDate, projectEndDate) || 1;

  const monthMarkers: Date[] = [];
  let currentDate = new Date(projectStartDate);
  currentDate.setDate(1);
  while (currentDate <= projectEndDate) {
    monthMarkers.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return (
    <div className="space-y-3 overflow-x-auto">
      {/* Chart Header - Months */}
      <div className="relative h-6" style={{ paddingLeft: '140px' }}>
        <div className="absolute inset-0">
          {monthMarkers.map((month, index) => {
            const left = (diffDays(projectStartDate, month) / totalProjectDuration) * 100;
            if (left < 0 || left > 100) return null;
            return (
              <div key={index} className="absolute h-full" style={{ left: `${left}%` }}>
                <span className="absolute -top-5 ml-1 text-xs text-gray-400 whitespace-nowrap">
                  {month.toLocaleString('default', { month: 'short', year: '2-digit' })}
                </span>
                <div className="h-full border-l border-gray-700"></div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Milestone Rows */}
      <div className="space-y-2">
        {timeline.map((milestone) => {
          const milestoneStart = parseDate(milestone.startDate);
          const milestoneEnd = parseDate(milestone.endDate);
          const offsetDays = diffDays(projectStartDate, milestoneStart);
          const durationDays = diffDays(milestoneStart, milestoneEnd) + 1;

          const left = (offsetDays / totalProjectDuration) * 100;
          const width = (durationDays / totalProjectDuration) * 100;

          const barColor = milestone.completed ? 'bg-green-500/80' : 'bg-blue-500/80';

          return (
            <div key={milestone.id} className="flex items-center h-8 group">
              <div className="w-[140px] pr-4 text-right truncate">
                <span className="text-sm font-medium text-gray-300" title={milestone.name}>{milestone.name}</span>
              </div>
              <div className="flex-1 h-full relative">
                <div
                  className={`absolute h-6 top-1 rounded transition-all duration-300 hover:opacity-100 opacity-90 ${barColor}`}
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                  }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 w-max p-2 bg-gray-900 border border-gray-600 rounded-md shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-opacity z-10 left-1/2 -translate-x-1/2">
                     <p className="font-bold text-white text-sm whitespace-nowrap">{milestone.name}</p>
                     <p className="text-xs text-gray-300 whitespace-nowrap">
                         {milestoneStart.toLocaleDateString()} - {milestoneEnd.toLocaleDateString()}
                     </p>
                     <p className="text-xs text-gray-400">{durationDays} day{durationDays > 1 ? 's' : ''}</p>
                     <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 transform rotate-45 border-b border-r border-gray-600"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

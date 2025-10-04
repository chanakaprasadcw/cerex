// FIX: Add a side-effect import to ensure global JSX types are loaded.
import '../../types';
import React from 'react';
import type { TimelineMilestone } from '../../types';

interface TimelineChartProps {
  timeline: TimelineMilestone[];
}

const parseDate = (dateStr: string) => {
  // Always treat date strings as UTC to avoid timezone shifts
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const diffDays = (date1: Date, date2: Date) => {
  // diff in days for UTC dates
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
};

export const TimelineChart: React.FC<TimelineChartProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return <p className="text-gray-500 text-center py-4">No timeline data available.</p>;
  }

  // --- Chart Configuration ---
  const PIXELS_PER_DAY = 6;
  const ROW_HEIGHT = 56;
  const LABEL_WIDTH = 220;
  const CHART_HEADER_HEIGHT = 50;

  // --- Date Calculations ---
  const dates = timeline.flatMap(m => [parseDate(m.startDate), parseDate(m.endDate)]);
  const projectStartDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const projectEndDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const totalProjectDuration = diffDays(projectStartDate, projectEndDate) + 1;
  const chartWidth = totalProjectDuration * PIXELS_PER_DAY;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const showTodayMarker = today >= projectStartDate && today <= projectEndDate;
  const todayOffset = showTodayMarker ? diffDays(projectStartDate, today) * PIXELS_PER_DAY : 0;

  // --- Generate Month Markers for Header ---
  const monthMarkers: { date: Date; offset: number }[] = [];
  let currentMonth = new Date(projectStartDate);
  currentMonth.setUTCDate(1);
  while (currentMonth <= projectEndDate) {
    monthMarkers.push({
      date: new Date(currentMonth),
      offset: diffDays(projectStartDate, currentMonth) * PIXELS_PER_DAY,
    });
    currentMonth.setUTCMonth(currentMonth.getUTCMonth() + 1);
  }

  const dateDisplayOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };

  return (
    <div className="overflow-x-auto bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
      <div
        className="relative font-sans"
        style={{ minWidth: `${LABEL_WIDTH + chartWidth}px` }}
      >
        {/* === HEADER === */}
        <div
          className="relative border-b-2 border-gray-700"
          style={{ height: `${CHART_HEADER_HEIGHT}px`, marginLeft: `${LABEL_WIDTH}px`, width: `${chartWidth}px` }}
        >
          {monthMarkers.map(({ date, offset }, index) => (
            <div key={index} className="absolute top-0 h-full" style={{ left: `${offset}px` }}>
              <span className="absolute top-2 text-xs font-semibold text-gray-400 whitespace-nowrap">
                {date.toLocaleString('default', { month: 'short', year: '2-digit', timeZone: 'UTC' })}
              </span>
              <div className="h-full border-l border-gray-700/50" style={{ marginTop: '2.25rem' }}></div>
            </div>
          ))}
          {showTodayMarker && (
            <div
              className="absolute top-0 h-full border-r-2 border-red-500 z-10"
              style={{ left: `${todayOffset}px`, height: `${CHART_HEADER_HEIGHT + timeline.length * ROW_HEIGHT}px` }}
              title={`Today: ${today.toLocaleDateString(undefined, { timeZone: 'UTC' })}`}
            >
              <div className="absolute -top-5 -right-2.5 text-xs text-red-400 bg-gray-900 px-1 rounded">Today</div>
            </div>
          )}
        </div>

        {/* === MILESTONE ROWS === */}
        <div className="relative">
          {timeline.map((milestone, index) => {
            const milestoneStart = parseDate(milestone.startDate);
            const milestoneEnd = parseDate(milestone.endDate);
            const offset = diffDays(projectStartDate, milestoneStart) * PIXELS_PER_DAY;
            const duration = (diffDays(milestoneStart, milestoneEnd) + 1) * PIXELS_PER_DAY;

            const barColor = milestone.completed ? 'bg-green-600/80 border-green-500/80' : 'bg-blue-600/80 border-blue-500/80';
            const barHoverColor = milestone.completed ? 'hover:bg-green-500' : 'hover:bg-blue-500';
            
            const showTextInsideBar = duration > 200;

            return (
              <div
                key={milestone.id}
                className="absolute flex items-center border-b border-gray-800"
                style={{ top: `${index * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px`, width: '100%' }}
              >
                {/* Milestone Label */}
                <div
                  className="h-full flex items-center justify-end text-right pr-4 truncate"
                  style={{ width: `${LABEL_WIDTH}px` }}
                  title={milestone.name}
                >
                  <span className="text-sm font-medium text-gray-200">{milestone.name}</span>
                </div>
                
                {/* Milestone Bar */}
                <div
                  className="relative h-full flex items-center group"
                  style={{ left: `${offset}px`, width: `${duration}px` }}
                >
                  <div
                    className={`absolute h-[50%] w-full rounded-md transition-all duration-200 border ${barColor} ${barHoverColor} flex items-center px-3`}
                    style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                  >
                    {showTextInsideBar ? (
                      <span className="text-xs text-white font-bold truncate">
                        {milestone.name}
                      </span>
                    ) : (
                      <div className="flex items-center space-x-2 w-full justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-xs text-white font-semibold truncate">
                            {milestoneStart.toLocaleDateString(undefined, dateDisplayOptions)}
                          </span>
                           <span className="text-xs text-white font-semibold truncate">
                            {milestoneEnd.toLocaleDateString(undefined, dateDisplayOptions)}
                          </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Tooltip */}
                   <div className="absolute bottom-full mb-2 w-max p-2 bg-gray-900 border border-gray-600 rounded-md shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-opacity z-20 left-1/2 -translate-x-1/2">
                     <p className="font-bold text-white text-sm whitespace-nowrap">{milestone.name}</p>
                     <p className="text-xs text-gray-300 whitespace-nowrap">
                         {milestoneStart.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })} to {milestoneEnd.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                     </p>
                     <p className="text-xs text-gray-400">{diffDays(milestoneStart, milestoneEnd) + 1} day(s)</p>
                     <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 transform rotate-45 border-b border-r border-gray-600"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

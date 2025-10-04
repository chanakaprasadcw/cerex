import '../types';
import React, { useMemo } from 'react';
import type { TimeLogEntry, User, Project } from '../types';
import { Page } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { TimeAnalyticsCharts } from './TimeAnalyticsCharts';

interface TimeTrackingDashboardProps {
  timeLogs: TimeLogEntry[];
  currentUser: User;
  projects: Project[];
  onNavigate: (page: Page) => void;
}

export const TimeTrackingDashboard: React.FC<TimeTrackingDashboardProps> = ({ timeLogs, currentUser, projects, onNavigate }) => {
    
    const userTimeLogs = useMemo(() => {
        return timeLogs.filter(log => log.userId === currentUser.uid);
    }, [timeLogs, currentUser.uid]);

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

        const hoursToday = userTimeLogs
            .filter(log => log.date === today)
            .reduce((acc, log) => acc + log.hours, 0);

        const hoursThisWeek = userTimeLogs
            .filter(log => log.date >= startOfWeekStr)
            .reduce((acc, log) => acc + log.hours, 0);
            
        return { hoursToday, hoursThisWeek };
    }, [userTimeLogs]);
    
    const recentLogs = useMemo(() => {
        return userTimeLogs.slice(0, 5);
    }, [userTimeLogs]);
    
    const hoursByProject = useMemo(() => {
        return userTimeLogs.reduce((acc, log) => {
            acc[log.projectName] = (acc[log.projectName] || 0) + log.hours;
            return acc;
        }, {} as Record<string, number>);
    }, [userTimeLogs]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-white">My Dashboard</h1>
                <Button onClick={() => onNavigate(Page.TIME_LOGGING)} variant="primary" iconName="add-outline">
                    Log New Time
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-cyan-800 rounded-md p-3">
                           <ion-icon name="today-outline" className="text-2xl text-cyan-200"></ion-icon>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-400">Hours Logged Today</p>
                            <p className="text-2xl font-bold text-white">{stats.hoursToday.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>
                 <Card>
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-800 rounded-md p-3">
                           <ion-icon name="calendar-outline" className="text-2xl text-blue-200"></ion-icon>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-400">Hours Logged This Week</p>
                            <p className="text-2xl font-bold text-white">{stats.hoursThisWeek.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-xl font-semibold text-white mb-4">Hours by Project</h2>
                    {Object.keys(hoursByProject).length > 0 ? (
                        <div className="space-y-4">
                            {Object.entries(hoursByProject)
                                .sort(([, a], [, b]) => b - a)
                                .map(([projectName, hours]) => (
                                <div key={projectName}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-200">{projectName}</span>
                                        <span className="text-sm font-medium text-gray-400">{hours.toFixed(2)} hrs</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(hours / Math.max(...Object.values(hoursByProject))) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 py-4">No time logged yet.</p>
                    )}
                </Card>
                <Card>
                    <h2 className="text-xl font-semibold text-white mb-4">Weekly Activity</h2>
                    <TimeAnalyticsCharts timeLogs={userTimeLogs} />
                </Card>
            </div>
            
            <Card>
                <h2 className="text-xl font-semibold text-white mb-4">Recent Time Logs</h2>
                 <div className="space-y-3">
                    {recentLogs.length > 0 ? recentLogs.map(entry => (
                         <div key={entry.id} className="grid grid-cols-4 gap-4 p-3 bg-gray-800/50 rounded-lg items-center">
                            <div className="col-span-2">
                                <p className="font-semibold text-white">{entry.projectName}</p>
                                <p className="text-sm text-gray-400 truncate">{entry.note}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-400">{new Date(entry.date + 'T00:00:00').toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-mono text-lg text-white">{entry.hours.toFixed(2)} hrs</span>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-4">No recent activity.</p>
                    )}
                 </div>
            </Card>
        </div>
    );
};
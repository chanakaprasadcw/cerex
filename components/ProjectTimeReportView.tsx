import '../types';
import React, { useState, useMemo } from 'react';
import type { TimeLogEntry, Project, User } from '../types';
import { Card } from './common/Card';
import { DatePicker } from './common/DatePicker';
import { Button } from './common/Button';
import { TimeAnalyticsCharts } from './TimeAnalyticsCharts';

interface ProjectTimeReportViewProps {
  timeLogs: TimeLogEntry[];
  projects: Project[];
  users: User[];
  currentUser: User;
}

export const ProjectTimeReportView: React.FC<ProjectTimeReportViewProps> = ({ timeLogs, projects, users }) => {
    const [filters, setFilters] = useState({
        projectId: '',
        startDate: '',
        endDate: '',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDateChange = (name: 'startDate' | 'endDate', date: string) => {
        setFilters(prev => ({...prev, [name]: date}));
    };
    
    const filteredLogs = useMemo(() => {
        return timeLogs.filter(log => {
            if (filters.projectId && log.projectId !== filters.projectId) return false;
            
            const logDate = new Date(log.date + 'T00:00:00');
            if (filters.startDate && logDate < new Date(filters.startDate + 'T00:00:00')) return false;
            if (filters.endDate && logDate > new Date(filters.endDate + 'T00:00:00')) return false;

            return true;
        });
    }, [timeLogs, filters]);

    const reportData = useMemo(() => {
        const totalHours = filteredLogs.reduce((acc, log) => acc + log.hours, 0);
        
        const hoursByUser = filteredLogs.reduce((acc, log) => {
            acc[log.username] = (acc[log.username] || 0) + log.hours;
            return acc;
        }, {} as Record<string, number>);

        return { totalHours, hoursByUser };
    }, [filteredLogs]);
    
    const handleExport = () => {
        if (filteredLogs.length === 0) return;

        const headers = ['Date', 'Project', 'User', 'Hours', 'Note'];
        const csvRows = [
            headers.join(','),
            ...filteredLogs.map(log => [
                log.date,
                `"${log.projectName.replace(/"/g, '""')}"`,
                log.username,
                log.hours,
                `"${log.note.replace(/"/g, '""')}"`
            ].join(','))
        ];
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const projectName = filters.projectId ? projects.find(p => p.id === filters.projectId)?.name.replace(/\s+/g, '_') : 'All_Projects';
        a.download = `time_report_${projectName}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight text-white">Project Time Reports</h1>

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-6 pb-6 border-b border-gray-700">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
                        <select name="projectId" value={filters.projectId} onChange={handleFilterChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3">
                            <option value="">All Projects</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <DatePicker label="Start Date" value={filters.startDate} onChange={(date) => handleDateChange('startDate', date)} />
                    <DatePicker label="End Date" value={filters.endDate} onChange={(date) => handleDateChange('endDate', date)} min={filters.startDate} />
                    <Button onClick={handleExport} variant="secondary" iconName="download-outline" disabled={filteredLogs.length === 0}>
                        Export CSV
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <h2 className="text-xl font-semibold text-white mb-4">Summary</h2>
                        <div className="space-y-4">
                            <Card className="!p-4">
                                <p className="text-sm text-gray-400">Total Hours Logged</p>
                                <p className="text-3xl font-bold text-blue-400">{reportData.totalHours.toFixed(2)}</p>
                            </Card>
                            <Card className="!p-4">
                                <h3 className="text-lg font-semibold text-white mb-2">Hours by User</h3>
                                <div className="space-y-2">
                                    {Object.entries(reportData.hoursByUser).map(([username, hours]) => (
                                        <div key={username} className="flex justify-between text-sm">
                                            <span className="text-gray-200">{username}</span>
                                            <span className="font-mono text-white">{hours.toFixed(2)} hrs</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                     <div className="lg:col-span-2">
                         <h2 className="text-xl font-semibold text-white mb-4">Weekly Activity</h2>
                         <TimeAnalyticsCharts timeLogs={filteredLogs} />
                     </div>
                </div>
            </Card>

             <Card>
                <h2 className="text-xl font-semibold text-white mb-4">Detailed Log ({filteredLogs.length})</h2>
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">User</th>
                                <th scope="col" className="px-6 py-3">Project</th>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3 text-right">Hours</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {filteredLogs.length > 0 ? filteredLogs.map(entry => (
                            <tr key={entry.id} className="hover:bg-gray-700/50">
                              <td className="px-6 py-4 whitespace-nowrap">{new Date(entry.date + 'T00:00:00').toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-medium text-white">{entry.username}</td>
                              <td className="px-6 py-4">{entry.projectName}</td>
                              <td className="px-6 py-4"><p className="max-w-xs truncate" title={entry.note}>{entry.note}</p></td>
                              <td className="px-6 py-4 text-right font-mono">{entry.hours.toFixed(2)}</td>
                            </tr>
                          )) : (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-gray-500">
                                    No time logs found for the selected criteria.
                                </td>
                            </tr>
                          )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
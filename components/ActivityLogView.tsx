import React, { useState, useMemo } from 'react';
import type { ActivityLogEntry } from '../types';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { DatePicker } from './common/DatePicker';
import { ActivityAction } from '../types';

interface ActivityLogViewProps {
  activityLog: ActivityLogEntry[];
}

const formatActivityDetails = (entry: ActivityLogEntry) => {
    const { action, details } = entry;
    switch (action) {
        case ActivityAction.USER_ROLE_CHANGED:
            return `Changed role for ${details.targetUser} from ${details.from} to ${details.to}`;
        case ActivityAction.PROJECT_CREATED:
            return `Created project: ${details.projectName}`;
        case ActivityAction.PROJECT_UPDATED:
             return `Updated project: ${details.projectName}`;
        case ActivityAction.PROJECT_STATUS_CHANGED:
            return `Updated project "${details.projectName}" status from ${details.from} to ${details.to}`;
        case ActivityAction.PROJECT_DELETED:
            return `Deleted project: ${details.projectName}`;
         case ActivityAction.USER_REGISTERED:
             return `User registered with role: ${details.registeredAs}`;
        case ActivityAction.PROJECT_CHANGES_ACKNOWLEDGED:
            return `Acknowledged changes to project "${details.projectName}" made by ${details.acknowledgedEditor}`;
        case ActivityAction.INVENTORY_ITEM_CREATED:
            return `Added new item "${details.itemName}" (Qty: ${details.quantity}) to inventory.`;
        case ActivityAction.INVENTORY_ITEM_UPDATED:
            return `Updated item "${details.itemName}": added ${details.quantityAdded} units. New total: ${details.newTotalQuantity}.`;
        case ActivityAction.INVENTORY_ITEM_STATUS_CHANGED:
            return `Updated status for item "${details.itemName}" from ${details.from} to ${details.to}.`;
        case ActivityAction.INVOICE_SUBMITTED:
            return `Submitted invoice #${details.invoiceNumber} for $${details.amount.toFixed(2)} from ${details.vendor}.`;
        case ActivityAction.INVOICE_STATUS_CHANGED:
            return `Updated invoice #${details.invoiceNumber} status from ${details.from} to ${details.to}.`;
        case ActivityAction.INVOICE_DELETED:
            return `Deleted invoice #${details.invoiceNumber} from ${details.vendor}.`;
        case ActivityAction.TIME_LOG_CREATED:
            return `Logged ${details.hours} hour(s) for project: ${details.projectName}.`;
        default:
            return action;
    }
};

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ activityLog }) => {
  const [filters, setFilters] = useState({
    user: '',
    action: '',
    startDate: '',
    endDate: '',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleDateChange = (name: 'startDate' | 'endDate', date: string) => {
    setFilters(prev => ({...prev, [name]: date}));
  };

  const filteredLog = useMemo(() => {
    return activityLog.filter(entry => {
      if (filters.user && !entry.username.toLowerCase().includes(filters.user.toLowerCase())) {
        return false;
      }
      if (filters.action && entry.action !== filters.action) {
        return false;
      }
      const entryDate = new Date(entry.timestamp);
      if (filters.startDate && entryDate < new Date(`${filters.startDate}T00:00:00`)) {
        return false;
      }
      if (filters.endDate) {
          const endDate = new Date(`${filters.endDate}T23:59:59`);
          if (entryDate > endDate) {
            return false;
          }
      }
      return true;
    });
  }, [activityLog, filters]);
  
  const uniqueUsernames = [...new Set(activityLog.map(log => log.username))].sort();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-white">System Activity Log</h1>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-700">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">User</label>
                <select name="user" value={filters.user} onChange={handleFilterChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3">
                     <option value="">All Users</option>
                     {uniqueUsernames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Action Type</label>
                <select name="action" value={filters.action} onChange={handleFilterChange} className="w-full bg-gray-900 border border-gray-700 rounded-md p-3">
                    <option value="">All Actions</option>
                    {Object.values(ActivityAction).map(action => <option key={action} value={action}>{action}</option>)}
                </select>
            </div>
            <DatePicker label="Start Date" value={filters.startDate} onChange={(date) => handleDateChange('startDate', date)} />
            <DatePicker label="End Date" value={filters.endDate} onChange={(date) => handleDateChange('endDate', date)} min={filters.startDate} />
        </div>

        <h2 className="text-xl font-semibold text-white mb-4">Log Entries ({filteredLog.length})</h2>
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3">Timestamp</th>
                <th scope="col" className="px-6 py-3">User</th>
                <th scope="col" className="px-6 py-3">Action</th>
                <th scope="col" className="px-6 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredLog.length > 0 ? filteredLog.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium text-white">{entry.username}</td>
                  <td className="px-6 py-4">{entry.action}</td>
                  <td className="px-6 py-4">{formatActivityDetails(entry)}</td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">
                        No activity log entries found matching your criteria.
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
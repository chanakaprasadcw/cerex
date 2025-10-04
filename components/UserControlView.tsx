// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import '../types';
import React, { useState, useMemo, useEffect } from 'react';
import type { User, ActivityLogEntry } from '../types';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { Button } from './common/Button';
import { UserRole, ActivityAction } from '../types';

interface UserControlViewProps {
  users: User[];
  currentUser: User;
  updateUserRole: (userId: string, newRole: UserRole, actor: User) => void;
  activityLog: ActivityLogEntry[];
}

type SortableUserKeys = keyof User;

const formatActivityDetails = (entry: ActivityLogEntry) => {
    const { action, details } = entry;
    switch (action) {
        case ActivityAction.USER_ROLE_CHANGED:
            return `Changed role for ${details.targetUser} from ${details.from} to ${details.to}`;
        case ActivityAction.PROJECT_CREATED:
            return `Created project: ${details.projectName}`;
        case ActivityAction.PROJECT_STATUS_CHANGED:
            return `Updated project "${details.projectName}" status from ${details.from} to ${details.to}`;
        case ActivityAction.USER_REGISTERED:
             return `User registered with role: ${details.registeredAs}`;
        case ActivityAction.PROJECT_CHANGES_ACKNOWLEDGED:
            return `Acknowledged changes to project "${details.projectName}" made by ${details.acknowledgedEditor}`;
        default:
            return action;
    }
};


export const UserControlView: React.FC<UserControlViewProps> = ({ users, currentUser, updateUserRole, activityLog }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortableUserKeys; direction: 'asc' | 'desc' }>({ key: 'username', direction: 'asc' });
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');

  useEffect(() => {
    if (selectedUser) {
        setSelectedRole(selectedUser.role);
    } else {
        setSelectedRole('');
    }
  }, [selectedUser]);


  const handleUpdateRole = () => {
    if (selectedUser && selectedRole && selectedUser.uid !== currentUser.uid) {
        updateUserRole(selectedUser.uid, selectedRole, currentUser);
    }
  };
  
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    filtered.sort((a, b) => {
      // FIX: Add explicit string casting to resolve TypeScript inference error.
      if ((a[sortConfig.key] as string) < (b[sortConfig.key] as string)) return sortConfig.direction === 'asc' ? -1 : 1;
      if ((a[sortConfig.key] as string) > (b[sortConfig.key] as string)) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [users, searchTerm, sortConfig]);

  const requestSort = (key: SortableUserKeys) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const SortableHeader: React.FC<{ sortKey: SortableUserKeys; children: React.ReactNode }> = ({ sortKey, children }) => (
    <button onClick={() => requestSort(sortKey)} className="flex items-center uppercase text-xs text-gray-400 font-medium group focus:outline-none">
      <span className="group-hover:text-white transition-colors">{children}</span>
      {sortConfig.key === sortKey ? (
        // FIX: Changed 'class' to 'className' to fix JSX property error.
        // FIX: Changed 'class' to 'className' to resolve JSX property error.
        <ion-icon name={sortConfig.direction === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'} className="ml-1.5"></ion-icon>
      ) : (
        // FIX: Changed 'class' to 'className' to fix JSX property error.
        // FIX: Changed 'class' to 'className' to resolve JSX property error.
        <ion-icon name="remove-outline" className="ml-1.5 text-transparent group-hover:text-gray-500"></ion-icon>
      )}
    </button>
  );

  const userActivity = useMemo(() => {
    if (!selectedUser) return [];
    return activityLog.filter(log => log.userId === selectedUser.uid);
  }, [selectedUser, activityLog]);
  

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-white">User Control Panel</h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h2 className="text-xl font-semibold text-white mb-4">Registered Users</h2>
            <Input label="" name="search" placeholder="Filter by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </Card>
          <Card>
             <div className="flex justify-between p-2">
                <SortableHeader sortKey="username">Username</SortableHeader>
                <SortableHeader sortKey="role">Role</SortableHeader>
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {filteredAndSortedUsers.map(user => (
                <button
                  key={user.uid}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex justify-between items-center ${selectedUser?.uid === user.uid ? 'bg-blue-600/30 ring-2 ring-blue-500' : 'bg-gray-800 hover:bg-gray-700/50'}`}
                >
                  <div>
                    <p className="font-semibold text-white">{user.username}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                  <span className="text-xs font-medium bg-gray-700 text-gray-300 px-2 py-1 rounded-full">{user.role}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {selectedUser ? (
            <Card>
              <h2 className="text-2xl font-bold text-white mb-2">{selectedUser.username}</h2>
              <p className="text-gray-400 mb-1">{selectedUser.email}</p>
              
              <div className="mt-6 border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-white mb-4">Manage Role</h3>
                <div className="space-y-4">
                    {selectedUser.uid === currentUser.uid ? (
                        <p className="text-sm text-yellow-400 bg-yellow-500/10 p-3 rounded-md border border-yellow-400/20">You cannot change your own role.</p>
                    ) : (
                        <div className="flex items-end space-x-4">
                            <div className="flex-1">
                                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">User Role</label>
                                <select
                                    id="role"
                                    name="role"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-3"
                                >
                                    {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                            <Button onClick={handleUpdateRole} disabled={selectedRole === selectedUser.role}>Update Role</Button>
                        </div>
                    )}
                </div>
              </div>

              <div className="mt-6 border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-white mb-4">Activity History</h3>
                {userActivity.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {userActivity.map(entry => (
                             <div key={entry.id} className="flex items-start space-x-4 p-3 bg-gray-800/50 rounded-lg">
                                <div className="flex-shrink-0 pt-1">
                                    {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                                    {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
                                    <ion-icon name="time-outline" className="text-lg text-gray-500"></ion-icon>
                                </div>
                                <div className="flex-1">
                                <p className="text-sm text-white">{formatActivityDetails(entry)}</p>
                                <p className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                        {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
                        <ion-icon name="file-tray-outline" className="text-4xl mb-2"></ion-icon>
                        <p>No activity recorded for this user.</p>
                    </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-20 text-gray-500">
                {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
                <ion-icon name="people-circle-outline" className="text-6xl mb-4"></ion-icon>
                <h2 className="text-xl font-semibold">Select a User</h2>
                <p>Choose a user from the list to view their activity history and manage their role.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
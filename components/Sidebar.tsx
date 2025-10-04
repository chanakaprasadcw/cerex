import '../types';
import React, { useState, useEffect, useRef } from 'react';
import { Page, UserRole, Flow, type User, type Notification } from '../types';
import { NotificationsPanel } from './common/NotificationsPanel';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  currentFlow: Flow;
  onNavigate: (page: Page) => void;
  currentUser: User;
  onLogout: () => void;
  onSwitchFlow: () => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
}

const NavLink: React.FC<{ 
  onClick: () => void; 
  children: React.ReactNode;
  iconName: string;
  isCollapsed: boolean;
}> = ({ onClick, children, iconName, isCollapsed }) => (
  <button
    onClick={onClick}
    title={isCollapsed ? String(children) : ''}
    className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-200 group"
  >
    <ion-icon name={iconName} className="text-xl text-gray-400 group-hover:text-white transition-colors duration-200"></ion-icon>
    <span className={`ml-4 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{children}</span>
  </button>
);


export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, currentFlow, onNavigate, currentUser, onLogout, onSwitchFlow, notifications, onNotificationClick, onMarkAllAsRead }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter(n => !n.read).length;

    const flowTitle = {
        [Flow.PROJECT]: 'Project Flow',
        [Flow.INVOICE]: 'Invoice Flow',
        [Flow.PEOPLE]: 'People Flow',
    };

    const flowIcon = {
        [Flow.PROJECT]: 'git-network-outline',
        [Flow.INVOICE]: 'receipt-outline',
        [Flow.PEOPLE]: 'people-outline',
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderNavLinks = () => {
        const isManager = currentUser.role === UserRole.CHECKER || currentUser.role === UserRole.AUTHORIZER || currentUser.role === UserRole.SUPER_ADMIN;
        switch (currentFlow) {
            case Flow.PROJECT:
                return (
                    <>
                        <NavLink onClick={() => onNavigate(Page.DASHBOARD)} iconName="grid-outline" isCollapsed={isCollapsed}>Dashboard</NavLink>
                        <NavLink onClick={() => onNavigate(Page.INVENTORY)} iconName="cube-outline" isCollapsed={isCollapsed}>Inventory</NavLink>
                        {isManager && <NavLink onClick={() => onNavigate(Page.USER_CONTROL)} iconName="person-circle-outline" isCollapsed={isCollapsed}>User Control</NavLink>}
                        {isManager && <NavLink onClick={() => onNavigate(Page.ACTIVITY_LOG)} iconName="reader-outline" isCollapsed={isCollapsed}>Activity Log</NavLink>}
                    </>
                );
            case Flow.INVOICE:
                 return (
                    <>
                        <NavLink onClick={() => onNavigate(Page.DASHBOARD)} iconName="grid-outline" isCollapsed={isCollapsed}>Dashboard</NavLink>
                        <NavLink onClick={() => onNavigate(Page.RECORD_INVOICE)} iconName="add-circle-outline" isCollapsed={isCollapsed}>Record New Invoice</NavLink>
                        <NavLink onClick={() => onNavigate(Page.INVOICES)} iconName="file-tray-full-outline" isCollapsed={isCollapsed}>All Invoices</NavLink>
                        <NavLink onClick={() => onNavigate(Page.PROJECT_COST)} iconName="calculator-outline" isCollapsed={isCollapsed}>Project Cost</NavLink>
                    </>
                );
            case Flow.PEOPLE:
                return (
                     <>
                        <NavLink onClick={() => onNavigate(Page.DASHBOARD)} iconName="grid-outline" isCollapsed={isCollapsed}>Dashboard</NavLink>
                        <NavLink onClick={() => onNavigate(Page.TIME_LOGGING)} iconName="timer-outline" isCollapsed={isCollapsed}>Log Time</NavLink>
                        {isManager && <NavLink onClick={() => onNavigate(Page.TIME_REPORTS)} iconName="bar-chart-outline" isCollapsed={isCollapsed}>Project Reports</NavLink>}
                    </>
                )
            default:
                return null;
        }
    };

    return (
        <aside 
            className="fixed top-0 left-0 h-full bg-gray-800 text-gray-200 flex flex-col transition-all duration-300 ease-in-out z-20 border-r border-gray-700/50"
            style={{ width: isCollapsed ? '80px' : '288px' }}
        >
            <div className={`flex items-center justify-between border-b border-gray-700/50 transition-all duration-300 ${isCollapsed ? 'h-[65px] px-0 justify-center' : 'h-[65px] px-6'}`}>
                {!isCollapsed && (
                    <div className="flex items-center space-x-3">
                        <ion-icon name={flowIcon[currentFlow]} className="text-3xl text-blue-400"></ion-icon>
                        <h1 className="text-xl font-bold whitespace-nowrap">{flowTitle[currentFlow]}</h1>
                    </div>
                )}
                 <button onClick={() => setIsCollapsed(!isCollapsed)} className={`p-2 rounded-md hover:bg-gray-700 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}>
                    <ion-icon name={isCollapsed ? 'chevron-forward-outline' : 'chevron-back-outline'} className="text-xl"></ion-icon>
                </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2">
                {renderNavLinks()}
            </nav>

            <div className="mt-auto">
                <div className="p-4 border-t border-gray-700/50" ref={notificationsRef}>
                    {showNotifications && (
                        <NotificationsPanel
                            notifications={notifications}
                            onNotificationClick={onNotificationClick}
                            onMarkAllAsRead={onMarkAllAsRead}
                            onClose={() => setShowNotifications(false)}
                            isSidebarCollapsed={isCollapsed}
                        />
                    )}
                    <div className="space-y-2">
                        <button onClick={() => setShowNotifications(p => !p)} title={isCollapsed ? 'Notifications' : ''} className="relative flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-200 group">
                            <ion-icon name="notifications-outline" className="text-xl text-gray-400 group-hover:text-white transition-colors duration-200"></ion-icon>
                            <span className={`ml-4 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Notifications</span>
                            {unreadCount > 0 && (
                                <span className={`absolute bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${isCollapsed ? 'top-2 right-2' : 'top-1/2 -translate-y-1/2 right-4'}`}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <NavLink onClick={onSwitchFlow} iconName="swap-horizontal-outline" isCollapsed={isCollapsed}>Switch Flow</NavLink>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                             <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-blue-300">
                                    {currentUser.username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className={`ml-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                                <p className="text-sm font-semibold text-white whitespace-nowrap">{currentUser.username}</p>
                                <p className="text-xs text-gray-400 whitespace-nowrap">{currentUser.role}</p>
                            </div>
                            <button
                                onClick={onLogout}
                                title="Logout"
                                className={`ml-auto p-2 rounded-md hover:bg-gray-700 transition-colors ${isCollapsed ? 'hidden' : ''}`}
                            >
                                <ion-icon name="log-out-outline" className="text-xl text-gray-400"></ion-icon>
                            </button>
                        </div>
                         {isCollapsed && (
                             <button onClick={onLogout} title="Logout" className="w-full mt-4 flex items-center justify-center p-3 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-200 group">
                                 <ion-icon name="log-out-outline" className="text-xl text-gray-400 group-hover:text-white transition-colors duration-200"></ion-icon>
                             </button>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};
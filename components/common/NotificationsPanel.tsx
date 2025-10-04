import '../../types';
import React from 'react';
import type { Notification } from '../../types';
import { Button } from './Button';

interface NotificationsPanelProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  isSidebarCollapsed: boolean;
}

// A simple time ago function
const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, onNotificationClick, onMarkAllAsRead, onClose, isSidebarCollapsed }) => {
    const unreadCount = notifications.filter(n => !n.read).length;

    const sidebarWidth = isSidebarCollapsed ? 80 : 288;

    return (
        <div 
            className="absolute bottom-full mb-2 origin-bottom-left rounded-md bg-gray-800/80 backdrop-blur-lg shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-700 animate-scale-up" 
            style={{ width: '24rem', left: `${sidebarWidth + 16}px` }}
            role="menu" 
            aria-orientation="vertical"
        >
            <div className="p-4 border-b border-gray-700">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button onClick={onMarkAllAsRead} variant="secondary" size="sm">
                            Mark all as read
                        </Button>
                    )}
                </div>
            </div>
            <div className="py-1 max-h-96 overflow-y-auto" role="none">
                {notifications.length === 0 ? (
                    <div className="text-center py-10 px-4 text-gray-500">
                        {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
                        <ion-icon name="mail-open-outline" className="text-4xl mb-2"></ion-icon>
                        <p>You're all caught up!</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <button
                            key={notification.id}
                            onClick={() => onNotificationClick(notification)}
                            className="w-full text-left block px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors"
                            role="menuitem"
                        >
                            <div className="flex items-start space-x-3">
                                {!notification.read && <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>}
                                <div className={notification.read ? 'pl-5' : ''}>
                                    <p className="text-white">{notification.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{timeAgo(notification.timestamp)}</p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
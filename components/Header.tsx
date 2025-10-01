
import React from 'react';
// Changed to a value import for `Page` to allow access to enum members.
import { Page, UserRole, type User } from '../types';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  currentUser: User;
  onLogout: () => void;
}

const NavLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-200"
  >
    {children}
  </button>
);

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentUser, onLogout }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
             <div className="flex-shrink-0 flex items-center space-x-2">
                <ion-icon name="git-network-outline" className="text-3xl text-blue-400"></ion-icon>
                <span className="text-xl font-bold text-white">ProjectFlow</span>
            </div>
            <nav className="hidden md:flex items-center space-x-2 ml-10">
              <NavLink onClick={() => onNavigate(Page.DASHBOARD)}>Dashboard</NavLink>
              <NavLink onClick={() => onNavigate(Page.INVENTORY)}>Inventory</NavLink>
              <NavLink onClick={() => onNavigate(Page.INVOICES)}>Invoices</NavLink>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {(currentUser.role === UserRole.LOGGER || currentUser.role === UserRole.CHECKER) && (
               <button
                onClick={() => onNavigate(Page.NEW_PROJECT)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
              >
                <ion-icon name="add-circle-outline" className="text-lg"></ion-icon>
                <span>New Project</span>
              </button>
            )}
            <div className="hidden sm:flex items-center space-x-4">
                <div className="text-right">
                    <p className="text-sm font-medium text-white truncate">{currentUser.username}</p>
                    <p className="text-xs text-gray-400">{currentUser.role}</p>
                </div>
                <button onClick={onLogout} title="Logout" className="flex items-center p-2 text-sm font-medium text-gray-300 bg-gray-700/50 rounded-full hover:bg-gray-600">
                    <ion-icon name="log-out-outline" className="text-xl"></ion-icon>
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

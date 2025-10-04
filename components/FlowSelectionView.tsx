import '../types';
import React from 'react';
import { Flow } from '../types';
import { Button } from './common/Button';

interface FlowSelectionViewProps {
  onSelectFlow: (flow: Flow) => void;
  username: string;
  onLogout: () => void;
}

const FlowCard: React.FC<{
  title: string;
  description: string;
  iconName: string;
  onClick: () => void;
}> = ({ title, description, iconName, onClick }) => (
  <button
    onClick={onClick}
    className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-8 text-left w-full h-full flex flex-col items-start transition-all duration-300 ease-in-out hover:border-blue-500/50 hover:bg-gray-750/50 hover:shadow-2xl transform hover:-translate-y-2 group"
  >
    <div className="bg-gray-900/50 p-4 rounded-full mb-6 border border-gray-700 transition-colors duration-300 group-hover:border-blue-500/30">
      {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
      {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
      <ion-icon name={iconName} className="text-4xl text-blue-400 transition-transform duration-300 group-hover:scale-110"></ion-icon>
    </div>
    <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400 flex-grow">{description}</p>
    <div className="mt-8 text-blue-400 font-semibold flex items-center">
      Select Flow
      {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
      {/* FIX: Changed 'class' to 'className' to resolve JSX property error. */}
      <ion-icon name="arrow-forward-outline" className="ml-2 transition-transform duration-300 group-hover:translate-x-1"></ion-icon>
    </div>
  </button>
);

export const FlowSelectionView: React.FC<FlowSelectionViewProps> = ({ onSelectFlow, username, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4"
        style={{
          backgroundImage: 'url(\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZHRoPSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIxIi8+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZGh0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+\')',
          backgroundRepeat: 'repeat',
        }}
    >
      <div className="absolute top-6 right-6 flex items-center space-x-4">
        <span className="text-white">Welcome, <strong className="font-semibold">{username}</strong></span>
        <Button onClick={onLogout} variant="secondary" size="sm" iconName="log-out-outline">
            Logout
        </Button>
      </div>

      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-5xl font-extrabold text-white tracking-tight">Select a Workflow</h1>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">Choose the system you want to work with. Each flow provides a dedicated set of tools for its specific purpose.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <div className="animate-scale-up" style={{ animationDelay: '100ms' }}>
            <FlowCard
              title="Project Flow"
              description="Manage new projects from creation and approval to execution, with real-time inventory deduction."
              iconName="git-network-outline"
              onClick={() => onSelectFlow(Flow.PROJECT)}
            />
        </div>
        <div className="animate-scale-up" style={{ animationDelay: '200ms' }}>
            <FlowCard
              title="Invoice Flow"
              description="Submit, review, and approve purchase invoices. Track expenses against cost centers and projects."
              iconName="receipt-outline"
              onClick={() => onSelectFlow(Flow.INVOICE)}
            />
        </div>
        <div className="animate-scale-up" style={{ animationDelay: '300ms' }}>
            <FlowCard
              title="People Flow"
              description="Oversee user roles, permissions, and view activity logs across the entire application."
              iconName="people-outline"
              onClick={() => onSelectFlow(Flow.PEOPLE)}
            />
        </div>
      </div>
    </div>
  );
};
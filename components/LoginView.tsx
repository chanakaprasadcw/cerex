

import React from 'react';
import {} from '../types';
import type { User } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';

interface LoginViewProps {
  onLogin: (user: User) => void;
  loggerUser: User;
  checkerUser: User;
  authorizerUser: User;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, loggerUser, checkerUser, authorizerUser }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIxIi8+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzM3NDE1MSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZGh0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+\')',
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="w-full max-w-sm">
        <div className="flex justify-center items-center space-x-3 mb-8">
          <ion-icon name="git-network-outline" className="text-5xl text-blue-400"></ion-icon>
          <h1 className="text-4xl font-bold text-white">ProjectFlow</h1>
        </div>
        <Card>
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center text-white">Select a role to login</h2>
            
            <div className="space-y-4 py-4">
              <Button onClick={() => onLogin(loggerUser)} variant="secondary" className="w-full justify-center" size="lg" iconName="create-outline">
                Login as Logger
              </Button>
               <Button onClick={() => onLogin(checkerUser)} variant="secondary" className="w-full justify-center" size="lg" iconName="eye-outline">
                Login as Checker
              </Button>
              <Button onClick={() => onLogin(authorizerUser)} variant="primary" className="w-full justify-center" size="lg" iconName="shield-checkmark-outline">
                Login as Authorizer
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center pt-2">
              This is a simplified login for demonstration purposes. Choose a role to explore the application's features.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

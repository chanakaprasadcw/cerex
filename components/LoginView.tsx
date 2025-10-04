// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import '../types';
import React, { useState } from 'react';
import { UserRole } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { ForgotPasswordModal } from './common/ForgotPasswordModal';
import { Spinner } from './common/Spinner';

interface LoginViewProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, username: string, role: UserRole) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSignIn, onSignUp, onResetPassword }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.LOGGER);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        if (!username) {
            throw new Error("Display Name is required.");
        }
        await onSignUp(email, password, username, role);
      } else {
        await onSignIn(email, password);
      }
      // Successful login/signup is handled by onAuthStateChanged in App.tsx
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setEmail('');
    setPassword('');
    setUsername('');
    setRole(UserRole.LOGGER);
  }

  return (
    <>
      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} onReset={onResetPassword} />}
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4"
        style={{
          backgroundImage: 'radial-gradient(circle at top left, rgba(59, 130, 246, 0.15), transparent 30%), radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.1), transparent 40%)',
        }}
      >
        <div className="w-full max-w-sm">
          <div className="flex justify-center items-center space-x-3 mb-8">
            {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
            <ion-icon name="git-network-outline" className="text-5xl text-blue-400"></ion-icon>
            <h1 className="text-4xl font-bold text-white">ProjectFlow</h1>
          </div>
          <Card>
            <div className="p-2">
              <div className="flex border-b border-gray-700">
                <button onClick={() => setIsSignUp(false)} className={`flex-1 py-3 text-sm font-medium transition-colors ${!isSignUp ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}>Sign In</button>
                <button onClick={() => setIsSignUp(true)} className={`flex-1 py-3 text-sm font-medium transition-colors ${isSignUp ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}`}>Create Account</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                 <h2 className="text-xl font-semibold text-center text-white">{isSignUp ? 'Create a New Account' : 'Welcome Back'}</h2>
                
                {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-md border border-red-400/20">{error}</p>}
                
                {isSignUp && (
                    <>
                        <Input label="Display Name" name="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">Account Role</label>
                            <select
                                id="role"
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-white p-3"
                                required
                            >
                                <option value={UserRole.LOGGER}>Logger</option>
                                <option value={UserRole.CHECKER}>Checker</option>
                                <option value={UserRole.AUTHORIZER}>Authorizer</option>
                            </select>
                        </div>
                    </>
                )}
                <Input label="Email Address" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <Input label="Password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                
                <div className="pt-2">
                    <Button type="submit" variant="primary" className="w-full justify-center" size="lg" disabled={isLoading}>
                      {isLoading ? <Spinner /> : (isSignUp ? 'Create Account' : 'Sign In')}
                    </Button>
                </div>

                 {!isSignUp && (
                    <div className="text-center">
                        <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-blue-400 hover:underline">Forgot Password?</button>
                    </div>
                 )}
              </form>
            </div>
          </Card>
           <p className="text-sm text-gray-500 text-center mt-6">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button onClick={toggleForm} className="font-medium text-blue-400 hover:underline ml-2">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
          </p>
        </div>
      </div>
    </>
  );
};
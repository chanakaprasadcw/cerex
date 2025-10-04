// FIX: Import types for side effects to augment JSX before React is imported. This ensures custom element types like 'ion-icon' are globally available.
import '../../types';
import React, { useState } from 'react';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { Spinner } from './Spinner';

interface ForgotPasswordModalProps {
  onClose: () => void;
  onReset: (email: string) => Promise<void>;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose, onReset }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await onReset(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity">
      <Card className="w-full max-w-md">
        <div className="text-right -mt-2 -mr-2">
             <Button onClick={onClose} variant="secondary" size="sm" iconName="close-outline" />
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-6 text-center">
            {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
            <ion-icon name="mail-open-outline" className="text-5xl text-blue-400 mx-auto"></ion-icon>
            <h2 className="text-xl font-bold text-white">Forgot Password?</h2>
            <p className="text-gray-400">
              No problem. Enter the email address associated with your account, and we'll send a password reset link.
            </p>
            {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-md border border-red-400/20">{error}</p>}
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Button type="submit" variant="primary" className="w-full justify-center" disabled={isLoading}>
              {isLoading ? <Spinner /> : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <div className="p-4 pt-0 space-y-6 text-center">
             {/* FIX: Changed 'class' to 'className' to fix JSX property error. */}
             <ion-icon name="checkmark-circle-outline" className="text-5xl text-green-400 mx-auto"></ion-icon>
            <h2 className="text-xl font-bold text-white">Request Sent</h2>
            <p className="text-gray-300">
              If an account exists for <strong className="text-white">{email}</strong>, you will receive an email with instructions on how to reset your password.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
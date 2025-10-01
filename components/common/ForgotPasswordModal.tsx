import React, { useState } from 'react';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
// FIX: Changed to a value import to ensure global type declarations from types.ts are loaded.
import {} from '../../types';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd call an API here.
    // For this simulation, we just show the confirmation.
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity">
      <Card className="w-full max-w-md">
        <div className="text-right -mt-2 -mr-2">
             <Button onClick={onClose} variant="secondary" size="sm" iconName="close-outline" />
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-6 text-center">
            <ion-icon name="mail-open-outline" className="text-5xl text-blue-400 mx-auto"></ion-icon>
            <h2 className="text-xl font-bold text-white">Forgot Password?</h2>
            <p className="text-gray-400">
              No problem. Enter the email address associated with your account, and we'll simulate sending a reset link.
            </p>
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Button type="submit" variant="primary" className="w-full">
              Send Reset Link
            </Button>
          </form>
        ) : (
          <div className="p-4 pt-0 space-y-6 text-center">
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

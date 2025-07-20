import React, { useState, useEffect } from 'react';
import { authManager, User } from '../utils/auth';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingUsers, setExistingUsers] = useState<User[]>([]);

  useEffect(() => {
    // Load existing users for quick login
    setExistingUsers(authManager.getAllUsers());
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!name.trim() || !password.trim()) {
        setError('Name and password are required');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      // Check if user already exists
      const existingUser = existingUsers.find(u => u.name.toLowerCase() === name.toLowerCase());
      if (existingUser) {
        setError('A user with this name already exists');
        return;
      }

      const user = await authManager.createUser(name, password, email);
      onLogin(user);
    } catch (error) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await authManager.login(name, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid name or password');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (user: User) => {
    setError('');
    setIsLoading(true);
    setName(user.name);
    
    // For quick login, we'll need the password
    const password = prompt(`Enter password for ${user.name}:`);
    if (password) {
      const loggedInUser = await authManager.login(user.name, password);
      if (loggedInUser) {
        onLogin(loggedInUser);
      } else {
        setError('Invalid password');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">NudgeMe</h1>
          <p className="text-gray-600">ADHD Productivity Companion</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {existingUsers.length > 0 && !isCreating && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Quick Login</h3>
            <div className="space-y-2">
              {existingUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => quickLogin(user)}
                  disabled={isLoading}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-gray-800">{user.name}</div>
                  <div className="text-sm text-gray-500">
                    Last login: {new Date(user.lastLogin).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
            <div className="text-center mt-4">
              <button
                onClick={() => setIsCreating(true)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Create new account
              </button>
            </div>
          </div>
        )}

        {(!existingUsers.length || isCreating) && (
          <form onSubmit={isCreating ? handleCreateAccount : handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                />
              </div>

              {isCreating && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isCreating ? "Create a password" : "Enter your password"}
                  required
                />
                {isCreating && (
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isCreating ? 'Creating Account...' : 'Logging In...'}
                  </span>
                ) : (
                  isCreating ? 'Create Account' : 'Login'
                )}
              </button>
            </div>

            <div className="text-center mt-6">
              {isCreating ? (
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Already have an account? Login
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Need an account? Create one
                </button>
              )}
            </div>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Your data is stored locally and encrypted. Each user has separate data storage.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen; 
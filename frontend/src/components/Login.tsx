import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface LoginProps {
  darkMode?: boolean;
  onSwitchToRegister?: () => void;
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ darkMode = false, onSwitchToRegister, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showError } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      setEmail('');
      setPassword('');
      onLoginSuccess?.();
    } catch (error) {
      // Display error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in. Please check your credentials.';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl p-8 max-w-md w-full mx-auto`}>
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Welcome Back
        </h2>
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`w-full px-4 py-3 rounded-xl border transition-smooth focus:ring-2 ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-indigo-300 focus:border-indigo-300'
            }`}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-xl border transition-smooth focus:ring-2 ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-indigo-300 focus:border-indigo-300'
            }`}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded-xl font-semibold transition-smooth hover-lift ${
            isSubmitting
              ? 'opacity-50 cursor-not-allowed'
              : darkMode
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className={`animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent`}></div>
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {onSwitchToRegister && (
        <div className={`mt-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className={`font-semibold hover:underline ${
                darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
              }`}
            >
              Sign up
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default Login;


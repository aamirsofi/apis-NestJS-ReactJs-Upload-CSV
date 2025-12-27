import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface RegisterProps {
  darkMode?: boolean;
  onSwitchToLogin?: () => void;
  onRegisterSuccess?: () => void;
}

const Register: React.FC<RegisterProps> = ({ darkMode = false, onSwitchToLogin, onRegisterSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const { showError } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      showError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(email, password, firstName || undefined, lastName || undefined);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      onRegisterSuccess?.();
    } catch (error) {
      // Error already handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`card-modern${darkMode ? '-dark' : ''} rounded-2xl p-8 max-w-md w-full mx-auto`}>
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Create Account
        </h2>
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Sign up to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className={`w-full px-4 py-3 rounded-xl border transition-smooth focus:ring-2 ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-indigo-300 focus:border-indigo-300'
              }`}
              autoComplete="given-name"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className={`w-full px-4 py-3 rounded-xl border transition-smooth focus:ring-2 ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-indigo-300 focus:border-indigo-300'
              }`}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Email Address *
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
            Password *
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
            autoComplete="new-password"
            minLength={6}
          />
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Must be at least 6 characters
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Confirm Password *
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-xl border transition-smooth focus:ring-2 ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-indigo-300 focus:border-indigo-300'
            }`}
            required
            autoComplete="new-password"
            minLength={6}
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
              Creating account...
            </span>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      {onSwitchToLogin && (
        <div className={`mt-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className={`font-semibold hover:underline ${
                darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
              }`}
            >
              Sign in
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default Register;


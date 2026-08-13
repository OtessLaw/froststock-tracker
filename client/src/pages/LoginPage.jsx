import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Snowflake, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(135deg, #dbeafe 0%, #fce7f3 50%, #ede9fe 100%)',
      }}
    >
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
          >
            <Snowflake className="w-10 h-10 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            FrostStock Tracker
          </h1>
          <p className="text-sm font-medium text-blue-500 mt-1 tracking-wide uppercase">
            Cold Store Management
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8">
          <h2 className="text-xl font-bold text-slate-700 mb-6">Sign in to your account</h2>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Demo Login Shortcuts */}
          <div className="mb-6 p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl">
            <p className="text-xs font-semibold text-blue-800 mb-2">⚡ Click to auto-fill demo accounts:</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@froststock.com');
                  setPassword('Admin1234!');
                  if (error) setError('');
                }}
                className="flex-1 text-xs py-2 px-3 bg-white hover:bg-blue-100/50 text-blue-700 font-medium rounded-xl border border-blue-200 transition-colors shadow-sm text-center"
              >
                🔑 Admin Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('staff@froststock.com');
                  setPassword('Staff1234!');
                  if (error) setError('');
                }}
                className="flex-1 text-xs py-2 px-3 bg-white hover:bg-blue-100/50 text-blue-700 font-medium rounded-xl border border-blue-200 transition-colors shadow-sm text-center"
              >
                🔑 Staff Demo
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="mb-5">
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="you@example.com"
                className="input-field text-lg py-4"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="mb-7">
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  className="input-field text-lg py-4 pr-12"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-base rounded-2xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in…
                </>
              ) : (
                'LOGIN'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Contact your administrator if you need access.
        </p>
      </div>
    </div>
  );
}

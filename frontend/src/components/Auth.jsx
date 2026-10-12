import React, { useState } from 'react';
import api from '../services/api';
import { Lock, Mail, User, LogIn, UserPlus, AlertCircle, Sparkles } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const res = await api.post(endpoint, payload);
      
      // Save JWT token locally
      if (res.data.token) {
        localStorage.setItem('hustle_token', res.data.token);
      }

      // Notify parent component of successful login/registration
      if (onLoginSuccess) {
        onLoginSuccess(res.data.player);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hustle-dark flex items-center justify-center p-4">
      <div className="bg-hustle-card border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-hustle-green/20 rounded-full blur-2xl pointer-events-none" />

        {/* Game Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-hustle-green/10 border border-hustle-green/30 px-3 py-1 rounded-full text-hustle-green text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Southwestern RPG Simulation
          </div>
          <h1 className="text-3xl font-black text-white tracking-wide">
            SOUTHWEST HUSTLE
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isLogin ? 'Sign in to access your trade empire' : 'Register to begin trading across Lagos, Ibadan & Kwara'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-950/40 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs uppercase font-bold text-gray-400 mb-1.5">
                Trader Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="e.g. Babajide_Trader"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-hustle-green"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase font-bold text-gray-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
              <input
                type="email"
                name="email"
                required
                placeholder="trader@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-hustle-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold text-gray-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-hustle-green"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-hustle-green hover:bg-green-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-hustle-green/10"
          >
            {loading ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Register Account
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="mt-6 text-center pt-6 border-t border-gray-800">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-xs text-gray-400 hover:text-hustle-gold transition"
          >
            {isLogin ? (
              <>Don't have an account? <span className="text-hustle-green font-bold">Register here</span></>
            ) : (
              <>Already have a trader account? <span className="text-hustle-green font-bold">Sign in</span></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
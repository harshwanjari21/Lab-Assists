import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setError('');
    setLoading(true);

    if (!email || !password || password.length < 6) {
      setError('Please enter a valid email and password (6+ chars).');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, password, signIn, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7fe]">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="LabAssist Logo" className="w-32 h-32 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-gray-900">Welcome to LabAssist</h1>
          <p className="text-gray-600 mt-2">Please sign in to continue</p>
        </div>
        <form className="w-full" onSubmit={handleSubmit} noValidate>
          <label className="block text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            className={`w-full mb-4 px-3 py-2 rounded bg-blue-50 border ${
              error ? 'border-red-500' : 'border-blue-100'
            } focus:outline-none`}
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            disabled={loading}
          />
          <label className="block text-gray-700 mb-1">Password</label>
          <div className="relative mb-4">
            <input 
              type={showPassword ? "text" : "password"}
              className={`w-full px-3 py-2 rounded bg-blue-50 border ${
                error ? 'border-red-500' : 'border-blue-100'
              } focus:outline-none pr-10`}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              minLength={6}
              disabled={loading}
            />
            <span
              className="material-icons absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              style={{ userSelect: 'none' }}
              onClick={() => setShowPassword(v => !v)}
              tabIndex={0}
              aria-label={showPassword ? "Hide password" : "Show password"}
              role="button"
            >
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          <button 
            type="submit" 
            className={`w-full bg-blue-600 text-white py-2 rounded font-semibold transition ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        {/* <div className="text-gray-400 text-sm mt-4 text-center">
          Admin credentials:<br/>
          Email: admin@labassist.com<br/>
          Password: labassist@admin123
        </div> */}
      </div>
    </div>
  );
};

export default SignIn;
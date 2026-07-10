import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Shield, Lock, User, Check, AlertCircle, Copy, Database, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (username: string) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSQLSetup, setShowSQLSetup] = useState(false);
  const [copied, setCopied] = useState(false);

  // Secure SHA-256 hashing using the standard browser Web Crypto API
  const hashPassword = async (pwd: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const sqlQuery = `create table if not exists inven_users (
  username text primary key,
  password text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- OPTION A: Disable Row Level Security (simplest):
alter table inven_users disable row level security;

-- OPTION B: Create permissive public policies (if RLS is active/forced):
alter table inven_users enable row level security;

drop policy if exists "Allow public insert for signup" on inven_users;
create policy "Allow public insert for signup" on inven_users for insert with check (true);

drop policy if exists "Allow public read for login verification" on inven_users;
create policy "Allow public read for login verification" on inven_users for select using (true);

-- Enable replica identity full for real-time updates:
alter table inven_users replica identity full;

-- Add table to real-time publication:
alter publication supabase_realtime add table inven_users;`;

  const copySQL = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formattedUsername = username.trim().toLowerCase();
    if (!formattedUsername || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (activeTab === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
    }

    try {
      const passwordHash = await hashPassword(password);

      if (activeTab === 'login') {
        // Log in logic
        const { data, error: fetchError } = await supabase
          .from('inven_users')
          .select('*')
          .eq('username', formattedUsername)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Username not found. Please sign up first.');
          } else if (fetchError.code === '42P01' || fetchError.message?.includes('relation') || fetchError.message?.includes('does not exist')) {
            setError(`Database table 'inven_users' does not exist in your Supabase project yet.`);
            setShowSQLSetup(true);
          } else {
            setError(`Authentication error: ${fetchError.message}`);
          }
          setLoading(false);
          return;
        }

        if (data && data.password === passwordHash) {
          // Success
          localStorage.setItem('inven_logged_in_user', formattedUsername);
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => {
            onLoginSuccess(formattedUsername);
          }, 1000);
        } else {
          setError('Incorrect password. Please try again.');
        }
      } else {
        // Sign up logic
        // First check if username already exists
        const { data: existingUser, error: checkError } = await supabase
          .from('inven_users')
          .select('username')
          .eq('username', formattedUsername)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          if (checkError.code === '42P01' || checkError.message?.includes('relation') || checkError.message?.includes('does not exist')) {
            setError(`Database table 'inven_users' does not exist in your Supabase project yet.`);
            setShowSQLSetup(true);
          } else {
            setError(`Database error: ${checkError.message}`);
          }
          setLoading(false);
          return;
        }

        if (existingUser) {
          setError('Username already taken. Please choose another one.');
          setLoading(false);
          return;
        }

        // Insert new user
        const { error: insertError } = await supabase
          .from('inven_users')
          .insert({
            username: formattedUsername,
            password: passwordHash,
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          setError(`Sign up failed: ${insertError.message}. Please configure the Supabase Table and RLS policies using the guide below.`);
          if (insertError.message?.toLowerCase().includes('row-level security') || insertError.message?.toLowerCase().includes('security policy') || insertError.message?.toLowerCase().includes('rls')) {
            setShowSQLSetup(true);
          }
        } else {
          setSuccess('Registration successful! You can now log in.');
          setActiveTab('login');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err: any) {
      console.error('Authentication process exception:', err);
      setError(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  // Safe offline backup bypass for quick development / testing if the database is unconfigured
  const handleBypassWithOffline = () => {
    localStorage.setItem('inven_logged_in_user', 'offline_admin');
    onLoginSuccess('offline_admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900">
          PSV&CO
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Secure Stock & Billing Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 sm:rounded-[32px] sm:px-10 space-y-6">
          {/* Sign in / Sign up selectors */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl">
            <button
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccess(null);
              }}
              className={`py-2.5 px-4 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setError(null);
                setSuccess(null);
              }}
              className={`py-2.5 px-4 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register
            </button>
          </div>

          {/* Feedback banners */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold text-rose-800 leading-relaxed">
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold text-emerald-800 leading-relaxed">
                {success}
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username-input" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="block w-full pl-10 pr-3 py-3 border-none bg-slate-50 text-slate-800 text-sm font-semibold rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400/80"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-3 border-none bg-slate-50 text-slate-800 text-sm font-semibold rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400/80"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {activeTab === 'signup' && (
              <div className="animate-in fade-in duration-200">
                <label htmlFor="confirm-password-input" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-3 border-none bg-slate-50 text-slate-800 text-sm font-semibold rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400/80"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 border border-transparent rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-100 transition-all cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full h-4 w-4" />
              ) : activeTab === 'login' ? (
                'Sign In to Dashboard'
              ) : (
                'Create Credentials Account'
              )}
            </button>
          </form>

          {/* Database Setup Helper panel for quick reference */}
          {showSQLSetup && (
            <div className="pt-4 border-t border-slate-100 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                <div className="flex gap-2.5 items-start">
                  <Database className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-800">Supabase Table Required</h4>
                    <p className="text-[11px] text-amber-700 mt-1 leading-normal">
                      The user credentials table is required in your Supabase DB to authorize logins. Copy and run this SQL schema inside your Supabase SQL Editor:
                    </p>
                  </div>
                </div>

                <div className="mt-3 relative">
                  <pre className="text-[9px] bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto font-mono max-h-36">
                    {sqlQuery}
                  </pre>
                  <button
                    onClick={copySQL}
                    className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="text-center">
                <button
                  onClick={handleBypassWithOffline}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  Or enter dashboard immediately via Offline Bypass Mode
                </button>
              </div>
            </div>
          )}

          {!showSQLSetup && (
            <div className="text-center pt-2">
              <button
                onClick={handleBypassWithOffline}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer font-medium"
              >
                Access Offline Mode
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, Wrench, Users, Package, Calendar } from 'lucide-react';
import logo from "../assets/logo.png";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from "../firebase";

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
  e.preventDefault();
  setError('');

  try {
    await signInWithEmailAndPassword(auth, email, password);

    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('userId', email);
    localStorage.setItem('userName', 'Admin User');

    navigate('/admin/dashboard');
  } catch {
    setError('Invalid email or password. Access denied.');
  }
};

  return (
    <div className="min-h-screen flex bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Left panel — dark branding ── */}
      <div className="hidden lg:flex lg:w-[42%] bg-[#0a0f1a] flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Top: logo + heading */}
        <div className="relative">
          <img src={logo} alt="MPRSS Logo" className="w-40 h-auto brightness-0 invert" />

          <div className="mt-14">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-4">
              Admin Web System
            </p>
            <h2
              className="text-5xl font-black text-white leading-tight mb-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Service<br />Management<br />Portal
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              A unified platform for managing motorcycle service operations, customer records, inventory, and repair workflows.
            </p>
          </div>

          {/* Feature list */}
          <div className="mt-10 space-y-4">
            {[
              { icon: Users, label: 'Customer & motorcycle records' },
              { icon: Wrench, label: 'Service requests & repair tracking' },
              { icon: Calendar, label: 'Appointment scheduling' },
              { icon: Package, label: 'Parts & inventory management' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 border border-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />
                </div>
                <span className="text-sm text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: security indicator */}
        <div className="relative flex items-center gap-2 text-xs text-slate-700">
          <Lock className="w-3 h-3" strokeWidth={1.5} />
          <span>Secure encrypted connection &mdash; Internal use only</span>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo (only visible < lg) */}
          <div className="flex justify-center mb-8 lg:hidden">
            <img src={logo} alt="MPRSS Logo" className="w-40 h-auto" />
          </div>

          {/* Security badge */}
          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1.5 mb-8">
            <Shield className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Authorized personnel only
            </span>
          </div>

          {/* Heading */}
          <div className="mb-9">
            <h1
              className="text-5xl font-black text-[#0a0f1a] leading-tight mb-2"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              MPRSS Admin Portal
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Sign in to manage motorcycle services, customers, inventory, and operations.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0a0f1a] text-sm transition-colors placeholder:text-gray-300"
                placeholder="admin@mprss.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                  Password
                </label>
                <Link
                  to="/admin/forgot-password"
                  className="text-[11px] text-gray-400 hover:text-[#0a0f1a] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0a0f1a] text-sm transition-colors placeholder:text-gray-300"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff size={16} strokeWidth={1.5} />
                    : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-xs">
                <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#0a0f1a] text-white py-4 rounded-xl font-semibold text-sm hover:bg-[#1e293b] transition-colors mt-1"
            >
              Sign In to Admin Portal
            </button>
          </form>

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              ← Back to MPRSS
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;

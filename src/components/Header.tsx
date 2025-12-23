import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-lg overflow-hidden">
      {/* Subtiler Hintergrund-Verlauf */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5"></div>

      <div className="container mx-auto px-4 py-6 relative">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4 group">
            {/* Logo - rund und fließend */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-700"></div>
              <img
                src="/logocashplan.png"
                alt="Cashplan Logo"
                className="w-14 h-14 md:w-20 md:h-20 relative z-10 rounded-full object-cover shadow-2xl"
              />
            </div>

            <div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                Cashplan
              </h1>
              <p className="text-xs md:text-sm text-slate-300/70 italic font-light tracking-wide">
                get your cash together
              </p>
            </div>
          </div>

          {/* User info and logout */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-slate-200 font-medium">{user.email}</p>
              </div>
              <button
                onClick={signOut}
                className="relative group bg-gradient-to-r from-red-500/10 to-pink-500/10 hover:from-red-500/20 hover:to-pink-500/20 text-red-300 hover:text-red-200 px-5 py-2.5 rounded-xl transition-all duration-300 border border-red-500/20 hover:border-red-400/40"
              >
                <span className="relative z-10 font-medium">Abmelden</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

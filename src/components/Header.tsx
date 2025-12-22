import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="relative bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-cyan-500/20 shadow-2xl overflow-hidden">
      {/* Cyber decoration - Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 opacity-80 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(236,72,153,0.1)_50%,transparent_100%)]"></div>
      </div>

      <div className="container mx-auto px-4 py-4 relative">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4 group">
            {/* Logo mit Glow-Effekt */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"></div>
              <div className="relative p-2 bg-gradient-to-br from-slate-800/50 to-blue-900/50 rounded-full backdrop-blur-sm border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                <img
                  src="/logocashplan.png"
                  alt="Cashplan Logo"
                  className="w-12 h-12 md:w-16 md:h-16 relative z-10 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                />
              </div>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                Cashplan
              </h1>
              <p className="text-xs md:text-sm text-cyan-200/80 italic font-light tracking-wide">
                get your cash together
              </p>
            </div>
          </div>

          {/* Cyber decoration - Circuit pattern */}
          <div className="hidden md:flex items-center space-x-3 opacity-40">
            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse"></div>
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent"></div>
            <div className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
          </div>

          {/* User info and logout */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-cyan-100 font-medium drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">{user.email}</p>
              </div>
              <button
                onClick={signOut}
                className="relative group bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/40 hover:to-pink-500/40 text-red-200 px-4 py-2 rounded-lg transition-all duration-300 border border-red-500/30 hover:border-red-400/50 shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              >
                <span className="relative z-10">Abmelden</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300"></div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
    </header>
  );
};

export default Header;

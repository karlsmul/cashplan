import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 border-b border-white/20 shadow-2xl">
      {/* Money decoration */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 opacity-60"></div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <img src="/logo.svg" alt="Cashplan Logo" className="w-12 h-12 md:w-16 md:h-16" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
                Cashplan
              </h1>
              <p className="text-xs md:text-sm text-purple-200 italic">
                get your cash together
              </p>
            </div>
          </div>

          {/* Money symbols decoration */}
          <div className="hidden md:flex items-center space-x-4 text-3xl opacity-30">
            <span className="money-symbol">💰</span>
            <span className="money-symbol">💵</span>
            <span className="money-symbol">💶</span>
            <span className="money-symbol">🪙</span>
          </div>

          {/* User info and logout */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-white font-medium">{user.email}</p>
              </div>
              <button
                onClick={signOut}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg transition-all border border-red-500/30"
              >
                Abmelden
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

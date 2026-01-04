import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/analytics', label: 'Auswertung', icon: '📈' },
    { path: '/settings', label: 'Einstellungen', icon: '⚙️' }
  ];

  return (
    <nav className="bg-white/5 backdrop-blur-lg border-b border-white/10 mb-8">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 md:space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                px-4 md:px-6 py-4 font-semibold transition-all relative
                ${
                  location.pathname === item.path
                    ? 'text-purple-300 bg-white/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <span className="hidden md:inline">{item.label}</span>
              <span className="md:hidden text-2xl">{item.icon}</span>
              {location.pathname === item.path && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600"></div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

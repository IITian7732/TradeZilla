// src/components/layout/BottomNav.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart2, Briefcase, Star, MoreHorizontal } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: <Home size={22} />, path: '/dashboard' },
  { id: 'charts', label: 'Charts', icon: <BarChart2 size={22} />, path: '/charts' },
  { id: 'portfolio', label: 'Portfolio', icon: <Briefcase size={22} />, path: '/portfolio' },
  { id: 'watchlist', label: 'Watchlist', icon: <Star size={22} />, path: '/watchlist' },
  { id: 'more', label: 'More', icon: <MoreHorizontal size={22} />, path: '/more' },
];

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
          aria-label={item.label}
          aria-current={isActive(item.path) ? 'page' : undefined}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

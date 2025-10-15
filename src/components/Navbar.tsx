import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useClerk } from '@clerk/clerk-react';
import { 
  Home, 
  Search, 
  Calendar, 
  BookOpen, 
  User, 
  Mail, 
  LogOut,
  Heart
} from 'lucide-react';

const Navbar = () => {
  const { state } = useApp();
  const { signOut } = useClerk();
  const location = useLocation();

  const handleLogout = () => {
    signOut();
  };

  const navItems = state.user?.role === 'volunteer' 
    ? [
        { icon: Home, label: 'Dashboard', path: '/volunteer-dashboard' },
        { icon: BookOpen, label: 'My Bookings', path: '/my-bookings' },
        { icon: User, label: 'Profile', path: '/profile' },
        { icon: Mail, label: 'Contact', path: '/contact' },
      ]
    : [
        { icon: Home, label: 'Dashboard', path: '/client-dashboard' },
        { icon: Calendar, label: 'My Bookings', path: '/my-bookings' },
        { icon: User, label: 'Profile', path: '/profile' },
        { icon: Mail, label: 'Contact', path: '/contact' },
      ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient">
              One-Click Volunteer
            </span>
          </Link>

          {/* Navigation Items */}
          {state.isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center space-x-2 marketplace-button"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {state.isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{state.user?.name}</p>
                    <p className="text-muted-foreground capitalize">
                      {state.user?.role}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="marketplace-button">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {state.isAuthenticated && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link key={item.path} to={item.path} className="flex-1">
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="w-full flex flex-col items-center space-y-1 h-auto py-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
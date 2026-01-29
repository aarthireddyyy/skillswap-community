import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Repeat, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSwapsStore } from '@/store/swapsStore';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/swaps', icon: Repeat, label: 'Swaps' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function MobileNav() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { getPendingCount } = useSwapsStore();

  if (!isAuthenticated) return null;

  const pendingCount = user ? getPendingCount(user.id) : 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center justify-around h-16">
        {navItems.map(item => {
          const isActive = location.pathname === item.href || 
            (item.href === '/profile' && location.pathname.startsWith('/profile'));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.href === '/swaps' && pendingCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                  >
                    {pendingCount}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 gradient-bg rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

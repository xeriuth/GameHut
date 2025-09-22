import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import UserAvatar from "@/components/common/user-avatar";
import XpBar from "@/components/common/xp-bar";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Feed', href: '/', icon: 'fas fa-home', tab: 'feed' },
    { name: 'Communities', href: '/communities', icon: 'fas fa-users', tab: 'communities' },
    { name: 'Friends', href: '/friends', icon: 'fas fa-user-friends', tab: 'friends' },
    { name: 'Game Library', href: '/library', icon: 'fas fa-book', tab: 'library' },
    { name: 'Tournaments', href: '/tournaments', icon: 'fas fa-trophy', tab: 'tournaments' },
    { name: 'My Clips', href: '/clips', icon: 'fas fa-video', tab: 'clips' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  return (
    <aside className="w-72 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center gaming-glow">
            <i className="fas fa-gamepad text-primary-foreground text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">GameVerse</h1>
            <p className="text-xs text-muted-foreground">Level Up Together</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <Link 
            key={item.tab} 
            href={item.href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            data-testid={`nav-${item.tab}`}
          >
            <i className={`${item.icon} text-lg`}></i>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* User Profile Quick Access */}
      <div className="p-4 border-t border-border">
        <Link 
          href="/profile"
          className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" 
          data-testid="link-profile"
        >
          <UserAvatar user={user} size="sm" className="border-2 border-primary" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {user?.username || 'Unknown User'}
            </p>
            <XpBar 
              currentXp={user?.xpPoints || 0} 
              level={user?.level || 1}
              size="sm"
              className="mt-1"
            />
          </div>
          <div className="text-accent">
            <i className="fas fa-crown text-sm achievement-glow" title="Premium Member"></i>
          </div>
        </Link>
      </div>
    </aside>
  );
}

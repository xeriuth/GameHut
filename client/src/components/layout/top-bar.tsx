import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

export default function TopBar() {
  const { data: notificationCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <header className="bg-card border-b border-border p-4" data-testid="top-bar">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-foreground">Game Feed</h2>
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Online:</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-accent rounded-full streaming-indicator"></div>
              <span className="text-sm text-accent font-medium">2,847</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Input
              type="text"
              placeholder="Search games, users..."
              className="w-80 pl-10"
              data-testid="input-search"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
          </div>
          
          {/* Notifications */}
          <button
            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-notifications"
          >
            <i className="fas fa-bell text-xl"></i>
            {notificationCount && notificationCount.count > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {notificationCount.count > 99 ? '99+' : notificationCount.count}
              </span>
            )}
          </button>
          
          {/* Messages */}
          <button
            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-messages"
          >
            <i className="fas fa-comment text-xl"></i>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </button>

          {/* Create Post Button */}
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gaming-glow" data-testid="button-create-post">
            <i className="fas fa-plus mr-2"></i>
            Create Post
          </Button>
        </div>
      </div>
    </header>
  );
}

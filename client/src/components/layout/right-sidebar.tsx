import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/common/user-avatar";
import { useQuery } from "@tanstack/react-query";

export default function RightSidebar() {
  const { data: onlineFriends } = useQuery({
    queryKey: ["/api/friends/online"],
  });

  // Mock trending games data for now
  const trendingGames = [
    { id: 1, name: "Baldur's Gate 3", playerCount: "234k", trend: "↗ 12%" },
    { id: 2, name: "Cyberpunk 2077", playerCount: "189k", trend: "↗ 8%" },
    { id: 3, name: "VALORANT", playerCount: "1.2M", trend: "↗ 5%" },
  ];

  // Mock upcoming events data for now
  const upcomingEvents = [
    {
      id: 1,
      title: "VALORANT Championship",
      description: "Registration opens tomorrow",
      date: "MAR 15",
      prizePool: "$50K Prize",
      icon: "fas fa-trophy"
    },
    {
      id: 2,
      title: "Community Game Night",
      description: "Join us for Among Us sessions",
      date: "MAR 18",
      joinedCount: "32 joined",
      icon: "fas fa-users"
    },
  ];

  return (
    <aside className="w-80 bg-card border-l border-border flex flex-col" data-testid="right-sidebar">
      {/* Trending Games */}
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <i className="fas fa-fire text-orange-500"></i>
          <span>Trending Games</span>
        </h3>
        <div className="space-y-3">
          {trendingGames.map((game) => (
            <div
              key={game.id}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              data-testid={`trending-game-${game.id}`}
            >
              <div className="w-10 h-10 bg-muted rounded object-cover flex items-center justify-center">
                <i className="fas fa-gamepad text-muted-foreground"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{game.name}</p>
                <p className="text-xs text-muted-foreground">{game.playerCount} playing</p>
              </div>
              <div className="text-green-400 text-sm font-medium">{game.trend}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Friends */}
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <i className="fas fa-users text-accent"></i>
          <span>Friends Online</span>
          <span className="text-sm text-muted-foreground ml-auto">
            {onlineFriends?.length || 0} online
          </span>
        </h3>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {onlineFriends && onlineFriends.length > 0 ? (
            onlineFriends.map((friend: any) => (
              <div
                key={friend.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                data-testid={`online-friend-${friend.id}`}
              >
                <div className="relative">
                  <UserAvatar user={friend} size="xs" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-card"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{friend.username}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {friend.currentGame ? `Playing ${friend.currentGame}` : 'Online'}
                  </p>
                </div>
                <button className="text-muted-foreground hover:text-primary transition-colors" data-testid={`button-invite-${friend.id}`}>
                  <i className="fas fa-plus text-sm"></i>
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">No friends online</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="p-6 flex-1">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
          <i className="fas fa-calendar text-secondary"></i>
          <span>Upcoming Events</span>
        </h3>
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="bg-muted/30 rounded-lg p-3 border border-border hover:border-primary/30 transition-colors cursor-pointer"
              data-testid={`event-${event.id}`}
            >
              <div className="flex items-start space-x-3">
                <div className="bg-primary/20 text-primary p-2 rounded text-sm font-mono">
                  <div>{event.date.split(' ')[0]}</div>
                  <div className="font-bold">{event.date.split(' ')[1]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm mb-1">{event.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <i className={event.icon}></i>
                    <span>{event.prizePool || event.joinedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

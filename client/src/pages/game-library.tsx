import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function GameLibrary() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: userGames, isLoading: userGamesLoading } = useQuery({
    queryKey: ["/api/users/games"],
    enabled: isAuthenticated,
  });

  const { data: allGames } = useQuery({
    queryKey: ["/api/games"],
    enabled: isAuthenticated,
  });

  const searchGamesMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("GET", `/api/games/search?q=${encodeURIComponent(query)}`);
      return response.json();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const addGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      await apiRequest("POST", "/api/users/games", { gameId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/games"] });
      toast({
        title: "Game Added",
        description: "Game has been added to your library!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      await apiRequest("DELETE", `/api/users/games/${gameId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/games"] });
      toast({
        title: "Game Removed",
        description: "Game has been removed from your library.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isGameInLibrary = (gameId: string) => {
    return userGames?.some((userGame: any) => userGame.gameId === gameId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      searchGamesMutation.mutate(query);
    }
  };

  const searchResults = searchGamesMutation.data || [];
  const favoriteGames = userGames?.filter((game: any) => game.isFavorite) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center gaming-glow mx-auto animate-pulse">
            <i className="fas fa-gamepad text-primary-foreground text-xl"></i>
          </div>
          <p className="text-muted-foreground">Loading game library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Game Library</h1>
              <p className="text-muted-foreground">Manage your gaming collection and discover new games</p>
            </div>

            {/* Search */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="relative">
                  <Input
                    placeholder="Search for games to add to your library..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-games"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium text-foreground">Search Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {searchResults.map((game: any) => (
                        <div
                          key={game.id}
                          className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg"
                          data-testid={`search-result-${game.id}`}
                        >
                          <div className="w-12 h-12 bg-muted rounded object-cover flex items-center justify-center">
                            {game.coverImageUrl ? (
                              <img 
                                src={game.coverImageUrl} 
                                alt={game.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <i className="fas fa-gamepad text-muted-foreground"></i>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{game.name}</p>
                            <p className="text-sm text-muted-foreground">{game.genre}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={isGameInLibrary(game.id) ? "outline" : "default"}
                            onClick={() => {
                              if (isGameInLibrary(game.id)) {
                                removeGameMutation.mutate(game.id);
                              } else {
                                addGameMutation.mutate(game.id);
                              }
                            }}
                            disabled={addGameMutation.isPending || removeGameMutation.isPending}
                            data-testid={`button-toggle-game-${game.id}`}
                          >
                            {isGameInLibrary(game.id) ? 'Remove' : 'Add'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Favorite Games */}
            {favoriteGames.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-star text-accent"></i>
                    <span>Favorite Games</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {favoriteGames.map((userGame: any) => (
                      <div
                        key={userGame.id}
                        className="text-center space-y-2"
                        data-testid={`favorite-game-${userGame.game.id}`}
                      >
                        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative group">
                          {userGame.game.coverImageUrl ? (
                            <img 
                              src={userGame.game.coverImageUrl} 
                              alt={userGame.game.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <i className="fas fa-gamepad text-muted-foreground text-2xl"></i>
                          )}
                          <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
                            <i className="fas fa-star"></i>
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{userGame.game.name}</p>
                          <p className="text-xs text-muted-foreground">{userGame.hoursPlayed}h played</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Games in Library */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-gamepad text-primary"></i>
                  <span>My Games</span>
                  {userGames && <Badge variant="secondary">{userGames.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userGamesLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading your games...</p>
                  </div>
                ) : userGames && userGames.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {userGames.map((userGame: any) => (
                      <div
                        key={userGame.id}
                        className="text-center space-y-2 group relative"
                        data-testid={`library-game-${userGame.game.id}`}
                      >
                        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative">
                          {userGame.game.coverImageUrl ? (
                            <img 
                              src={userGame.game.coverImageUrl} 
                              alt={userGame.game.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <i className="fas fa-gamepad text-muted-foreground text-2xl"></i>
                          )}
                          
                          {/* Overlay actions */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => removeGameMutation.mutate(userGame.gameId)}
                              disabled={removeGameMutation.isPending}
                              data-testid={`button-remove-${userGame.game.id}`}
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>

                          {userGame.isFavorite && (
                            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
                              <i className="fas fa-star"></i>
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{userGame.game.name}</p>
                          <p className="text-xs text-muted-foreground">{userGame.hoursPlayed}h played</p>
                          {userGame.achievements && userGame.achievements.length > 0 && (
                            <p className="text-xs text-accent">
                              {userGame.achievements.length} achievements
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-gamepad text-muted-foreground text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No games in library</h3>
                    <p className="text-muted-foreground">Search for games above to start building your collection!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

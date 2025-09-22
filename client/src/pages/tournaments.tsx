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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function Tournaments() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentDescription, setTournamentDescription] = useState('');
  const [selectedGame, setSelectedGame] = useState('');

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

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["/api/posts"],
    enabled: isAuthenticated,
    select: (data) => Array.isArray(data) ? data.filter((post: any) => post.postType === 'tournament') : [],
  });

  const { data: games = [] } = useQuery({
    queryKey: ["/api/games"],
    enabled: isAuthenticated,
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (tournamentData: any) => {
      await apiRequest("POST", "/api/posts", {
        content: tournamentData.description,
        postType: "tournament",
        gameId: tournamentData.gameId,
        metadata: {
          tournamentName: tournamentData.name,
          maxPlayers: 16,
          entryFee: 0,
          prizePool: 0,
          status: 'open'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setShowCreateDialog(false);
      setTournamentName('');
      setTournamentDescription('');
      setSelectedGame('');
      toast({
        title: "Tournament Created",
        description: "Your tournament has been created successfully!",
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
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      await apiRequest("POST", `/api/tournaments/${tournamentId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Joined Tournament",
        description: "You've successfully joined the tournament!",
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
    },
  });

  const handleCreateTournament = () => {
    if (!tournamentName.trim() || !selectedGame) {
      toast({
        title: "Missing Information",
        description: "Please enter tournament name and select a game.",
        variant: "destructive",
      });
      return;
    }

    createTournamentMutation.mutate({
      name: tournamentName.trim(),
      description: tournamentDescription.trim(),
      gameId: selectedGame,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center gaming-glow mx-auto animate-pulse">
            <i className="fas fa-gamepad text-primary-foreground text-xl"></i>
          </div>
          <p className="text-muted-foreground">Loading tournaments...</p>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Tournaments</h1>
                <p className="text-muted-foreground">Compete in gaming tournaments and climb the leaderboards</p>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground gaming-glow"
                onClick={() => setShowCreateDialog(true)}
              >
                <i className="fas fa-plus mr-2"></i>
                Create Tournament
              </Button>
            </div>

            {/* Active Tournaments */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-trophy text-accent"></i>
                  <span>Active Tournaments</span>
                  {Array.isArray(tournaments) && <Badge variant="secondary">{tournaments.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tournamentsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading tournaments...</p>
                  </div>
                ) : Array.isArray(tournaments) && tournaments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tournaments.map((tournament: any) => (
                      <div
                        key={tournament.id}
                        className="bg-muted/30 rounded-lg p-4 border border-border hover:border-accent/30 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <Badge className="bg-accent/20 text-accent border-accent/30">
                            <i className="fas fa-trophy mr-1"></i>
                            Tournament
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tournament.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-foreground mb-2">
                          {tournament.metadata?.tournamentName || 'Unnamed Tournament'}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {tournament.content || 'No description available'}
                        </p>
                        
                        {tournament.game && (
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                              {tournament.game.coverImageUrl ? (
                                <img 
                                  src={tournament.game.coverImageUrl} 
                                  alt={tournament.game.name}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <i className="fas fa-gamepad text-muted-foreground text-xs"></i>
                              )}
                            </div>
                            <span className="text-sm font-medium text-foreground">{tournament.game.name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <span>
                            <i className="fas fa-users mr-1"></i>
                            {tournament.likesCount || 0} participants
                          </span>
                          <span className="text-accent font-medium">
                            {tournament.metadata?.status || 'Open'}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => joinTournamentMutation.mutate(tournament.id)}
                            disabled={joinTournamentMutation.isPending}
                            className="flex-1"
                          >
                            <i className="fas fa-plus mr-2"></i>
                            Join Tournament
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-trophy text-muted-foreground text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No tournaments yet</h3>
                    <p className="text-muted-foreground">Be the first to create an epic gaming tournament!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Create Tournament Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Tournament</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tournament-name">Tournament Name</Label>
              <Input
                id="tournament-name"
                placeholder="Enter tournament name..."
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tournament-game">Game</Label>
              <select
                id="tournament-game"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
              >
                <option value="">Select a game...</option>
                {Array.isArray(games) && games.map((game: any) => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tournament-description">Description</Label>
              <Textarea
                id="tournament-description"
                placeholder="Describe your tournament..."
                value={tournamentDescription}
                onChange={(e) => setTournamentDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTournament}
              disabled={createTournamentMutation.isPending}
            >
              {createTournamentMutation.isPending ? "Creating..." : "Create Tournament"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
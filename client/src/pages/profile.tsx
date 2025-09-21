import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/common/user-avatar";
import XpBar from "@/components/common/xp-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    twitchUsername: '',
    youtubeUsername: '',
    discordUsername: '',
    gamingPlatforms: [] as string[],
  });

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

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        twitchUsername: user.twitchUsername || '',
        youtubeUsername: user.youtubeUsername || '',
        discordUsername: user.discordUsername || '',
        gamingPlatforms: user.gamingPlatforms || [],
      });
    }
  }, [user]);

  const { data: userGames, isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/users/games"],
    enabled: isAuthenticated,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      await apiRequest("PUT", "/api/users/profile", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
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
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const addPlatform = (platform: string) => {
    if (platform && !formData.gamingPlatforms.includes(platform)) {
      setFormData(prev => ({
        ...prev,
        gamingPlatforms: [...prev.gamingPlatforms, platform]
      }));
    }
  };

  const removePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      gamingPlatforms: prev.gamingPlatforms.filter(p => p !== platform)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center gaming-glow mx-auto animate-pulse">
            <i className="fas fa-gamepad text-primary-foreground text-xl"></i>
          </div>
          <p className="text-muted-foreground">Loading profile...</p>
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
            {/* Profile Header */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <UserAvatar 
                      user={user} 
                      size="xl" 
                      className="achievement-glow" 
                      data-testid="img-profile-avatar"
                    />
                    {user?.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full border-4 border-card"></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold text-foreground" data-testid="text-profile-username">
                          {user?.username || 'Unknown User'}
                        </h1>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-muted-foreground">Level {user?.level || 1}</span>
                          <div className="w-2 h-2 bg-accent rounded-full"></div>
                          <span className="text-muted-foreground">{user?.xpPoints || 0} XP</span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant="outline"
                        data-testid="button-edit-profile"
                      >
                        <i className={`fas fa-${isEditing ? 'times' : 'edit'} mr-2`}></i>
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    </div>
                    
                    <XpBar 
                      currentXp={user?.xpPoints || 0} 
                      level={user?.level || 1}
                      className="mb-4"
                    />
                    
                    {user?.bio && !isEditing && (
                      <p className="text-muted-foreground mb-4" data-testid="text-profile-bio">
                        {user.bio}
                      </p>
                    )}
                    
                    {/* Gaming Platforms */}
                    {user?.gamingPlatforms && user.gamingPlatforms.length > 0 && !isEditing && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {user.gamingPlatforms.map(platform => (
                          <Badge key={platform} variant="secondary" data-testid={`badge-platform-${platform}`}>
                            <i className="fas fa-gamepad mr-1"></i>
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Social Links */}
                    {!isEditing && (
                      <div className="flex space-x-4">
                        {user?.twitchUsername && (
                          <a 
                            href={`https://twitch.tv/${user.twitchUsername}`}
                            className="text-purple-400 hover:text-purple-300"
                            data-testid="link-twitch"
                          >
                            <i className="fab fa-twitch mr-1"></i>
                            Twitch
                          </a>
                        )}
                        {user?.youtubeUsername && (
                          <a 
                            href={`https://youtube.com/@${user.youtubeUsername}`}
                            className="text-red-400 hover:text-red-300"
                            data-testid="link-youtube"
                          >
                            <i className="fab fa-youtube mr-1"></i>
                            YouTube
                          </a>
                        )}
                        {user?.discordUsername && (
                          <span className="text-blue-400" data-testid="text-discord">
                            <i className="fab fa-discord mr-1"></i>
                            {user.discordUsername}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Profile Form */}
            {isEditing && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        data-testid="input-username"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell other gamers about yourself..."
                        data-testid="input-bio"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="twitch">Twitch Username</Label>
                        <Input
                          id="twitch"
                          value={formData.twitchUsername}
                          onChange={(e) => setFormData(prev => ({ ...prev, twitchUsername: e.target.value }))}
                          placeholder="your_twitch_name"
                          data-testid="input-twitch"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="youtube">YouTube Channel</Label>
                        <Input
                          id="youtube"
                          value={formData.youtubeUsername}
                          onChange={(e) => setFormData(prev => ({ ...prev, youtubeUsername: e.target.value }))}
                          placeholder="@yourchannel"
                          data-testid="input-youtube"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="discord">Discord Username</Label>
                        <Input
                          id="discord"
                          value={formData.discordUsername}
                          onChange={(e) => setFormData(prev => ({ ...prev, discordUsername: e.target.value }))}
                          placeholder="username#1234"
                          data-testid="input-discord"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Gaming Platforms</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.gamingPlatforms.map(platform => (
                          <Badge key={platform} variant="secondary" className="cursor-pointer" onClick={() => removePlatform(platform)}>
                            <i className="fas fa-gamepad mr-1"></i>
                            {platform}
                            <i className="fas fa-times ml-1"></i>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        {['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'].map(platform => (
                          <Button
                            key={platform}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addPlatform(platform)}
                            disabled={formData.gamingPlatforms.includes(platform)}
                            data-testid={`button-add-platform-${platform}`}
                          >
                            {platform}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Game Library */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-book text-primary"></i>
                  <span>Game Library</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gamesLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading games...</p>
                  </div>
                ) : userGames && userGames.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {userGames.map((userGame: any) => (
                      <div key={userGame.id} className="text-center space-y-2" data-testid={`game-${userGame.game.id}`}>
                        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                          {userGame.game.coverImageUrl ? (
                            <img 
                              src={userGame.game.coverImageUrl} 
                              alt={userGame.game.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <i className="fas fa-gamepad text-muted-foreground text-2xl"></i>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{userGame.game.name}</p>
                          <p className="text-xs text-muted-foreground">{userGame.hoursPlayed}h played</p>
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
                    <p className="text-muted-foreground">Add games to showcase your gaming interests!</p>
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

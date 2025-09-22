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
import UserAvatar from "@/components/common/user-avatar";

// Video embedding utility functions
const getVideoEmbedUrl = (url: string) => {
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = extractYouTubeId(url);
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // Twitch
  if (url.includes('twitch.tv')) {
    if (url.includes('/clip/')) {
      const clipSlug = url.split('/clip/')[1]?.split('?')[0];
      if (clipSlug) return `https://clips.twitch.tv/embed?clip=${clipSlug}&parent=${window.location.hostname}`;
    }
    if (url.includes('/videos/')) {
      const videoId = url.split('/videos/')[1]?.split('?')[0];
      if (videoId) return `https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}`;
    }
  }
  
  // Kick.com
  if (url.includes('kick.com')) {
    const clipId = url.split('/clip/')[1]?.split('?')[0];
    if (clipId) return `https://player.kick.com/clip/${clipId}`;
  }
  
  return null;
};

const extractYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getVideoThumbnail = (url: string) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = extractYouTubeId(url);
    if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return null;
};

const getVideoPlatform = (url: string) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('twitch.tv')) return 'Twitch';
  if (url.includes('kick.com')) return 'Kick';
  return 'Unknown';
};

export default function Clips() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [clipTitle, setClipTitle] = useState('');
  const [clipDescription, setClipDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
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

  const { data: clips = [], isLoading: clipsLoading } = useQuery({
    queryKey: ["/api/posts"],
    enabled: isAuthenticated,
    select: (data) => Array.isArray(data) ? data.filter((post: any) => post.postType === 'video') : [],
  });

  const { data: games = [] } = useQuery({
    queryKey: ["/api/games"],
    enabled: isAuthenticated,
  });

  const createClipMutation = useMutation({
    mutationFn: async (clipData: any) => {
      await apiRequest("POST", "/api/posts", {
        content: clipData.description,
        postType: "video",
        gameId: clipData.gameId,
        mediaUrls: [clipData.videoUrl],
        metadata: {
          clipTitle: clipData.title,
          platform: getVideoPlatform(clipData.videoUrl),
          embedUrl: getVideoEmbedUrl(clipData.videoUrl),
          thumbnail: getVideoThumbnail(clipData.videoUrl)
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setShowCreateDialog(false);
      setClipTitle('');
      setClipDescription('');
      setVideoUrl('');
      setSelectedGame('');
      toast({
        title: "Clip Added",
        description: "Your gaming clip has been shared successfully!",
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
        description: "Failed to add clip. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateClip = () => {
    if (!clipTitle.trim() || !videoUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter clip title and video URL.",
        variant: "destructive",
      });
      return;
    }

    if (!getVideoEmbedUrl(videoUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube, Twitch, or Kick.com URL.",
        variant: "destructive",
      });
      return;
    }

    createClipMutation.mutate({
      title: clipTitle.trim(),
      description: clipDescription.trim(),
      videoUrl: videoUrl.trim(),
      gameId: selectedGame || null,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center gaming-glow mx-auto animate-pulse">
            <i className="fas fa-gamepad text-primary-foreground text-xl"></i>
          </div>
          <p className="text-muted-foreground">Loading clips...</p>
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
                <h1 className="text-3xl font-bold text-foreground">My Clips</h1>
                <p className="text-muted-foreground">Share your epic gaming moments with the community</p>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground gaming-glow"
                onClick={() => setShowCreateDialog(true)}
              >
                <i className="fas fa-plus mr-2"></i>
                Add Clip
              </Button>
            </div>

            {/* All Clips */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-video text-accent"></i>
                  <span>Gaming Clips</span>
                  {Array.isArray(clips) && <Badge variant="secondary">{clips.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clipsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading clips...</p>
                  </div>
                ) : Array.isArray(clips) && clips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clips.map((clip: any) => (
                      <div
                        key={clip.id}
                        className="bg-muted/30 rounded-lg p-4 border border-border hover:border-accent/30 transition-colors"
                      >
                        {/* Video Player */}
                        <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden">
                          {clip.metadata?.embedUrl ? (
                            <iframe
                              src={clip.metadata.embedUrl}
                              className="w-full h-full"
                              allowFullScreen
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                          ) : clip.metadata?.thumbnail ? (
                            <div 
                              className="w-full h-full bg-cover bg-center flex items-center justify-center"
                              style={{ backgroundImage: `url(${clip.metadata.thumbnail})` }}
                            >
                              <div className="bg-black/50 rounded-full p-4">
                                <i className="fas fa-play text-white text-2xl"></i>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <i className="fas fa-video text-muted-foreground text-4xl"></i>
                            </div>
                          )}
                        </div>

                        {/* Clip Info */}
                        <div className="space-y-3">
                          {/* Header with platform badge */}
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-foreground line-clamp-1">
                              {clip.metadata?.clipTitle || 'Untitled Clip'}
                            </h3>
                            {clip.metadata?.platform && (
                              <Badge variant="outline" className="text-xs">
                                <i className="fas fa-play mr-1"></i>
                                {clip.metadata.platform}
                              </Badge>
                            )}
                          </div>

                          {/* User info */}
                          <div className="flex items-center space-x-2">
                            <UserAvatar user={clip.user} size="xs" />
                            <span className="text-sm font-medium text-foreground">{clip.user.username}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(clip.createdAt), { addSuffix: true })}
                            </span>
                          </div>

                          {/* Game info */}
                          {clip.game && (
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                                {clip.game.coverImageUrl ? (
                                  <img 
                                    src={clip.game.coverImageUrl} 
                                    alt={clip.game.name}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <i className="fas fa-gamepad text-muted-foreground text-xs"></i>
                                )}
                              </div>
                              <span className="text-sm text-foreground">{clip.game.name}</span>
                            </div>
                          )}

                          {/* Description */}
                          {clip.content && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {clip.content}
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <button className="flex items-center space-x-1 hover:text-accent transition-colors">
                              <i className="fas fa-heart"></i>
                              <span>{clip.likesCount || 0}</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-accent transition-colors">
                              <i className="fas fa-comment"></i>
                              <span>{clip.commentsCount || 0}</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-accent transition-colors">
                              <i className="fas fa-share"></i>
                              <span>{clip.sharesCount || 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-video text-muted-foreground text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No clips yet</h3>
                    <p className="text-muted-foreground">Share your first epic gaming moment!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Add Clip Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Gaming Clip</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="clip-title">Clip Title</Label>
              <Input
                id="clip-title"
                placeholder="Enter clip title..."
                value={clipTitle}
                onChange={(e) => setClipTitle(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                placeholder="YouTube, Twitch, or Kick.com URL..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Supported: YouTube, Twitch clips/VODs, Kick.com clips
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="clip-game">Game (Optional)</Label>
              <select
                id="clip-game"
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
              <Label htmlFor="clip-description">Description</Label>
              <Textarea
                id="clip-description"
                placeholder="Describe your epic moment..."
                value={clipDescription}
                onChange={(e) => setClipDescription(e.target.value)}
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
              onClick={handleCreateClip}
              disabled={createClipMutation.isPending}
            >
              {createClipMutation.isPending ? "Adding..." : "Add Clip"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
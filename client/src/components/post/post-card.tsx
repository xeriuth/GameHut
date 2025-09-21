import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import UserAvatar from "@/components/common/user-avatar";
import GameTag from "@/components/common/game-tag";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: any;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const likePostMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
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

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post Deleted",
        description: "Your post has been deleted.",
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
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const renderPostBadge = () => {
    switch (post.postType) {
      case 'achievement':
        return (
          <Badge className="bg-accent/20 text-accent border-accent/30 achievement-glow">
            Achievement Unlocked!
          </Badge>
        );
      case 'tournament':
        return (
          <Badge className="bg-accent/20 text-accent border-accent/30">
            Tournament Host
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderPostContent = () => {
    if (post.postType === 'achievement' && post.metadata) {
      return (
        <div className="bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30 rounded-lg p-4 mb-4 achievement-glow">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center">
              <i className="fas fa-trophy text-accent-foreground text-2xl"></i>
            </div>
            <div>
              <h4 className="font-bold text-accent text-lg">{post.metadata.title}</h4>
              <p className="text-accent/80 text-sm">{post.metadata.description}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-accent text-sm font-medium">+{post.metadata.xp} XP</span>
                {post.game && (
                  <>
                    <span className="text-muted-foreground text-sm">•</span>
                    <span className="text-muted-foreground text-sm">{post.game.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (post.mediaUrls && post.mediaUrls.length > 0) {
      return (
        <div className="relative rounded-lg overflow-hidden mb-4 group cursor-pointer">
          <img 
            src={post.mediaUrls[0]} 
            alt="Post media" 
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {post.postType === 'video' && (
            <>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i className="fas fa-play text-white text-2xl ml-1"></i>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="bg-card rounded-xl border-border overflow-hidden" data-testid={`post-${post.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <UserAvatar 
            user={post.user} 
            size="sm" 
            className={post.postType === 'achievement' ? 'achievement-glow border-2 border-accent' : 'border-2 border-primary'}
            data-testid={`img-post-author-${post.id}`}
          />
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-foreground" data-testid={`text-author-${post.id}`}>
                {post.user.username}
              </h3>
              {renderPostBadge()}
              <span className="text-muted-foreground text-sm" data-testid={`text-timestamp-${post.id}`}>
                {timeAgo}
              </span>
              {user?.id === post.userId && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deletePostMutation.mutate()}
                  disabled={deletePostMutation.isPending}
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  data-testid={`button-delete-${post.id}`}
                >
                  <i className="fas fa-trash"></i>
                </Button>
              )}
            </div>
            
            <p className="text-foreground mb-4" data-testid={`text-content-${post.id}`}>
              {post.content}
            </p>
            
            {renderPostContent()}

            {/* Game Tag */}
            {post.game && (
              <div className="mb-4">
                <GameTag game={post.game} />
              </div>
            )}

            {/* Engagement Actions */}
            <div className="flex items-center space-x-6 text-muted-foreground">
              <button
                onClick={() => likePostMutation.mutate()}
                disabled={likePostMutation.isPending}
                className={`flex items-center space-x-2 hover:text-accent transition-colors ${
                  isLiked ? 'text-accent' : ''
                }`}
                data-testid={`button-like-${post.id}`}
              >
                <i className={`fas fa-heart ${isLiked ? 'text-accent' : ''}`}></i>
                <span>{post.likesCount || 0}</span>
              </button>
              
              <button 
                className="flex items-center space-x-2 hover:text-secondary transition-colors"
                data-testid={`button-comment-${post.id}`}
              >
                <i className="fas fa-comment"></i>
                <span>{post.commentsCount || 0}</span>
              </button>
              
              <button 
                className="flex items-center space-x-2 hover:text-primary transition-colors"
                data-testid={`button-share-${post.id}`}
              >
                <i className="fas fa-share"></i>
                <span>{post.sharesCount || 0}</span>
              </button>
              
              {post.postType === 'tournament' && (
                <button 
                  className="flex items-center space-x-2 hover:text-accent transition-colors ml-auto"
                  data-testid={`button-join-tournament-${post.id}`}
                >
                  <i className="fas fa-trophy"></i>
                  <span>Join Tournament</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

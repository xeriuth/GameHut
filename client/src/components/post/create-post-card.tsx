import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import UserAvatar from "@/components/common/user-avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function CreatePostCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      await apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setContent("");
      toast({
        title: "Post Created",
        description: "Your post has been shared with the community!",
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
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Empty Post",
        description: "Please enter some content for your post.",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      content: content.trim(),
      postType: "text",
      mediaUrls: [],
    });
  };

  return (
    <Card className="bg-card rounded-xl border-border" data-testid="create-post-card">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <UserAvatar user={user} size="sm" className="border-2 border-primary" data-testid="img-user-avatar" />
          <div className="flex-1">
            <Textarea
              placeholder="Share your gaming moments, tips, or achievements..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 bg-input border border-border rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground"
              rows={3}
              data-testid="textarea-post-content"
            />
            <div className="flex items-center justify-between mt-4">
              <div className="flex space-x-4">
                <button 
                  className="flex items-center space-x-2 text-muted-foreground hover:text-accent transition-colors"
                  data-testid="button-attach-image"
                >
                  <i className="fas fa-image"></i>
                  <span>Image</span>
                </button>
                <button 
                  className="flex items-center space-x-2 text-muted-foreground hover:text-secondary transition-colors"
                  data-testid="button-attach-video"
                >
                  <i className="fas fa-video"></i>
                  <span>Clip</span>
                </button>
                <button 
                  className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
                  data-testid="button-select-game"
                >
                  <i className="fas fa-gamepad"></i>
                  <span>Game Tag</span>
                </button>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createPostMutation.isPending || !content.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="button-submit-post"
              >
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

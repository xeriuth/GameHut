import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import RightSidebar from "@/components/layout/right-sidebar";
import CreatePostCard from "@/components/post/create-post-card";
import PostCard from "@/components/post/post-card";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
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

  const { 
    data: posts, 
    isLoading: postsLoading,
    error: postsError 
  } = useQuery({
    queryKey: ["/api/posts"],
    enabled: isAuthenticated,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (postsError && isUnauthorizedError(postsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [postsError, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center gaming-glow mx-auto animate-pulse">
            <i className="fas fa-gamepad text-primary-foreground text-xl"></i>
          </div>
          <p className="text-muted-foreground">Loading GameVerse...</p>
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
            <CreatePostCard />
            
            <div className="space-y-6" data-testid="posts-feed">
              {postsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-card border-border">
                    <CardContent className="p-6">
                      <div className="flex space-x-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-40 w-full rounded-lg" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : posts && posts.length > 0 ? (
                posts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-comments text-muted-foreground text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to share something with the gaming community!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <RightSidebar />
    </div>
  );
}

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
import UserAvatar from "@/components/common/user-avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Friends() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

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

  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  const { data: onlineFriends = [] } = useQuery({
    queryKey: ["/api/friends/online"],
    enabled: isAuthenticated,
  });

  const { data: friendRequests = [] } = useQuery({
    queryKey: ["/api/friends/requests"],
    enabled: isAuthenticated,
  });

  const searchUsersMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(query)}`);
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
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

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (addresseeId: string) => {
      await apiRequest("POST", "/api/friends/request", { addresseeId });
    },
    onSuccess: () => {
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent!",
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
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      await apiRequest("POST", `/api/friends/requests/${friendshipId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({
        title: "Friend Request Accepted",
        description: "You're now friends!",
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

  const rejectFriendRequestMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      await apiRequest("POST", `/api/friends/requests/${friendshipId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({
        title: "Friend Request Rejected",
        description: "Friend request has been rejected.",
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      searchUsersMutation.mutate(query);
    } else {
      setSearchResults([]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center gaming-glow mx-auto animate-pulse">
            <i className="fas fa-gamepad text-primary-foreground text-xl"></i>
          </div>
          <p className="text-muted-foreground">Loading friends...</p>
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
              <h1 className="text-3xl font-bold text-foreground">Friends</h1>
              <p className="text-muted-foreground">Connect with fellow gamers and build your squad</p>
            </div>

            {/* Search */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="relative">
                  <Input
                    placeholder="Search for gamers to add as friends..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-users"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium text-foreground">Search Results</h3>
                    <div className="space-y-2">
                      {searchResults.map((user: any) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          data-testid={`search-result-${user.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <UserAvatar user={user} size="sm" />
                            <div>
                              <p className="font-medium text-foreground">{user.username}</p>
                              <p className="text-sm text-muted-foreground">Level {user.level}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => sendFriendRequestMutation.mutate(user.id)}
                            disabled={sendFriendRequestMutation.isPending}
                            data-testid={`button-add-friend-${user.id}`}
                          >
                            <i className="fas fa-user-plus mr-2"></i>
                            Add Friend
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Friend Requests */}
            {Array.isArray(friendRequests) && friendRequests.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-clock text-accent"></i>
                    <span>Friend Requests</span>
                    <Badge variant="secondary">{friendRequests.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {friendRequests.map((request: any) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        data-testid={`friend-request-${request.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <UserAvatar user={request.requester} size="sm" />
                          <div>
                            <p className="font-medium text-foreground">{request.requester.username}</p>
                            <p className="text-sm text-muted-foreground">
                              Level {request.requester.level} • {request.requester.xpPoints} XP
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => acceptFriendRequestMutation.mutate(request.id)}
                            disabled={acceptFriendRequestMutation.isPending}
                            data-testid={`button-accept-${request.id}`}
                          >
                            <i className="fas fa-check mr-2"></i>
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectFriendRequestMutation.mutate(request.id)}
                            disabled={rejectFriendRequestMutation.isPending}
                            data-testid={`button-reject-${request.id}`}
                          >
                            <i className="fas fa-times mr-2"></i>
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Online Friends */}
            {Array.isArray(onlineFriends) && onlineFriends.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-circle text-accent"></i>
                    <span>Online Now</span>
                    <Badge variant="secondary">{onlineFriends.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {onlineFriends.map((friend: any) => (
                      <div
                        key={friend.id}
                        className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg"
                        data-testid={`online-friend-${friend.id}`}
                      >
                        <div className="relative">
                          <UserAvatar user={friend} size="sm" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-card"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{friend.username}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {friend.currentGame ? `Playing ${friend.currentGame}` : 'Online'}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" data-testid={`button-message-${friend.id}`}>
                          <i className="fas fa-comment"></i>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Friends */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-users text-primary"></i>
                  <span>All Friends</span>
                  {Array.isArray(friends) && <Badge variant="secondary">{friends.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friendsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading friends...</p>
                  </div>
                ) : Array.isArray(friends) && friends.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {friends.map((friend: any) => (
                      <div
                        key={friend.id}
                        className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`friend-${friend.id}`}
                      >
                        <div className="relative">
                          <UserAvatar user={friend} size="sm" />
                          {friend.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-card"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{friend.username}</p>
                          <p className="text-sm text-muted-foreground">
                            Level {friend.level} • {friend.isOnline ? 'Online' : 'Offline'}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" data-testid={`button-chat-${friend.id}`}>
                          <i className="fas fa-comment"></i>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-user-friends text-muted-foreground text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No friends yet</h3>
                    <p className="text-muted-foreground">Search for gamers above to start building your squad!</p>
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

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Communities() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const [communityDescription, setCommunityDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

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

  const { data: communities = [], isLoading: communitiesLoading } = useQuery({
    queryKey: ["/api/communities"],
    enabled: isAuthenticated,
  });

  const { data: userCommunities = [] } = useQuery({
    queryKey: ["/api/users/communities"],
    enabled: isAuthenticated,
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      await apiRequest("POST", `/api/communities/${communityId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      toast({
        title: "Community Joined",
        description: "You've successfully joined the community!",
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
        description: "Failed to join community. Please try again.",
        variant: "destructive",
      });
    },
  });

  const leaveCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      await apiRequest("POST", `/api/communities/${communityId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      toast({
        title: "Community Left",
        description: "You've left the community.",
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
        description: "Failed to leave community. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (communityData: any) => {
      await apiRequest("POST", "/api/communities", communityData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/communities"] });
      setShowCreateDialog(false);
      setCommunityName('');
      setCommunityDescription('');
      setIsPrivate(false);
      toast({
        title: "Community Created",
        description: "Your community has been created successfully!",
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
        description: "Failed to create community. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCommunity = () => {
    if (!communityName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a community name.",
        variant: "destructive",
      });
      return;
    }

    createCommunityMutation.mutate({
      name: communityName.trim(),
      description: communityDescription.trim(),
      isPrivate,
    });
  };

  const isUserInCommunity = (communityId: string) => {
    return Array.isArray(userCommunities) && userCommunities.some((uc: any) => uc.id === communityId);
  };

  const filteredCommunities = Array.isArray(communities) ? communities.filter((community: any) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center gaming-glow mx-auto animate-pulse">
            <i className="fas fa-gamepad text-primary-foreground text-xl"></i>
          </div>
          <p className="text-muted-foreground">Loading communities...</p>
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
                <h1 className="text-3xl font-bold text-foreground">Gaming Communities</h1>
                <p className="text-muted-foreground">Discover and join communities for your favorite games</p>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground gaming-glow"
                onClick={() => setShowCreateDialog(true)}
              >
                <i className="fas fa-plus mr-2"></i>
                Create Community
              </Button>
            </div>

            {/* Search */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="relative">
                  <Input
                    placeholder="Search communities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-communities"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                </div>
              </CardContent>
            </Card>

            {/* My Communities */}
            {Array.isArray(userCommunities) && userCommunities.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-star text-accent"></i>
                    <span>My Communities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userCommunities.map((community: any) => (
                      <div
                        key={community.id}
                        className="bg-muted/50 rounded-lg p-4 border border-border hover:border-accent/30 transition-colors"
                        data-testid={`my-community-${community.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{community.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            Member
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {community.description || 'No description available'}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{community.memberCount} members</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => leaveCommunityMutation.mutate(community.id)}
                            disabled={leaveCommunityMutation.isPending}
                            data-testid={`button-leave-${community.id}`}
                          >
                            Leave
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Communities */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-users text-primary"></i>
                  <span>Discover Communities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {communitiesLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading communities...</p>
                  </div>
                ) : Array.isArray(filteredCommunities) && filteredCommunities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCommunities.map((community: any) => (
                      <div
                        key={community.id}
                        className="bg-muted/30 rounded-lg p-4 border border-border hover:border-primary/30 transition-colors"
                        data-testid={`community-${community.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{community.name}</h3>
                          {community.isPrivate && (
                            <Badge variant="outline" className="text-xs">
                              <i className="fas fa-lock mr-1"></i>
                              Private
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {community.description || 'No description available'}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>
                              <i className="fas fa-users mr-1"></i>
                              {community.memberCount} members
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant={isUserInCommunity(community.id) ? "outline" : "default"}
                            onClick={() => {
                              if (isUserInCommunity(community.id)) {
                                leaveCommunityMutation.mutate(community.id);
                              } else {
                                joinCommunityMutation.mutate(community.id);
                              }
                            }}
                            disabled={joinCommunityMutation.isPending || leaveCommunityMutation.isPending}
                            data-testid={`button-join-${community.id}`}
                          >
                            {isUserInCommunity(community.id) ? 'Leave' : 'Join'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-users text-muted-foreground text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No communities found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or create a new community!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Create Community Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Community</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="community-name">Community Name</Label>
              <Input
                id="community-name"
                placeholder="Enter community name..."
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                data-testid="input-community-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="community-description">Description</Label>
              <Textarea
                id="community-description"
                placeholder="Describe your community..."
                value={communityDescription}
                onChange={(e) => setCommunityDescription(e.target.value)}
                data-testid="textarea-community-description"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-private"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-gray-300"
                data-testid="checkbox-is-private"
              />
              <Label htmlFor="is-private">Make this community private</Label>
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
              onClick={handleCreateCommunity}
              disabled={createCommunityMutation.isPending}
              data-testid="button-create-community"
            >
              {createCommunityMutation.isPending ? "Creating..." : "Create Community"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertCommunitySchema, insertGameSchema, insertPostCommentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.put('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const updatedUser = await storage.updateUserProfile(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/users/search', isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const users = await storage.searchUsers(q);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Post routes
  app.get('/api/posts', async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse({ ...req.body, userId });
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post('/api/posts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: postId } = req.params;
      
      const isLiked = await storage.isPostLiked(postId, userId);
      if (isLiked) {
        await storage.unlikePost(postId, userId);
      } else {
        await storage.likePost(postId, userId);
      }
      
      res.json({ liked: !isLiked });
    } catch (error) {
      console.error("Error toggling post like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deletePost(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Post not found or unauthorized" });
      }
      
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Comment routes
  app.get('/api/posts/:id/comments', async (req, res) => {
    try {
      const { id: postId } = req.params;
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/posts/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: postId } = req.params;
      const commentData = insertPostCommentSchema.parse({ 
        ...req.body, 
        userId, 
        postId 
      });
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Game routes
  app.get('/api/games', async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get('/api/games/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const games = await storage.searchGames(q);
      res.json(games);
    } catch (error) {
      console.error("Error searching games:", error);
      res.status(500).json({ message: "Failed to search games" });
    }
  });

  app.post('/api/games', isAuthenticated, async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  // Community routes
  app.get('/api/communities', async (req, res) => {
    try {
      const communities = await storage.getAllCommunities();
      res.json(communities);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.post('/api/communities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const communityData = insertCommunitySchema.parse({ 
        ...req.body, 
        adminUserId: userId 
      });
      const community = await storage.createCommunity(communityData);
      res.status(201).json(community);
    } catch (error) {
      console.error("Error creating community:", error);
      res.status(500).json({ message: "Failed to create community" });
    }
  });

  app.post('/api/communities/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: communityId } = req.params;
      await storage.joinCommunity(communityId, userId);
      res.json({ message: "Joined community successfully" });
    } catch (error) {
      console.error("Error joining community:", error);
      res.status(500).json({ message: "Failed to join community" });
    }
  });

  app.post('/api/communities/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: communityId } = req.params;
      await storage.leaveCommunity(communityId, userId);
      res.json({ message: "Left community successfully" });
    } catch (error) {
      console.error("Error leaving community:", error);
      res.status(500).json({ message: "Failed to leave community" });
    }
  });

  app.get('/api/users/communities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const communities = await storage.getUserCommunities(userId);
      res.json(communities);
    } catch (error) {
      console.error("Error fetching user communities:", error);
      res.status(500).json({ message: "Failed to fetch user communities" });
    }
  });

  // Friend routes
  app.get('/api/friends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get('/api/friends/online', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const onlineFriends = await storage.getOnlineFriends(userId);
      res.json(onlineFriends);
    } catch (error) {
      console.error("Error fetching online friends:", error);
      res.status(500).json({ message: "Failed to fetch online friends" });
    }
  });

  app.post('/api/friends/request', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.claims.sub;
      const { addresseeId } = req.body;
      
      if (requesterId === addresseeId) {
        return res.status(400).json({ message: "Cannot send friend request to yourself" });
      }
      
      const friendship = await storage.sendFriendRequest(requesterId, addresseeId);
      res.status(201).json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.get('/api/friends/requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post('/api/friends/requests/:id/accept', isAuthenticated, async (req, res) => {
    try {
      const { id: friendshipId } = req.params;
      await storage.acceptFriendRequest(friendshipId);
      res.json({ message: "Friend request accepted" });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.post('/api/friends/requests/:id/reject', isAuthenticated, async (req, res) => {
    try {
      const { id: friendshipId } = req.params;
      await storage.rejectFriendRequest(friendshipId);
      res.json({ message: "Friend request rejected" });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      res.status(500).json({ message: "Failed to reject friend request" });
    }
  });

  // Game library routes
  app.get('/api/users/games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userGames = await storage.getUserGames(userId);
      res.json(userGames);
    } catch (error) {
      console.error("Error fetching user games:", error);
      res.status(500).json({ message: "Failed to fetch user games" });
    }
  });

  app.post('/api/users/games', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gameData = { ...req.body, userId };
      const userGame = await storage.addGameToLibrary(gameData);
      res.status(201).json(userGame);
    } catch (error) {
      console.error("Error adding game to library:", error);
      res.status(500).json({ message: "Failed to add game to library" });
    }
  });

  app.delete('/api/users/games/:gameId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gameId } = req.params;
      await storage.removeGameFromLibrary(userId, gameId);
      res.json({ message: "Game removed from library" });
    } catch (error) {
      console.error("Error removing game from library:", error);
      res.status(500).json({ message: "Failed to remove game from library" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

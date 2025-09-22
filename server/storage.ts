import {
  users,
  games,
  communities,
  posts,
  friendships,
  userGames,
  postLikes,
  postComments,
  communityMembers,
  notifications,
  tournamentParticipants,
  type User,
  type UpsertUser,
  type Game,
  type InsertGame,
  type Community,
  type InsertCommunity,
  type Post,
  type InsertPost,
  type Friendship,
  type InsertFriendship,
  type UserGame,
  type InsertUserGame,
  type PostComment,
  type InsertPostComment,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Game operations
  getAllGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  searchGames(query: string): Promise<Game[]>;
  
  // Community operations
  getAllCommunities(): Promise<Community[]>;
  getCommunity(id: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  getCommunitiesByGame(gameId: string): Promise<Community[]>;
  joinCommunity(communityId: string, userId: string): Promise<void>;
  leaveCommunity(communityId: string, userId: string): Promise<void>;
  getUserCommunities(userId: string): Promise<Community[]>;
  
  // Post operations
  getAllPosts(): Promise<(Post & { user: User; game?: Game; community?: Community })[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  getUserPosts(userId: string): Promise<Post[]>;
  getCommunityPosts(communityId: string): Promise<Post[]>;
  deletePost(id: string, userId: string): Promise<boolean>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  isPostLiked(postId: string, userId: string): Promise<boolean>;
  
  // Comment operations
  getPostComments(postId: string): Promise<(PostComment & { user: User })[]>;
  createComment(comment: InsertPostComment): Promise<PostComment>;
  
  // Friend operations
  getFriends(userId: string): Promise<User[]>;
  getOnlineFriends(userId: string): Promise<User[]>;
  sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship>;
  acceptFriendRequest(friendshipId: string): Promise<void>;
  rejectFriendRequest(friendshipId: string): Promise<void>;
  getFriendRequests(userId: string): Promise<(Friendship & { requester: User })[]>;
  getFriendshipStatus(userId1: string, userId2: string): Promise<string | null>;
  
  // User game library operations
  getUserGames(userId: string): Promise<(UserGame & { game: Game })[]>;
  addGameToLibrary(userGame: InsertUserGame): Promise<UserGame>;
  removeGameFromLibrary(userId: string, gameId: string): Promise<void>;
  
  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  
  // User profile operations
  updateUserProfile(id: string, updates: Partial<User>): Promise<User>;
  updateUserOnlineStatus(id: string, isOnline: boolean, currentGame?: string): Promise<void>;
  searchUsers(query: string): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Game operations
  async getAllGames(): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.isActive, true)).orderBy(desc(games.name));
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async searchGames(query: string): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(and(
        eq(games.isActive, true),
        ilike(games.name, `%${query}%`)
      ));
  }

  // Community operations
  async getAllCommunities(): Promise<Community[]> {
    return await db.select().from(communities).orderBy(desc(communities.memberCount));
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const [newCommunity] = await db.insert(communities).values(community).returning();
    return newCommunity;
  }

  async getCommunitiesByGame(gameId: string): Promise<Community[]> {
    return await db
      .select()
      .from(communities)
      .where(eq(communities.gameId, gameId))
      .orderBy(desc(communities.memberCount));
  }

  async joinCommunity(communityId: string, userId: string): Promise<void> {
    await db.insert(communityMembers).values({
      communityId,
      userId,
    });
    
    await db
      .update(communities)
      .set({
        memberCount: sql`${communities.memberCount} + 1`,
      })
      .where(eq(communities.id, communityId));
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    await db
      .delete(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      ));
      
    await db
      .update(communities)
      .set({
        memberCount: sql`${communities.memberCount} - 1`,
      })
      .where(eq(communities.id, communityId));
  }

  async getUserCommunities(userId: string): Promise<Community[]> {
    const result = await db
      .select({
        id: communities.id,
        gameId: communities.gameId,
        name: communities.name,
        description: communities.description,
        adminUserId: communities.adminUserId,
        memberCount: communities.memberCount,
        imageUrl: communities.imageUrl,
        isPrivate: communities.isPrivate,
        createdAt: communities.createdAt,
      })
      .from(communities)
      .innerJoin(communityMembers, eq(communities.id, communityMembers.communityId))
      .where(eq(communityMembers.userId, userId));
    
    return result;
  }

  // Post operations
  async getAllPosts(): Promise<(Post & { user: User; game?: Game; community?: Community })[]> {
    const result = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        communityId: posts.communityId,
        gameId: posts.gameId,
        content: posts.content,
        mediaUrls: posts.mediaUrls,
        postType: posts.postType,
        metadata: posts.metadata,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        sharesCount: posts.sharesCount,
        createdAt: posts.createdAt,
        user: users,
        game: games,
        community: communities,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .leftJoin(games, eq(posts.gameId, games.id))
      .leftJoin(communities, eq(posts.communityId, communities.id))
      .orderBy(desc(posts.createdAt));

    return result as (Post & { user: User; game?: Game; community?: Community })[];
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  async getCommunityPosts(communityId: string): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.communityId, communityId))
      .orderBy(desc(posts.createdAt));
  }

  async deletePost(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.userId, userId)))
      .returning();
    
    return result.length > 0;
  }

  async likePost(postId: string, userId: string): Promise<void> {
    await db.insert(postLikes).values({ postId, userId });
    
    await db
      .update(posts)
      .set({
        likesCount: sql`${posts.likesCount} + 1`,
      })
      .where(eq(posts.id, postId));
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    await db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
      
    await db
      .update(posts)
      .set({
        likesCount: sql`${posts.likesCount} - 1`,
      })
      .where(eq(posts.id, postId));
  }

  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    
    return !!result;
  }

  // Comment operations
  async getPostComments(postId: string): Promise<(PostComment & { user: User })[]> {
    const result = await db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        userId: postComments.userId,
        content: postComments.content,
        createdAt: postComments.createdAt,
        user: users,
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(desc(postComments.createdAt));

    return result;
  }

  async createComment(comment: InsertPostComment): Promise<PostComment> {
    const [newComment] = await db.insert(postComments).values(comment).returning();
    
    if (comment.postId) {
      await db
        .update(posts)
        .set({
          commentsCount: sql`${posts.commentsCount} + 1`,
        })
        .where(eq(posts.id, comment.postId));
    }
    
    return newComment;
  }

  // Friend operations
  async getFriends(userId: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        username: users.username,
        bio: users.bio,
        xpPoints: users.xpPoints,
        level: users.level,
        gamingPlatforms: users.gamingPlatforms,
        twitchUsername: users.twitchUsername,
        youtubeUsername: users.youtubeUsername,
        discordUsername: users.discordUsername,
        isOnline: users.isOnline,
        currentGame: users.currentGame,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .innerJoin(friendships, or(
        and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, users.id)),
        and(eq(friendships.addresseeId, userId), eq(friendships.requesterId, users.id))
      ))
      .where(eq(friendships.status, 'accepted'));

    return result;
  }

  async getOnlineFriends(userId: string): Promise<User[]> {
    const friends = await this.getFriends(userId);
    return friends.filter(friend => friend.isOnline);
  }

  async sendFriendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({
        requesterId,
        addresseeId,
        status: 'pending',
      })
      .returning();
    
    return friendship;
  }

  async acceptFriendRequest(friendshipId: string): Promise<void> {
    await db
      .update(friendships)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId));
  }

  async rejectFriendRequest(friendshipId: string): Promise<void> {
    await db.delete(friendships).where(eq(friendships.id, friendshipId));
  }

  async getFriendRequests(userId: string): Promise<(Friendship & { requester: User })[]> {
    const result = await db
      .select({
        id: friendships.id,
        requesterId: friendships.requesterId,
        addresseeId: friendships.addresseeId,
        status: friendships.status,
        createdAt: friendships.createdAt,
        updatedAt: friendships.updatedAt,
        requester: users,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.requesterId, users.id))
      .where(and(
        eq(friendships.addresseeId, userId),
        eq(friendships.status, 'pending')
      ));

    return result;
  }

  async getFriendshipStatus(userId1: string, userId2: string): Promise<string | null> {
    const [friendship] = await db
      .select({ status: friendships.status })
      .from(friendships)
      .where(or(
        and(eq(friendships.requesterId, userId1), eq(friendships.addresseeId, userId2)),
        and(eq(friendships.requesterId, userId2), eq(friendships.addresseeId, userId1))
      ));

    return friendship?.status || null;
  }

  // User game library operations
  async getUserGames(userId: string): Promise<(UserGame & { game: Game })[]> {
    const result = await db
      .select({
        id: userGames.id,
        userId: userGames.userId,
        gameId: userGames.gameId,
        achievements: userGames.achievements,
        hoursPlayed: userGames.hoursPlayed,
        isFavorite: userGames.isFavorite,
        addedAt: userGames.addedAt,
        game: games,
      })
      .from(userGames)
      .innerJoin(games, eq(userGames.gameId, games.id))
      .where(eq(userGames.userId, userId))
      .orderBy(desc(userGames.addedAt));

    return result;
  }

  async addGameToLibrary(userGame: InsertUserGame): Promise<UserGame> {
    const [newUserGame] = await db.insert(userGames).values(userGame).returning();
    return newUserGame;
  }

  async removeGameFromLibrary(userId: string, gameId: string): Promise<void> {
    await db
      .delete(userGames)
      .where(and(eq(userGames.userId, userId), eq(userGames.gameId, gameId)));
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    
    return result.count;
  }

  // User profile operations
  async updateUserProfile(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean, currentGame?: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline, 
        currentGame: currentGame || null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(or(
        ilike(users.username, `%${query}%`),
        ilike(users.firstName, `%${query}%`),
        ilike(users.lastName, `%${query}%`)
      ));
  }

  // Tournament participants operations
  async joinTournament(tournamentId: string, userId: string): Promise<void> {
    await db.insert(tournamentParticipants).values({
      tournamentId,
      userId,
    });
  }

  async leaveTournament(tournamentId: string, userId: string): Promise<void> {
    await db
      .delete(tournamentParticipants)
      .where(and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        eq(tournamentParticipants.userId, userId)
      ));
  }

  async isUserInTournament(tournamentId: string, userId: string): Promise<boolean> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(tournamentParticipants)
      .where(and(
        eq(tournamentParticipants.tournamentId, tournamentId),
        eq(tournamentParticipants.userId, userId)
      ));
    return result[0].count > 0;
  }

  // Get posts from user's communities (Reddit-like feed)
  async getPostsFromUserCommunities(userId: string): Promise<Post[]> {
    const result = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        communityId: posts.communityId,
        gameId: posts.gameId,
        title: posts.title,
        content: posts.content,
        imageUrl: posts.imageUrl,
        videoUrl: posts.videoUrl,
        postType: posts.postType,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        sharesCount: posts.sharesCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .innerJoin(communityMembers, eq(posts.communityId, communityMembers.communityId))
      .where(eq(communityMembers.userId, userId))
      .orderBy(desc(posts.createdAt));
    
    return result;
  }
}

export const storage = new DatabaseStorage();

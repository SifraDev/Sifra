import {
  type User, type InsertUser,
  type Post, type InsertPost,
  type Unlock, type InsertUnlock,
  type Like,
  users, posts, unlocks, likes, paragraphUnlocks,
} from "@shared/schema";
import { db } from "./db";
import { pool } from "./db";
import { eq, desc, and, sql, sum } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserName(id: string, name: string): Promise<User>;

  getPosts(): Promise<(Post & { author: User })[]>;
  getPost(id: string): Promise<(Post & { author: User }) | undefined>;
  getPostsByAuthor(authorId: string): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  unlockPost(userId: string, postId: string, price: number): Promise<number>;

  isUnlocked(userId: string, postId: string): Promise<boolean>;
  getUnlocksByUser(userId: string): Promise<Unlock[]>;

  likePost(userId: string, postId: string): Promise<void>;
  unlikePost(userId: string, postId: string): Promise<void>;
  isLiked(userId: string, postId: string): Promise<boolean>;

  unlockParagraph(userId: string, postId: string, paragraphIndex: number, price: number): Promise<number>;
  getUnlockedParagraphs(userId: string, postId: string): Promise<number[]>;

  getLikedPosts(userId: string): Promise<(Post & { author: User })[]>;

  getTotalEarnings(authorId: string): Promise<number>;
  getTotalLikesForAuthor(authorId: string): Promise<number>;
  getTotalUnlocksForAuthor(authorId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUserName(id: string, name: string): Promise<User> {
    const [updated] = await db.update(users).set({ name }).where(eq(users.id, id)).returning();
    return updated;
  }

  async getPosts(): Promise<(Post & { author: User })[]> {
    const result = await db
      .select()
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt));

    return result.map((r: { posts: Post; users: User }) => ({ ...r.posts, author: r.users }));
  }

  async getPost(id: string): Promise<(Post & { author: User }) | undefined> {
    const [result] = await db
      .select()
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id));

    if (!result) return undefined;
    return { ...result.posts, author: result.users };
  }

  async getPostsByAuthor(authorId: string): Promise<Post[]> {
    return db.select().from(posts).where(eq(posts.authorId, authorId)).orderBy(desc(posts.createdAt));
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [created] = await db.insert(posts).values(post).returning();
    return created;
  }

  async unlockPost(userId: string, postId: string, price: number): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO likes (id, user_id, post_id) SELECT gen_random_uuid(), $1, $2 WHERE FALSE",
        [userId, postId]
      );
      await client.query(
        "INSERT INTO unlocks (id, user_id, post_id) VALUES (gen_random_uuid(), $1, $2)",
        [userId, postId]
      );
      await client.query(
        "UPDATE posts SET unlocks = unlocks + 1 WHERE id = $1",
        [postId]
      );
      const balanceResult = await client.query(
        "UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance",
        [price, userId]
      );
      await client.query("COMMIT");
      return balanceResult.rows[0].balance;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async isUnlocked(userId: string, postId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(unlocks)
      .where(and(eq(unlocks.userId, userId), eq(unlocks.postId, postId)));
    return !!result;
  }

  async getUnlocksByUser(userId: string): Promise<Unlock[]> {
    return db.select().from(unlocks).where(eq(unlocks.userId, userId));
  }

  async likePost(userId: string, postId: string): Promise<void> {
    await db.insert(likes).values({ userId, postId });
    await db.update(posts).set({ likes: sql`${posts.likes} + 1` }).where(eq(posts.id, postId));
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    await db.update(posts).set({ likes: sql`${posts.likes} - 1` }).where(eq(posts.id, postId));
  }

  async isLiked(userId: string, postId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    return !!result;
  }

  async unlockParagraph(userId: string, postId: string, paragraphIndex: number, price: number): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO paragraph_unlocks (id, user_id, post_id, paragraph_index) VALUES (gen_random_uuid(), $1, $2, $3)",
        [userId, postId, paragraphIndex]
      );
      const balanceResult = await client.query(
        "UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance",
        [price, userId]
      );
      await client.query(
        "UPDATE posts SET unlocks = unlocks + 1 WHERE id = $1",
        [postId]
      );
      await client.query("COMMIT");
      return balanceResult.rows[0].balance;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getUnlockedParagraphs(userId: string, postId: string): Promise<number[]> {
    const results = await db
      .select({ paragraphIndex: paragraphUnlocks.paragraphIndex })
      .from(paragraphUnlocks)
      .where(and(eq(paragraphUnlocks.userId, userId), eq(paragraphUnlocks.postId, postId)));
    return results.map((r: { paragraphIndex: number }) => r.paragraphIndex);
  }

  async getLikedPosts(userId: string): Promise<(Post & { author: User })[]> {
    const likedEntries = await db.select().from(likes).where(eq(likes.userId, userId));
    if (likedEntries.length === 0) return [];
    const postIds = likedEntries.map((l: { postId: string }) => l.postId);
    const results = await db
      .select()
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(sql`${posts.id} IN (${sql.join(postIds.map((id: string) => sql`${id}`), sql`, `)})`);
    return results.map((r: { posts: Post; users: User }) => ({ ...r.posts, author: r.users }));
  }

  async getTotalEarnings(authorId: string): Promise<number> {
    const authorPosts = await db.select().from(posts).where(eq(posts.authorId, authorId));
    return authorPosts.reduce((s: number, p: Post) => s + p.price * p.unlocks, 0);
  }

  async getTotalLikesForAuthor(authorId: string): Promise<number> {
    const authorPosts = await db.select().from(posts).where(eq(posts.authorId, authorId));
    return authorPosts.reduce((total: number, p: Post) => total + p.likes, 0);
  }

  async getTotalUnlocksForAuthor(authorId: string): Promise<number> {
    const authorPosts = await db.select().from(posts).where(eq(posts.authorId, authorId));
    return authorPosts.reduce((total: number, p: Post) => total + p.unlocks, 0);
  }
}

export const storage = new DatabaseStorage();

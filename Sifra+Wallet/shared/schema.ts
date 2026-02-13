import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),
  balance: integer("balance").notNull().default(0),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id),
  type: text("type").notNull().default("article"),
  title: text("title").notNull(),
  teaser: text("teaser").notNull(),
  fullContent: text("full_content").notNull().default(""),
  videoUrl: text("video_url"),
  price: integer("price").notNull().default(0),
  unlocks: integer("unlocks").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  perParagraphUnlock: boolean("per_paragraph_unlock").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const unlocks = pgTable("unlocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: varchar("post_id").notNull().references(() => posts.id),
}, (table) => [
  uniqueIndex("unique_user_post").on(table.userId, table.postId),
]);

export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: varchar("post_id").notNull().references(() => posts.id),
}, (table) => [
  uniqueIndex("unique_user_post_like").on(table.userId, table.postId),
]);

export const paragraphUnlocks = pgTable("paragraph_unlocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: varchar("post_id").notNull().references(() => posts.id),
  paragraphIndex: integer("paragraph_index").notNull(),
}, (table) => [
  uniqueIndex("unique_user_post_paragraph").on(table.userId, table.postId, table.paragraphIndex),
]);

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true });
export const insertUnlockSchema = createInsertSchema(unlocks).omit({ id: true });
export const insertLikeSchema = createInsertSchema(likes).omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertUnlock = z.infer<typeof insertUnlockSchema>;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Unlock = typeof unlocks.$inferSelect;
export type Like = typeof likes.$inferSelect;

import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { seed } from "./seed";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only video files are allowed"));
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seed();

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Accept-Ranges", "bytes");
    next();
  }, express.static(uploadsDir));

  app.get("/api/posts", async (_req, res) => {
    try {
      const posts = await storage.getPosts();
      res.json(posts);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) return res.status(404).json({ message: "Post not found" });

      const walletAddress = req.query.wallet as string | undefined;
      let isUnlocked = false;
      let isLiked = false;
      let unlockedParagraphs: number[] = [];

      if (walletAddress) {
        const user = await storage.getUserByWallet(walletAddress);
        if (user) {
          const isAuthor = user.id === post.authorId;
          isLiked = await storage.isLiked(user.id, post.id);
          if (isAuthor) {
            isUnlocked = true;
            if (post.perParagraphUnlock) {
              const paragraphs = post.fullContent.split("<br><br>");
              unlockedParagraphs = paragraphs.map((_: string, i: number) => i);
            }
          }
        }
      }

      if (post.perParagraphUnlock) {
        const visibleContent = post.fullContent.split("<br><br>").map((p: string, i: number) =>
          unlockedParagraphs.includes(i) ? p : null
        );
        res.json({ ...post, fullContent: undefined, paragraphs: visibleContent, isUnlocked, isLiked, unlockedParagraphs });
      } else if (post.type === "video") {
        if (isUnlocked) {
          res.json({ ...post, isUnlocked, isLiked, unlockedParagraphs });
        } else {
          res.json({ ...post, videoUrl: null, fullContent: "", isUnlocked, isLiked, unlockedParagraphs });
        }
      } else if (!isUnlocked) {
        res.json({ ...post, fullContent: "", isUnlocked, isLiked, unlockedParagraphs });
      } else {
        res.json({ ...post, isUnlocked, isLiked, unlockedParagraphs });
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", upload.single("video"), async (req, res) => {
    try {
      const { walletAddress, title, teaser, fullContent, price, type } = req.body;
      if (!walletAddress) return res.status(400).json({ message: "Wallet address required" });
      if (!title || !teaser) return res.status(400).json({ message: "Title and teaser are required" });

      const user = await storage.getUserByWallet(walletAddress);
      if (!user) return res.status(404).json({ message: "User not found" });

      const postType = type || "article";
      let videoUrl: string | null = null;

      if (postType === "video") {
        if (!req.file) return res.status(400).json({ message: "Video file is required" });
        videoUrl = `/uploads/${req.file.filename}`;
      } else {
        if (!fullContent) return res.status(400).json({ message: "Content is required" });
      }

      const post = await storage.createPost({
        authorId: user.id,
        type: postType,
        title,
        teaser,
        fullContent: fullContent || "",
        videoUrl,
        price: parseInt(price) || 5,
        unlocks: 0,
        likes: 0,
      });

      res.json(post);
    } catch (err) {
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post("/api/posts/:id/unlock", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) return res.status(400).json({ message: "Wallet address required" });

      const user = await storage.getUserByWallet(walletAddress);
      if (!user) return res.status(404).json({ message: "User not found" });

      const post = await storage.getPost(req.params.id);
      if (!post) return res.status(404).json({ message: "Post not found" });

      if (user.id === post.authorId) {
        return res.status(400).json({ message: "You cannot pay to unlock your own content" });
      }

      const alreadyUnlocked = await storage.isUnlocked(user.id, post.id);
      if (alreadyUnlocked) {
        const contentPayload: any = { success: true, newBalance: user.balance };
        if (post.type === "video") {
          contentPayload.videoUrl = post.videoUrl;
        } else {
          contentPayload.fullContent = post.fullContent;
        }
        return res.json(contentPayload);
      }

      if (user.balance < post.price) {
        return res.status(400).json({ message: "Insufficient KAS balance" });
      }

      const newBalance = await storage.unlockPost(user.id, post.id, post.price);
      const result: any = { success: true, newBalance };
      if (post.type === "video") {
        result.videoUrl = post.videoUrl;
      } else {
        result.fullContent = post.fullContent;
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Transaction failed" });
    }
  });

  app.post("/api/posts/:id/unlock-paragraph", async (req, res) => {
    try {
      const { walletAddress, paragraphIndex } = req.body;
      if (!walletAddress) return res.status(400).json({ message: "Wallet address required" });
      if (paragraphIndex === undefined || paragraphIndex === null) return res.status(400).json({ message: "Paragraph index required" });

      const user = await storage.getUserByWallet(walletAddress);
      if (!user) return res.status(404).json({ message: "User not found" });

      const post = await storage.getPost(req.params.id);
      if (!post) return res.status(404).json({ message: "Post not found" });

      if (!post.perParagraphUnlock) return res.status(400).json({ message: "This post does not support per-paragraph unlocking" });

      const totalParagraphs = post.fullContent.split("<br><br>").length;
      if (paragraphIndex < 0 || paragraphIndex >= totalParagraphs) {
        return res.status(400).json({ message: "Invalid paragraph index" });
      }

      if (user.id === post.authorId) {
        return res.status(400).json({ message: "You cannot pay to unlock your own content" });
      }

      const paragraphs = post.fullContent.split("<br><br>");
      const alreadyUnlocked = await storage.getUnlockedParagraphs(user.id, post.id);
      if (alreadyUnlocked.includes(paragraphIndex)) {
        return res.json({ success: true, newBalance: user.balance, paragraphContent: paragraphs[paragraphIndex] });
      }

      if (user.balance < post.price) {
        return res.status(400).json({ message: "Insufficient KAS balance" });
      }

      const newBalance = await storage.unlockParagraph(user.id, post.id, paragraphIndex, post.price);
      res.json({ success: true, newBalance, paragraphContent: paragraphs[paragraphIndex] });
    } catch (err) {
      res.status(500).json({ message: "Transaction failed" });
    }
  });

  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) return res.status(400).json({ message: "Wallet address required" });

      const user = await storage.getUserByWallet(walletAddress);
      if (!user) return res.status(404).json({ message: "User not found" });

      const post = await storage.getPost(req.params.id);
      if (!post) return res.status(404).json({ message: "Post not found" });

      if (post.perParagraphUnlock) {
        const paragraphs = post.fullContent.split("<br><br>");
        const unlockedParagraphs = await storage.getUnlockedParagraphs(user.id, post.id);
        const isAuthor = user.id === post.authorId;
        if (!isAuthor && unlockedParagraphs.length < paragraphs.length) {
          return res.status(403).json({ message: "You must unlock all paragraphs before starring" });
        }
      } else {
        const isAuthor = user.id === post.authorId;
        if (!isAuthor) {
          const hasUnlocked = await storage.isUnlocked(user.id, post.id);
          if (!hasUnlocked) {
            return res.status(403).json({ message: "You must unlock this content before starring it" });
          }
        }
      }

      const alreadyLiked = await storage.isLiked(user.id, post.id);
      if (alreadyLiked) {
        await storage.unlikePost(user.id, post.id);
        res.json({ liked: false, likes: post.likes - 1 });
      } else {
        await storage.likePost(user.id, post.id);
        res.json({ liked: true, likes: post.likes + 1 });
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.post("/api/auth/connect", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) return res.status(400).json({ message: "Wallet address required" });

      let user = await storage.getUserByWallet(walletAddress);
      if (!user) {
        user = await storage.createUser({
          walletAddress,
          name: `User_${walletAddress.substring(6, 12)}`,
          bio: "New to the ledger.",
          balance: 1000,
        });
      }

      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Connection failed" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = req.params.id;
      let user = await storage.getUser(id);

      if (!user) {
        user = await storage.getUserByWallet(id);
      }

      if (!user) return res.status(404).json({ message: "User not found" });

      const userPosts = await storage.getPostsByAuthor(user.id);
      const likedPosts = await storage.getLikedPosts(user.id);
      const totalEarnings = await storage.getTotalEarnings(user.id);
      const totalLikes = await storage.getTotalLikesForAuthor(user.id);
      const totalUnlocks = await storage.getTotalUnlocksForAuthor(user.id);

      res.json({ user, posts: userPosts, likedPosts, totalEarnings, totalLikes, totalUnlocks });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { name, walletAddress } = req.body;
      if (!name || !walletAddress) return res.status(400).json({ message: "Name and wallet address required" });

      const user = await storage.getUserByWallet(walletAddress);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.id !== req.params.id) return res.status(403).json({ message: "Not authorized" });

      const updated = await storage.updateUserName(user.id, name);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  return httpServer;
}

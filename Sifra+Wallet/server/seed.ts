import { db } from "./db";
import { users, posts } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seed() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) return;

  const [author1] = await db.insert(users).values({
    walletAddress: "kaspa:qxyz...author1",
    name: "Satoshi_N",
    bio: "Decentralized thought leader.",
    balance: 12500,
  }).returning();

  const [author2] = await db.insert(users).values({
    walletAddress: "kaspa:qabc...author2",
    name: "CryptoScribe",
    bio: "Documenting the on-chain revolution.",
    balance: 8200,
  }).returning();

  const [demoUser] = await db.insert(users).values({
    walletAddress: "kaspa:qz7...demo1",
    name: "Demo_User",
    bio: "Just browsing the ledger.",
    balance: 4500,
  }).returning();

  await db.insert(users).values({
    walletAddress: "kaspa:qq9...judge",
    name: "NodeRunner",
    bio: "Full node operator & validator.",
    balance: 7800,
  });

  await db.insert(posts).values([
    {
      authorId: author1.id,
      title: "The AI Harvest: Why We Are Losing",
      teaser:
        "We are in the middle of an AI arms race. Everyone is building the next LLM to summarize the internet. But in this gold rush, we forgot the most important asset: The Human Source. The Ad-Model is Dead: AI summarizes content, so users don't click links.",
      fullContent:
        'Creators lose revenue, and platforms lose relevance.<br><br>Censorship & Bias: Centralized gatekeepers decide what can be published and who gets demonetized. The AI Harvest: Bots scrape human intelligence for free.<br><br><strong>The Solution: Sifra</strong>. Derived from the Aramaic for "Book" and the root of "Cipher". Sifra is a decentralized publishing protocol designed for the post-AI era.<br><br>By encrypting content at the protocol level and tying access to on-chain micropayments, we create an ecosystem where:<br><br>1. Creators are compensated directly for every read<br>2. AI cannot freely scrape protected content<br>3. No centralized authority can censor or demonetize<br>4. Readers gain verifiable, watermarked access<br><br>This is not just a paywall. This is a new paradigm for intellectual property on the internet.',
      price: 5,
      unlocks: 124,
      likes: 45,
    },
    {
      authorId: author1.id,
      title: "Moving to Kaspa: Speed Test Results",
      teaser:
        "I moved my entire infrastructure to Kaspa last week. The results were shocking. While Ethereum took 12 seconds to finalize, Kaspa was effectively instant.",
      fullContent:
        "Here is the technical breakdown of our migration:<br><br><strong>Transaction Finality:</strong><br>Kaspa: ~1 second (BlockDAG)<br>Ethereum: ~12 seconds (PoS)<br>Bitcoin: ~10 minutes (PoW)<br><br>The BlockDAG structure allows us to scale without sacrificing decentralization. This is why Sifra chose Kaspa.<br><br><strong>Throughput:</strong> In our tests, Kaspa handled 32 blocks per second without congestion. The GHOSTDAG protocol ensures that even parallel blocks contribute to consensus rather than being orphaned.<br><br><strong>Cost Analysis:</strong> Average transaction fee on Kaspa is less than 0.001 KAS, making micropayments for content access economically viable for the first time.",
      price: 2,
      unlocks: 89,
      likes: 21,
    },
    {
      authorId: author2.id,
      title: "KRC-20: The Future of On-Chain Identity",
      teaser:
        "KRC-20 tokens are more than just fungible assets. They represent a new paradigm for sovereign identity on the Kaspa network. Here's why every protocol should pay attention.",
      fullContent:
        "Traditional identity systems rely on centralized databases controlled by corporations or governments. KRC-20 changes this fundamentally.<br><br><strong>Sovereign Identity Model:</strong><br>Your wallet IS your identity. No usernames, no passwords, no email verification. Just cryptographic proof of ownership.<br><br><strong>Reputation as a Token:</strong> Imagine a world where your publishing history, your reader reputation, and your content quality are all encoded on-chain. This is what Sifra is building with KRC-20.<br><br><strong>Privacy by Default:</strong> You choose what to reveal. Your wallet address is pseudonymous. Your reading habits are encrypted. Your payments are between you and the creator.",
      price: 3,
      unlocks: 56,
      likes: 33,
    },
    {
      authorId: author2.id,
      title: "Why Paywalls Failed and Sifra Won't",
      teaser:
        "Traditional paywalls created a terrible user experience. Monthly subscriptions for content you rarely read. Credit card forms that leak your data. Sifra takes a radically different approach.",
      fullContent:
        "Let's be honest: paywalls have always been broken.<br><br><strong>The Subscription Trap:</strong> Users pay $10-30/month for a publication they read twice. The economics don't work for readers OR creators.<br><br><strong>The Sifra Model:</strong> Pay per article. Micropayments via Kaspa. No subscriptions, no recurring charges, no credit cards.<br><br><strong>How It Works:</strong><br>1. Browse the feed freely - teasers are always visible<br>2. Find content worth reading<br>3. Pay the exact price in KAS (usually 1-10 KAS)<br>4. Content is instantly decrypted and watermarked to your wallet<br>5. Creator receives 95% of the payment immediately<br><br>No middlemen. No 30-day payment cycles. No platform taking 30% cuts. Just direct value exchange between minds.",
      price: 4,
      unlocks: 72,
      likes: 38,
    },
    {
      authorId: author1.id,
      perParagraphUnlock: true,
      title: "The Dead Internet Theory: Why You Are Reading Bots",
      teaser:
        "Look around you. The comments section on X? Bots. The reviews on Amazon? Generated. The 'viral' video you just watched? Algorithmically boosted. We have reached a tipping point where 50% of web traffic is non-human. The internet was built to connect humans, but it has been hijacked by engagement algorithms designed to harvest your attention span for ad revenue. You are no longer the user; you are the training data.",
      fullContent:
        "The danger isn't just spam; it's the shaping of reality. When an LLM summarizes news, it strips away nuance and bias-checks against a centralized safety filter. This means a handful of engineers in Silicon Valley now decide the 'acceptable window of thought' for the entire planet. If your idea falls outside their safety parameters, you don't just get downvoted\u2014you become invisible.<br><br>This is why the ad-model must die. As long as content is 'free,' it must be safe enough for Coca-Cola to advertise next to it. This creates a sterilization of thought. To speak the truth\u2014the raw, unpolished, controversial truth\u2014we must remove the advertiser from the equation. We must return to a direct value exchange: I write, you read, you pay. No middlemen, no censors.<br><br>Sifra is the exit door. By using Kaspa's high-speed blockDAG, we can encrypt this paragraph you are reading right now. It lives on a ledger that no government can scrub and no moderator can delete. By paying 1 KAS to unlock this, you didn't just buy an article. You voted for a future where human thought is valued, not harvested. Welcome to the resistance.",
      price: 10,
      unlocks: 315,
      likes: 842,
    },
  ]);
}

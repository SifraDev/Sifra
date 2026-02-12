import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lock, CheckCircle, Star, Unlock as UnlockIcon, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/lib/wallet-context";
import { useToast } from "@/hooks/use-toast";
import type { Post, User } from "@shared/schema";

interface ArticleData extends Post {
  author: User;
  isUnlocked: boolean;
  isLiked: boolean;
  unlockedParagraphs: number[];
  paragraphs?: (string | null)[];
}

export default function Article() {
  const [, params] = useRoute("/post/:id");
  const [, setLocation] = useLocation();
  const { wallet, setWalletModalOpen, updateBalance } = useWallet();
  const { toast } = useToast();
  const postId = params?.id;

  const [cachedContent, setCachedContent] = useState<string | null>(null);
  const [cachedVideoUrl, setCachedVideoUrl] = useState<string | null>(null);
  const [cachedParagraphs, setCachedParagraphs] = useState<Record<number, string>>({});

  const { data: article, isLoading } = useQuery<ArticleData>({
    queryKey: ["/api/posts", postId, wallet.address],
    queryFn: async () => {
      const params = wallet.address ? `?wallet=${encodeURIComponent(wallet.address)}` : "";
      const res = await fetch(`/api/posts/${postId}${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
    enabled: !!postId,
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${postId}/unlock`, {
        walletAddress: wallet.address,
      });
      return res.json();
    },
    onSuccess: (data) => {
      updateBalance(data.newBalance);
      if (data.fullContent) setCachedContent(data.fullContent);
      if (data.videoUrl) setCachedVideoUrl(data.videoUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Content Decrypted", description: "Authenticated via Kaspa blockchain." });
    },
    onError: (err: Error) => {
      toast({ title: "Transaction Failed", description: err.message, variant: "destructive" });
    },
  });

  const paragraphMutation = useMutation({
    mutationFn: async (paragraphIndex: number) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/unlock-paragraph`, {
        walletAddress: wallet.address,
        paragraphIndex,
      });
      return res.json();
    },
    onSuccess: (data, paragraphIndex) => {
      updateBalance(data.newBalance);
      if (data.paragraphContent) {
        setCachedParagraphs((prev) => ({ ...prev, [paragraphIndex]: data.paragraphContent }));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Paragraph Decrypted", description: "Section unlocked via Kaspa." });
    },
    onError: (err: Error) => {
      toast({ title: "Transaction Failed", description: err.message, variant: "destructive" });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${postId}/like`, {
        walletAddress: wallet.address,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, wallet.address] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      toast({ title: "Failed", description: "Could not toggle star.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-4 w-48 mb-8" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Post not found.</p>
      </div>
    );
  }

  const isVideo = article.type === "video";
  const isPerParagraph = article.perParagraphUnlock && article.paragraphs;
  const hasCachedContent = isVideo ? !!cachedVideoUrl : !!cachedContent;
  const effectivelyUnlocked = article.isUnlocked || hasCachedContent;

  const mergedParagraphs = isPerParagraph
    ? article.paragraphs!.map((p, i) => (p !== null ? p : cachedParagraphs[i] ?? null))
    : null;
  const allParagraphsUnlocked = isPerParagraph && mergedParagraphs!.every((p) => p !== null);
  const nextLockedIndex = isPerParagraph ? mergedParagraphs!.findIndex((p) => p === null) : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6 text-muted-foreground"
        onClick={() => setLocation("/")}
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </Button>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1
          className="text-3xl font-bold leading-tight tracking-tight"
          data-testid="text-article-title"
        >
          {article.title}
        </h1>
        {isVideo && (
          <Badge variant="secondary" className="gap-1">
            <Video className="w-3 h-3" />
            Video
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-8 pb-6 border-b border-border">
        <span className="text-sm text-muted-foreground">By</span>
        <button
          className="flex items-center gap-2 bg-transparent border-none cursor-pointer"
          onClick={() => setLocation(`/profile/${article.authorId}`)}
          data-testid="link-article-author"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-mono">
              {article.author.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-foreground">
            {article.author.name}
          </span>
        </button>
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 text-amber-400" /> {article.likes}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <UnlockIcon className="w-3 h-3" /> {article.unlocks}
          </span>
        </div>
      </div>

      <div className="text-base leading-relaxed text-foreground/90 mb-4">
        {article.teaser}
      </div>

      {isPerParagraph ? (
        <>
          <div className="space-y-6 mt-2">
            {mergedParagraphs!.map((paragraph, index) => {
              if (paragraph !== null) {
                return (
                  <div
                    key={index}
                    className="text-base leading-relaxed text-foreground/90 select-none"
                    dangerouslySetInnerHTML={{ __html: paragraph }}
                    data-testid={`text-paragraph-${index}`}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  />
                );
              }

              if (index === nextLockedIndex) {
                return (
                  <div key={index} className="mt-4 flex flex-col items-center gap-3 py-6 border-t border-dashed border-primary/30">
                    <Lock className="w-6 h-6 text-primary" />
                    <span className="text-lg font-extrabold text-primary font-mono">
                      {article.price} KAS
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Decrypt section {index + 1} of {mergedParagraphs!.length}
                    </p>
                    <Button
                      onClick={() => {
                        if (!wallet.isConnected) {
                          setWalletModalOpen(true);
                          return;
                        }
                        paragraphMutation.mutate(index);
                      }}
                      disabled={paragraphMutation.isPending}
                      className="font-mono"
                      data-testid={`button-pay-paragraph-${index}`}
                    >
                      {paragraphMutation.isPending ? "Decrypting..." : "DECRYPT"}
                    </Button>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {allParagraphsUnlocked && (
            <>
              <div className="mt-8 flex items-center gap-4 flex-wrap">
                <Button
                  variant={article.isLiked ? "default" : "outline"}
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                  data-testid="button-like"
                >
                  <Star className={`w-4 h-4 ${article.isLiked ? "text-amber-400 fill-amber-400" : ""}`} />
                  {article.isLiked ? "Starred" : "Star this article"}
                </Button>
              </div>

              <div className="mt-6 rounded-md border border-primary/40 bg-primary/5 px-5 py-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm text-primary font-mono">
                  Fully decrypted. Watermarked to {wallet.address?.substring(0, 15)}...
                </span>
              </div>
            </>
          )}
        </>
      ) : effectivelyUnlocked ? (
        <>
          {isVideo && (article.videoUrl || cachedVideoUrl) ? (
            <div className="mt-4 rounded-md overflow-hidden bg-black" data-testid="video-player-container">
              <video
                controls
                controlsList="nodownload"
                className="w-full max-h-[500px]"
                src={article.videoUrl || cachedVideoUrl!}
                data-testid="video-player"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          ) : (
            <div
              className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap select-none"
              dangerouslySetInnerHTML={{ __html: article.fullContent || cachedContent || "" }}
              data-testid="text-full-content"
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
          )}

          <div className="mt-8 flex items-center gap-4 flex-wrap">
            <Button
              variant={article.isLiked ? "default" : "outline"}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              data-testid="button-like"
            >
              <Star className={`w-4 h-4 ${article.isLiked ? "text-amber-400 fill-amber-400" : ""}`} />
              {article.isLiked ? "Starred" : "Star this"}
            </Button>
          </div>

          <div className="mt-6 rounded-md border border-primary/40 bg-primary/5 px-5 py-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm text-primary font-mono">
              Authenticated via Blockchain. Watermarked to {wallet.address?.substring(0, 15)}...
            </span>
          </div>
        </>
      ) : (
        <div className="relative mt-2">
          {isVideo ? (
            <div className="flex items-center justify-center py-16 bg-muted/30 rounded-md">
              <Video className="w-16 h-16 text-muted-foreground/40" />
            </div>
          ) : (
            <div
              className="text-base leading-relaxed text-foreground/90 select-none"
              style={{ filter: "blur(8px)", opacity: 0.4 }}
              data-testid="text-locked-content"
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
              ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
              ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-background/80 to-background">
            <div className="rounded-xl border border-primary/40 bg-card p-8 text-center max-w-sm">
              <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">{isVideo ? "Unlock video" : "Unlock full insight"}</h3>
              <span className="text-3xl font-extrabold text-primary block mb-1 font-mono">
                {article.price} KAS
              </span>
              <p className="text-sm text-muted-foreground mb-5">
                Instant decryption via Kaspa
              </p>
              <Button
                onClick={() => {
                  if (!wallet.isConnected) {
                    setWalletModalOpen(true);
                    return;
                  }
                  payMutation.mutate();
                }}
                disabled={payMutation.isPending}
                className="w-full font-mono"
                data-testid="button-pay-decrypt"
              >
                {payMutation.isPending ? "Processing (BlockDAG)..." : "PAY TO DECRYPT"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

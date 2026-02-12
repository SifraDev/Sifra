import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Unlock, Pencil, Check, X, FileText, Video, Heart } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Post, User } from "@shared/schema";

interface ProfileData {
  user: User;
  posts: Post[];
  likedPosts: (Post & { author: User })[];
  totalEarnings: number;
  totalLikes: number;
  totalUnlocks: number;
}

type TabValue = "articles" | "videos" | "likes";

export default function Profile() {
  const [, params] = useRoute("/profile/:id");
  const [, setLocation] = useLocation();
  const { wallet } = useWallet();
  const { toast } = useToast();
  const profileId = params?.id;

  const resolvedId = profileId === "me" ? wallet.address : profileId;

  const { data, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/users", resolvedId],
    enabled: !!resolvedId,
  });

  const isOwnProfile = data && wallet.isConnected && data.user.walletAddress === wallet.address;

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("articles");

  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await apiRequest("PATCH", `/api/users/${data!.user.id}`, {
        name: newName,
        walletAddress: wallet.address,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", resolvedId] });
      setEditing(false);
      toast({ title: "Name Updated", description: "Your profile name has been changed." });
    },
    onError: () => {
      toast({ title: "Update Failed", description: "Could not update your name.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="rounded-xl border border-border bg-card p-8 text-center mb-8">
          <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
          <Skeleton className="h-7 w-40 mx-auto mb-2" />
          <Skeleton className="h-4 w-56 mx-auto mb-6" />
          <div className="flex justify-center gap-8">
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-12 w-20" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  const { user, posts, likedPosts, totalEarnings, totalLikes, totalUnlocks } = data;

  const articles = posts.filter((p) => p.type !== "video");
  const videos = posts.filter((p) => p.type === "video");

  const renderPostItem = (post: Post & { author?: User }, showAuthor?: boolean) => (
    <Card
      key={post.id}
      className="hover-elevate cursor-pointer"
      onClick={() => setLocation(`/post/${post.id}`)}
      data-testid={`card-profile-post-${post.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-1">
          {post.type === "video" && (
            <Badge variant="secondary" className="gap-1">
              <Video className="w-3 h-3" />
              Video
            </Badge>
          )}
          {showAuthor && post.author && (
            <span className="text-xs text-muted-foreground">by {post.author.name}</span>
          )}
        </div>
        <h3 className="font-semibold text-foreground">{post.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.teaser}</p>
        <div className="flex items-center gap-4 flex-wrap mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400" /> {post.likes}
          </span>
          <span className="flex items-center gap-1">
            <Unlock className="w-3 h-3" /> {post.unlocks} reads
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6 text-muted-foreground"
        onClick={() => setLocation("/")}
        data-testid="button-back-profile"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </Button>

      <Card className="mb-8" data-testid="card-profile-header">
        <CardContent className="p-8 text-center">
          <Avatar className="h-20 w-20 mx-auto mb-4">
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-mono">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {editing ? (
            <div className="flex items-center justify-center gap-2 mb-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="max-w-[200px] text-center"
                data-testid="input-edit-name"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (editName.trim()) updateNameMutation.mutate(editName.trim());
                }}
                disabled={updateNameMutation.isPending}
                data-testid="button-save-name"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditing(false)}
                data-testid="button-cancel-edit"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-2xl font-bold" data-testid="text-profile-name">
                {user.name}
              </h1>
              {isOwnProfile && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => { setEditName(user.name); setEditing(true); }}
                  data-testid="button-edit-name"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          <p className="text-muted-foreground text-sm mb-6">{user.bio}</p>

          <div className="flex justify-center gap-8">
            {isOwnProfile ? (
              <>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-primary font-mono" data-testid="text-earnings">
                    {totalEarnings} KAS
                  </span>
                  <span className="text-xs text-muted-foreground">Earned</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-primary font-mono" data-testid="text-total-likes">
                    {totalLikes}
                  </span>
                  <span className="text-xs text-muted-foreground">Stars</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-primary font-mono" data-testid="text-total-unlocks">
                    {totalUnlocks}
                  </span>
                  <span className="text-xs text-muted-foreground">Paid Reads</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-amber-400 font-mono" data-testid="text-total-likes">
                    {totalLikes}
                  </span>
                  <span className="text-xs text-muted-foreground">Stars</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-primary font-mono" data-testid="text-total-unlocks">
                    {totalUnlocks}
                  </span>
                  <span className="text-xs text-muted-foreground">Paid Reads</span>
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-primary font-mono">
                    {posts.length}
                  </span>
                  <span className="text-xs text-muted-foreground">Posts</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 inline-block font-mono text-xs bg-secondary rounded-md px-4 py-2 text-muted-foreground">
            {user.walletAddress}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "articles" ? "default" : "outline"}
          onClick={() => setActiveTab("articles")}
          data-testid="tab-articles"
        >
          <FileText className="w-4 h-4" />
          Articles ({articles.length})
        </Button>
        <Button
          variant={activeTab === "videos" ? "default" : "outline"}
          onClick={() => setActiveTab("videos")}
          data-testid="tab-videos"
        >
          <Video className="w-4 h-4" />
          Videos ({videos.length})
        </Button>
        <Button
          variant={activeTab === "likes" ? "default" : "outline"}
          onClick={() => setActiveTab("likes")}
          data-testid="tab-likes"
        >
          <Heart className="w-4 h-4" />
          Likes ({likedPosts.length})
        </Button>
      </div>

      {activeTab === "articles" && (
        <>
          {articles.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No articles published yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {articles.map((post) => renderPostItem(post))}
            </div>
          )}
        </>
      )}

      {activeTab === "videos" && (
        <>
          {videos.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No videos published yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {videos.map((post) => renderPostItem(post))}
            </div>
          )}
        </>
      )}

      {activeTab === "likes" && (
        <>
          {likedPosts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No liked content yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {likedPosts.map((post) => renderPostItem(post, true))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

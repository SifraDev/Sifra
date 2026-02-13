import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, FileText, Video, Upload } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import { useToast } from "@/hooks/use-toast";

export default function NewPost() {
  const [, setLocation] = useLocation();
  const { wallet, setWalletModalOpen } = useWallet();
  const { toast } = useToast();

  const [postType, setPostType] = useState<"article" | "video">("article");
  const [title, setTitle] = useState("");
  const [teaser, setTeaser] = useState("");
  const [fullContent, setFullContent] = useState("");
  const [price, setPrice] = useState("5");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("walletAddress", wallet.address!);
      formData.append("title", title);
      formData.append("teaser", teaser);
      formData.append("price", price);
      formData.append("type", postType);

      if (postType === "article") {
        formData.append("fullContent", fullContent);
      } else if (videoFile) {
        formData.append("video", videoFile);
      }

      const res = await fetch("/api/posts", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create post");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Published", description: postType === "video" ? "Your video is now on the ledger." : "Your article is now on the ledger." });
      setLocation(`/post/${data.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Publishing Failed", description: err.message, variant: "destructive" });
    },
  });

  if (!wallet.isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Connect your wallet to publish content.</p>
        <Button onClick={() => setWalletModalOpen(true)} data-testid="button-connect-to-post">
          Connect Kaspium
        </Button>
      </div>
    );
  }

  const canSubmitArticle = title.trim() && teaser.trim() && fullContent.trim() && parseInt(price) > 0;
  const canSubmitVideo = title.trim() && teaser.trim() && videoFile && parseInt(price) > 0;
  const canSubmit = postType === "article" ? canSubmitArticle : canSubmitVideo;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6 text-muted-foreground"
        onClick={() => setLocation("/")}
        data-testid="button-back-newpost"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </Button>

      <h1 className="text-3xl font-bold mb-8 tracking-tight" data-testid="text-newpost-title">
        New {postType === "video" ? "Video" : "Article"}
      </h1>

      <div className="flex gap-2 mb-6">
        <Button
          variant={postType === "article" ? "default" : "outline"}
          onClick={() => setPostType("article")}
          data-testid="button-type-article"
        >
          <FileText className="w-4 h-4" />
          Article
        </Button>
        <Button
          variant={postType === "video" ? "default" : "outline"}
          onClick={() => setPostType("video")}
          data-testid="button-type-video"
        >
          <Video className="w-4 h-4" />
          Video
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="A compelling title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-post-title"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="teaser">Teaser</Label>
            <Textarea
              id="teaser"
              placeholder="A short preview that readers see before paying..."
              value={teaser}
              onChange={(e) => setTeaser(e.target.value)}
              className="resize-none"
              rows={3}
              data-testid="input-post-teaser"
            />
          </div>

          {postType === "article" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="content">Full Content (encrypted behind paywall)</Label>
              <Textarea
                id="content"
                placeholder="The full article content that readers unlock..."
                value={fullContent}
                onChange={(e) => setFullContent(e.target.value)}
                className="resize-none"
                rows={8}
                data-testid="input-post-content"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>Video File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setVideoFile(file);
                }}
                data-testid="input-video-file"
              />
              <div
                className="border-2 border-dashed border-border rounded-md p-8 text-center cursor-pointer hover-elevate"
                onClick={() => fileInputRef.current?.click()}
                data-testid="dropzone-video"
              >
                {videoFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <Video className="w-8 h-8 text-primary" />
                    <span className="text-sm font-medium text-foreground">{videoFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to select a video file</span>
                    <span className="text-xs text-muted-foreground">MP4, WebM, MOV up to 100MB</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="price">Price (KAS)</Label>
            <Input
              id="price"
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="max-w-[120px] font-mono"
              data-testid="input-post-price"
            />
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
            className="font-mono mt-2"
            data-testid="button-publish"
          >
            <Send className="w-4 h-4" />
            {createMutation.isPending
              ? "Publishing to BlockDAG..."
              : postType === "video" ? "Publish Video" : "Publish Article"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Unlock, Clock, Video } from "lucide-react";
import type { Post, User } from "@shared/schema";

interface PostCardProps {
  post: Post;
  author: User;
}

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function PostCard({ post, author }: PostCardProps) {
  const [, setLocation] = useLocation();

  const isVideo = post.type === "video";

  return (
    <Card
      className="hover-elevate cursor-pointer transition-colors duration-200"
      data-testid={`card-post-${post.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <button
            className="flex items-center gap-3 bg-transparent border-none cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/profile/${post.authorId}`);
            }}
            data-testid={`link-author-${post.authorId}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-mono">
                {author.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">{author.name}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {timeAgo(post.createdAt)}
              </div>
            </div>
          </button>
          {isVideo && (
            <Badge variant="secondary" className="gap-1">
              <Video className="w-3 h-3" />
              Video
            </Badge>
          )}
        </div>

        <div onClick={() => setLocation(`/post/${post.id}`)}>
          <h2
            className="text-xl font-semibold mb-2 leading-snug text-foreground"
            data-testid={`text-title-${post.id}`}
          >
            {post.title}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-5 text-sm line-clamp-3">
            {post.teaser}
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap pt-4 border-t border-border">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            {post.likes}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Unlock className="w-3.5 h-3.5" />
            {post.unlocks} Paid Reads
          </span>
          <span className="ml-auto">
            <Badge variant="outline" className="font-mono text-primary border-primary/30">
              {post.price} KAS
            </Badge>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

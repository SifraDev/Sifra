import { useQuery } from "@tanstack/react-query";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Post, User } from "@shared/schema";

interface FeedPost extends Post {
  author: User;
}

export default function Feed() {
  const { data: posts, isLoading } = useQuery<FeedPost[]>({
    queryKey: ["/api/posts"],
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1
        className="text-3xl font-bold mb-8 tracking-tight"
        data-testid="text-feed-title"
      >
        Latest Insights
      </h1>

      {isLoading ? (
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-5/6 mb-4" />
              <Skeleton className="h-px w-full mb-3" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="flex flex-col gap-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} author={post.author} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">No posts yet.</p>
          <p className="text-muted-foreground text-sm mt-2">
            The ledger awaits its first inscription.
          </p>
        </div>
      )}
    </div>
  );
}

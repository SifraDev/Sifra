import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/lib/wallet-context";
import { Navbar } from "@/components/navbar";
import { WalletModal } from "@/components/wallet-modal";
import { Watermark } from "@/components/watermark";
import Feed from "@/pages/feed";
import Article from "@/pages/article";
import Profile from "@/pages/profile";
import NewPost from "@/pages/new-post";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Feed} />
      <Route path="/post/:id" component={Article} />
      <Route path="/profile/:id" component={Profile} />
      <Route path="/new" component={NewPost} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WalletProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Watermark />
            <Navbar />
            <main>
              <Router />
            </main>
            <WalletModal />
          </div>
          <Toaster />
        </WalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

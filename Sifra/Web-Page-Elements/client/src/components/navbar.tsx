import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Zap, PenLine, LogOut } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";

export function Navbar() {
  const [, setLocation] = useLocation();
  const { wallet, disconnect, setWalletModalOpen } = useWallet();

  return (
    <nav
      className="sticky top-0 z-[100] flex items-center justify-between gap-4 flex-wrap px-6 py-4 border-b border-border bg-background/95 backdrop-blur-sm"
      data-testid="navbar"
    >
      <button
        onClick={() => setLocation("/")}
        className="font-mono text-xl font-bold tracking-tight cursor-pointer bg-transparent border-none text-foreground"
        data-testid="link-home"
      >
        Sifra<span className="text-primary">.</span>
      </button>

      <div className="flex items-center gap-3 flex-wrap">
        {wallet.isConnected ? (
          <>
            <Button
              variant="outline"
              onClick={() => setLocation("/new")}
              data-testid="button-new-post"
            >
              <PenLine className="w-4 h-4" />
              New Post
            </Button>
            <button
              onClick={() => setLocation("/profile/me")}
              className="flex items-center gap-2 cursor-pointer bg-transparent border-none"
              data-testid="link-profile"
            >
              <BalanceBadge balance={wallet.balance} />
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-mono">
                  {wallet.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { disconnect(); setLocation("/"); }}
              data-testid="button-disconnect"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button
            onClick={() => setWalletModalOpen(true)}
            data-testid="button-connect-wallet"
          >
            <Zap className="w-4 h-4" />
            Connect Kaspium
          </Button>
        )}
      </div>
    </nav>
  );
}

function BalanceBadge({ balance }: { balance: number }) {
  return (
    <span
      className="font-mono text-sm text-primary"
      data-testid="text-balance"
    >
      {balance.toLocaleString()} KAS
    </span>
  );
}

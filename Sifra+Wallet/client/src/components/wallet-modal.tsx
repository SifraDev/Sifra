import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet-context";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Zap, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function WalletModal() {
  const { walletModalOpen, setWalletModalOpen, wallet, connect, isConnecting } = useWallet();
  const { toast } = useToast();

  const connectMutation = useMutation({
    mutationFn: async () => {
      await connect();
      const accounts = await window.kasware?.getAccounts();
      const address = accounts?.[0];
      if (!address) throw new Error("Failed to get wallet address");
      const res = await apiRequest("POST", "/api/auth/connect", { walletAddress: address });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Wallet Connected", description: "Kasware wallet linked successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Connection Failed", description: err.message, variant: "destructive" });
    },
  });

  const isPending = isConnecting || connectMutation.isPending;

  return (
    <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect your Kasware Wallet to continue
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {wallet.kaswareAvailable ? (
            <>
              <div className="w-[150px] h-[150px] rounded-md border border-border overflow-hidden flex items-center justify-center bg-card">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KaspaConnect&bgcolor=121212&color=49EACB"
                  alt="Kaspa QR"
                  className="w-full h-full"
                  data-testid="img-qr-code"
                />
              </div>

              <Button
                className="w-full justify-center gap-3 font-mono text-sm"
                onClick={() => connectMutation.mutate()}
                disabled={isPending}
                data-testid="button-connect-kasware"
              >
                <Zap className="w-4 h-4" />
                {isPending ? "Connecting..." : "Connect Kasware Wallet"}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertTriangle className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Kasware Wallet extension not detected.
              </p>
              <Button
                variant="outline"
                className="font-mono text-sm"
                onClick={() => window.open("https://kasware.xyz", "_blank")}
                data-testid="button-install-kasware"
              >
                Install Kasware Wallet
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center font-mono">
            Sifra uses Kasware for Sovereign Identity on Kaspa.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

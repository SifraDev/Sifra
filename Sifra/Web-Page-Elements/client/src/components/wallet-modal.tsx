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
import { Zap, Shield } from "lucide-react";

const MOCK_WALLETS = [
  {
    address: "kaspa:qz7...demo1",
    label: "Connect Mock Wallet A",
    icon: Zap,
  },
  {
    address: "kaspa:qq9...judge",
    label: "Connect Mock Wallet B",
    icon: Shield,
  },
];

export function WalletModal() {
  const { walletModalOpen, setWalletModalOpen, connect } = useWallet();

  const loginMutation = useMutation({
    mutationFn: async (address: string) => {
      const res = await apiRequest("POST", "/api/auth/connect", { walletAddress: address });
      return res.json();
    },
    onSuccess: (data) => {
      connect(data.walletAddress, data.name, data.balance);
    },
  });

  return (
    <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">Connect Wallet</DialogTitle>
          <DialogDescription>
            Simulating Kaspium Connection
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="w-[150px] h-[150px] rounded-md border border-border overflow-hidden flex items-center justify-center bg-card">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KaspaConnect&bgcolor=121212&color=49EACB"
              alt="Kaspa QR"
              className="w-full h-full"
              data-testid="img-qr-code"
            />
          </div>

          <div className="flex flex-col gap-3 w-full">
            {MOCK_WALLETS.map((w) => (
              <Button
                key={w.address}
                variant="outline"
                className="justify-start gap-3 font-mono text-sm"
                onClick={() => loginMutation.mutate(w.address)}
                disabled={loginMutation.isPending}
                data-testid={`button-wallet-${w.address}`}
              >
                <w.icon className="w-4 h-4 text-primary" />
                {loginMutation.isPending ? "Connecting..." : w.label}
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center font-mono">
            Sifra uses KRC-20 signatures for Sovereign Identity.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

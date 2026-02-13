import { useWallet } from "@/lib/wallet-context";

export function Watermark() {
  const { wallet } = useWallet();

  if (!wallet.isConnected || !wallet.address) return null;

  const items = Array.from({ length: 40 });

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden opacity-[0.04] flex flex-wrap content-start"
      data-testid="watermark-layer"
    >
      {items.map((_, i) => (
        <div
          key={i}
          className="font-mono text-sm text-foreground w-[300px] h-[100px] flex items-center justify-center"
          style={{ transform: "rotate(-30deg)" }}
        >
          {wallet.address}
        </div>
      ))}
    </div>
  );
}

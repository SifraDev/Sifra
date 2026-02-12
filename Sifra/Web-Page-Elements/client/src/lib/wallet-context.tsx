import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface WalletState {
  address: string | null;
  name: string;
  balance: number;
  isConnected: boolean;
}

interface WalletContextType {
  wallet: WalletState;
  connect: (address: string, name: string, balance: number) => void;
  disconnect: () => void;
  updateBalance: (balance: number) => void;
  walletModalOpen: boolean;
  setWalletModalOpen: (open: boolean) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    name: "",
    balance: 0,
    isConnected: false,
  });
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const connect = useCallback((address: string, name: string, balance: number) => {
    setWallet({ address, name, balance, isConnected: true });
    setWalletModalOpen(false);
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ address: null, name: "", balance: 0, isConnected: false });
  }, []);

  const updateBalance = useCallback((balance: number) => {
    setWallet((prev) => ({ ...prev, balance }));
  }, []);

  return (
    <WalletContext.Provider
      value={{ wallet, connect, disconnect, updateBalance, walletModalOpen, setWalletModalOpen }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

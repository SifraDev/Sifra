import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

const TEST_RECEIVE_ADDRESS = "kaspatest:qpn94jhdhg7m9q2pq6egd7hfsmydkt5dsa26tf2xw6jpypy2q7w5wu80xhsn5";
const SOMPI_PER_KAS = 100_000_000;


interface WalletState {
  address: string | null;
  name: string;
  balance: number;
  isConnected: boolean;
  kaswareAvailable: boolean;
}

interface WalletContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateBalance: (balance: number) => void;
  payForArticle: (kasAmount: number) => Promise<string>;
  walletModalOpen: boolean;
  setWalletModalOpen: (open: boolean) => void;
  isConnecting: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    name: "",
    balance: 0,
    isConnected: false,
    kaswareAvailable: false,
  });
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkKasware = () => {
      if (typeof window.kasware !== "undefined") {
        setWallet((prev) => ({ ...prev, kaswareAvailable: true }));
      }
    };
    checkKasware();
    const timer = setTimeout(checkKasware, 1000);
    return () => clearTimeout(timer);
  }, []);

  const connect = useCallback(async () => {
    if (!window.kasware) {
      throw new Error("Kasware Wallet extension not detected. Please install it from the Chrome Web Store.");
    }
    setIsConnecting(true);
    try {
      const accounts = await window.kasware.requestAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from Kasware.");
      }
      const address = accounts[0];
      let balanceKas = 0;
      try {
        const balanceInfo = await window.kasware.getBalance();
        balanceKas = Math.floor(balanceInfo.total / SOMPI_PER_KAS);
      } catch {
        balanceKas = 0;
      }
      const shortName = `User_${address.substring(6, 12)}`;
      setWallet({
        address,
        name: shortName,
        balance: balanceKas,
        isConnected: true,
        kaswareAvailable: true,
      });
      setWalletModalOpen(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet((prev) => ({
      address: null,
      name: "",
      balance: 0,
      isConnected: false,
      kaswareAvailable: prev.kaswareAvailable,
    }));
  }, []);

  const updateBalance = useCallback((balance: number) => {
    setWallet((prev) => ({ ...prev, balance }));
  }, []);

  const payForArticle = useCallback(async (kasAmount: number): Promise<string> => {
    if (!window.kasware) {
      throw new Error("Kasware Wallet extension not detected.");
    }
    if (!wallet.isConnected) {
      throw new Error("Wallet not connected.");
    }
    const sompiAmount = kasAmount * SOMPI_PER_KAS;
    const txId = await window.kasware.sendKaspa(TEST_RECEIVE_ADDRESS, sompiAmount);
    if (!txId) {
      throw new Error("Transaction was rejected or failed.");
    }
    try {
      const balanceInfo = await window.kasware.getBalance();
      const newBalanceKas = Math.floor(balanceInfo.total / SOMPI_PER_KAS);
      setWallet((prev) => ({ ...prev, balance: newBalanceKas }));
    } catch {
      // balance refresh failed silently
    }
    return txId;
  }, [wallet.isConnected]);

  return (
    <WalletContext.Provider
      value={{ wallet, connect, disconnect, updateBalance, payForArticle, walletModalOpen, setWalletModalOpen, isConnecting }}
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

interface KaswareWallet {
  requestAccounts(): Promise<string[]>;
  getAccounts(): Promise<string[]>;
  getBalance(): Promise<{ confirmed: number; unconfirmed: number; total: number }>;
  signTransaction(txHex: string): Promise<string>;
  sendKaspa(
    toAddress: string,
    sompiAmount: number
  ): Promise<string>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

interface Window {
  kasware?: KaswareWallet;
}

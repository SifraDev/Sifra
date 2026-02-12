import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-primary font-mono mb-4">404</h1>
      <p className="text-muted-foreground text-lg mb-6">
        This page has not been inscribed on the ledger.
      </p>
      <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-go-home">
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </Button>
    </div>
  );
}

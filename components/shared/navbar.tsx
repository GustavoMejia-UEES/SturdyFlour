import Link from "next/link";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <div className="h-10 w-10 relative bg-slate-900 rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
            <img 
              src="https://images.vexels.com/media/users/3/247540/isolated/preview/2b41fd33fc2c2a3b7d52e9511a7fe99f-flour-text-label-stroke.png" 
              alt="Logo" 
              className="h-8 w-8 object-contain"
            />
          </div>
          <span className="font-black text-xl tracking-tight">SturdyFlour</span>
        </Link>

        <nav className="flex items-center space-x-4">
          <SignedIn>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button>Empezar Gratis</Button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}

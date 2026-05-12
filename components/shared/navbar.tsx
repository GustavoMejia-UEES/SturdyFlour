import Link from "next/link";
import { UserButton, Show, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <div className="h-10 w-10 relative bg-primary rounded-xl flex items-center justify-center shadow-md overflow-hidden border border-primary/20">
            <img 
              src="https://images.vexels.com/media/users/3/247540/isolated/preview/2b41fd33fc2c2a3b7d52e9511a7fe99f-flour-text-label-stroke.png" 
              alt="Logo" 
              className="h-8 w-8 object-contain invert brightness-200"
            />
          </div>
          <span className="font-black text-xl tracking-tight text-foreground">SturdyFlour</span>
        </Link>

        <nav className="flex items-center space-x-4">
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button variant="ghost" className="font-semibold text-sm hover:bg-secondary">Dashboard</Button>
            </Link>
            <div className="border-l pl-4 h-8 flex items-center">
              <UserButton afterSignOutUrl="/" />
            </div>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button className="font-bold shadow-md text-sm bg-primary hover:opacity-90 text-primary-foreground border-none rounded-xl px-6">
                Entrar
              </Button>
            </SignInButton>
          </Show>
        </nav>
      </div>
    </header>
  );
}

import { Newspaper } from "lucide-react";
import { Link } from "wouter";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg group-hover:scale-105 transition-transform duration-200">
            <Newspaper className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-xl leading-none">MedanBrief</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Local Intelligence</span>
          </div>
        </Link>
        
        <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            About
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            Source Code
          </a>
        </nav>
      </div>
    </header>
  );
}

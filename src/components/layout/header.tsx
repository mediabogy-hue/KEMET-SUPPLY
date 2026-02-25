'use client';

// This component has been reset. It no longer displays user or shift information.
export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
      <div className="flex-1 font-bold">
        KEMET SUPPLY
      </div>
    </header>
  );
}

import { Button } from '@/components/ui/button';
import { Logo } from "@/components/logo";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-grid-pattern">
      <div className="z-10 flex flex-col items-center text-center">
        <Logo />
        <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-br from-primary to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
          بداية جديدة
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
          لقد تم إعادة تعيين مشروعك إلى نقطة بداية نظيفة بناءً على طلبك. لقد تم تبسيط الكود، وإزالة التعقيدات، والآن لديك أساس مستقر للبدء من جديد.
        </p>
        <div className="mt-10">
          <p className="text-sm text-muted-foreground">يمكنك البدء بتعديل هذا الملف: <code className="font-mono bg-muted p-1 rounded-md">src/app/page.tsx</code></p>
        </div>
      </div>
    </main>
  );
}

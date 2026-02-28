
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground" dir="rtl">
        <div className="text-center">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="mt-4 text-2xl font-semibold">الصفحة غير موجودة</h2>
            <p className="mt-2 text-muted-foreground">
                عفواً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
            </p>
            <Button asChild className="mt-6">
                <Link href="/">العودة للرئيسية</Link>
            </Button>
        </div>
    </div>
  );
}

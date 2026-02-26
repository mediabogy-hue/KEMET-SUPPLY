
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSession } from "@/auth/SessionProvider";

export default function DashboardPage() {
  const { profile } = useSession();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        مرحباً بك، {profile?.firstName || 'المسوق'}!
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>لوحة التحكم</CardTitle>
          <CardDescription>هذه هي لوحة التحكم الخاصة بك. يمكنك من هنا متابعة أداءك.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى والإحصائيات سيتم إضافتهم هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

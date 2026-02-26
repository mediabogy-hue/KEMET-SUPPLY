
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSession } from "@/auth/SessionProvider";

export default function AdminDashboardPage() {
    const { profile } = useSession();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        مرحباً بك، {profile?.firstName || 'الأدمن'}!
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>لوحة تحكم الأدمن</CardTitle>
          <CardDescription>
            من هنا يمكنك إدارة جميع جوانب المنصة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. الإحصائيات والأدوات الإدارية سيتم إضافتها هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

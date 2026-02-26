
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminUsersPage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        إدارة المستخدمين
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <CardDescription>هنا يمكنك إدارة جميع مستخدمي المنصة.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

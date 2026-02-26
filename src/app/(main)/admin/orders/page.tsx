
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminOrdersPage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        إدارة الطلبات
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
          <CardDescription>هنا ستظهر جميع الطلبات لإدارتها وتحديث حالتها.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

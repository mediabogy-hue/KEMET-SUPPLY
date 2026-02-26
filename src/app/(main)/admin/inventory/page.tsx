
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminInventoryPage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        إدارة المخزون
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>حالة المخزون</CardTitle>
          <CardDescription>هنا يمكنك تحديث كميات المنتجات المتاحة.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

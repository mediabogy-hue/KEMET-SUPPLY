
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminProductsPage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        إدارة المنتجات
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>قائمة المنتجات</CardTitle>
          <CardDescription>هنا ستظهر جميع منتجات المنصة لإدارتها.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

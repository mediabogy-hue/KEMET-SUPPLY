
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminCategoriesPage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        إدارة الفئات
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>قائمة الفئات</CardTitle>
          <CardDescription>هنا يمكنك إضافة وتعديل فئات المنتجات.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

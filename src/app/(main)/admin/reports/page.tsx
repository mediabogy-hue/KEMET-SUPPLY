
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminReportsPage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        تقارير المنصة
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>التقارير الشاملة</CardTitle>
          <CardDescription>تحليلات مفصلة لأداء المبيعات، المسوقين، والمخزون.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ReportsPage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        التقارير المالية
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>تقارير الأرباح</CardTitle>
          <CardDescription>هنا يمكنك متابعة أرباحك وطلبات السحب.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

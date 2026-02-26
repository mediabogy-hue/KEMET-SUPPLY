
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminShippingPage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        الشحن والتوصيل
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>إدارة الشحنات</CardTitle>
          <CardDescription>هنا يمكنك إنشاء ومتابعة شحنات الطلبات المؤكدة.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

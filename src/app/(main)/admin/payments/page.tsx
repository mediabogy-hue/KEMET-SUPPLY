
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminPaymentsPage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        تأكيد الدفع
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>مراجعة الدفعات</CardTitle>
          <CardDescription>هنا يمكنك تأكيد أو رفض إثباتات الدفع المرسلة من العملاء.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

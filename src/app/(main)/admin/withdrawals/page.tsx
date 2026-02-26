
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminWithdrawalsPage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        طلبات السحب
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>مراجعة طلبات السحب</CardTitle>
          <CardDescription>هنا يمكنك مراجعة واعتماد طلبات سحب الأرباح للمسوقين.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

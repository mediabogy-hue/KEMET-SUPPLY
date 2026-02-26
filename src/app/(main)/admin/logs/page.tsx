
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminLogsPage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        سجل النشاط
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>سجل نشاط النظام</CardTitle>
          <CardDescription>عرض جميع الإجراءات الهامة التي تمت في النظام.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

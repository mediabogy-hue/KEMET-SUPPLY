
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminSettingsPage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        الإعدادات العامة
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>إعدادات المنصة</CardTitle>
          <CardDescription>هنا يمكنك التحكم في الإعدادات العامة للمنصة.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ProfilePage() {

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold mb-4">
        الملف الشخصي
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>بياناتي الشخصية</CardTitle>
          <CardDescription>هنا يمكنك تحديث بياناتك الشخصية وتفاصيل الدفع.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>تم إعادة بناء هذه الصفحة. المحتوى سيتم إضافته هنا.</p>
        </CardContent>
      </Card>
    </div>
  );
}

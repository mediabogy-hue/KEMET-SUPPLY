
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSession } from "@/auth/SessionProvider";
import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { SeedDatabaseButton } from "./_components/seed-database-button";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import type { Order } from "@/lib/types";
import { collection, query, where, Timestamp } from "firebase/firestore";

// Dynamically import the chart component to prevent SSR issues and improve performance
const SalesByHourChart = dynamic(
  () => import('./_components/sales-by-hour-chart').then(mod => mod.SalesByHourChart),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[250px]" />
  }
);


export default function AdminDashboardPage() {
    const { profile } = useSession();
    const firestore = useFirestore();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Memoize the query to prevent re-renders
    const todaysOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, "orders"),
            where("createdAt", ">=", Timestamp.fromDate(todayStart))
        );
    }, [firestore, todayStart.getTime()]); // Depend on time value to re-run if day changes

    const { data: todaysOrders, isLoading: ordersLoading } = useCollection<Order>(todaysOrdersQuery);

    const salesByHour = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => ({ name: `${i}:00`, total: 0 }));
        if (todaysOrders) {
            todaysOrders.forEach(order => {
                if (order.status !== 'Canceled' && order.status !== 'Returned') {
                    const hour = order.createdAt.toDate().getHours();
                    hours[hour].total += order.totalAmount;
                }
            });
        }
        return hours;
    }, [todaysOrders]);

    const totalSalesToday = useMemo(() => {
        return salesByHour.reduce((sum, hour) => sum + hour.total, 0);
    }, [salesByHour]);
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        مرحباً بك، {profile?.firstName || 'الأدمن'}!
                    </h1>
                    <p className="text-muted-foreground">
                        نظرة عامة على أداء المنصة اليوم.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المبيعات اليوم</CardTitle>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    </CardHeader>
                    <CardContent>
                         {ordersLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{totalSalesToday.toFixed(2)} ج.م</div>}
                        <p className="text-xs text-muted-foreground">
                            مبيعات اليوم حتى الآن
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">عدد الطلبات اليوم</CardTitle>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </CardHeader>
                    <CardContent>
                        {ordersLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{todaysOrders?.length || 0}</div>}
                        <p className="text-xs text-muted-foreground">
                             {todaysOrders?.filter(o => o.status === 'Delivered').length || 0} طلب تم توصيله
                        </p>
                    </CardContent>
                </Card>
                 {/* Add more stat cards here */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>مبيعات اليوم حسب الساعة</CardTitle>
                    <CardDescription>
                        تحليل لتوزيع المبيعات على مدار اليوم.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SalesByHourChart data={salesByHour} />
                </CardContent>
            </Card>

            <Card className="border-dashed border-amber-500">
                <CardHeader>
                    <CardTitle>أدوات المطورين</CardTitle>
                     <CardDescription>
                        استخدم هذا الزر لملء قاعدة البيانات بحسابات ومنتجات وطلبات تجريبية.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SeedDatabaseButton />
                </CardContent>
            </Card>
        </div>
    );
}

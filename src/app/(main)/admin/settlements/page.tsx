'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from './_components/data-table';
import { getColumns } from './_components/columns';
import { useSession } from '@/auth/SessionProvider';

export default function SettlementsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { isAdmin, isFinanceManager } = useSession();
    const [settlingOrderId, setSettlingOrderId] = useState<string | null>(null);

    // Fetch all delivered orders client-side. This is a simple query and doesn't require a composite index.
    const deliveredOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'orders'), where('status', '==', 'Delivered'));
    }, [firestore]);

    const { data: deliveredOrders, isLoading, error } = useCollection<Order>(deliveredOrdersQuery);

    // Filter for pending settlements on the client side.
    const pendingSettlements = useMemo(() => {
        if (!deliveredOrders) return [];
        return deliveredOrders
            .filter(order => order.isSettled !== true)
            .sort((a, b) => (b.createdAt as any).toDate().getTime() - (a.createdAt as any).toDate().getTime());
    }, [deliveredOrders]);

    const handleSettleOrder = async (order: Order) => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'خدمة قاعدة البيانات غير متاحة.' });
            return;
        }
        if (!isAdmin && !isFinanceManager) {
            toast({ variant: 'destructive', title: 'غير مصرح به', description: 'ليس لديك صلاحية لتنفيذ هذا الإجراء.' });
            return;
        }
        setSettlingOrderId(order.id);

        try {
            await runTransaction(firestore, async (transaction) => {
                const orderRef = doc(firestore, 'orders', order.id);
                
                // Safety check inside transaction
                const freshOrderDoc = await transaction.get(orderRef);
                if (!freshOrderDoc.exists() || freshOrderDoc.data().isSettled === true) {
                    toast({ variant: "destructive", title: "تمت التسوية بالفعل", description: "هذا الطلب تمت تسويته بواسطة مستخدم آخر." });
                    return;
                }

                // 1. Mark order as settled
                transaction.update(orderRef, { isSettled: true, updatedAt: serverTimestamp() });

                // 2. Settle dropshipper commission
                const dropshipperId = order.dropshipperId;
                const dropshipperCommission = Number(order.totalCommission || 0);

                if (dropshipperId && dropshipperCommission > 0) {
                    const dropshipperWalletRef = doc(firestore, 'wallets', dropshipperId);
                    transaction.update(dropshipperWalletRef, { 
                        availableBalance: increment(dropshipperCommission),
                        updatedAt: serverTimestamp() 
                    });
                }

                // 3. Settle merchant profit
                const merchantId = order.merchantId;
                if (merchantId) {
                    const orderTotalAmount = Number(order.totalAmount || 0);
                    const orderPlatformFee = Number(order.platformFee || 0);
                    const merchantProfit = orderTotalAmount - dropshipperCommission - orderPlatformFee;
                    
                    if (merchantProfit > 0) {
                        const merchantWalletRef = doc(firestore, 'wallets', merchantId);
                        const merchantWalletDoc = await transaction.get(merchantWalletRef);

                        if (merchantWalletDoc.exists()) {
                             transaction.update(merchantWalletRef, { 
                                availableBalance: increment(merchantProfit),
                                updatedAt: serverTimestamp() 
                            });
                        } else {
                            // Create a full, new wallet if it doesn't exist to prevent data corruption
                            transaction.set(merchantWalletRef, {
                                id: merchantId,
                                availableBalance: merchantProfit,
                                pendingBalance: 0,
                                pendingWithdrawals: 0,
                                totalWithdrawn: 0,
                                updatedAt: serverTimestamp(),
                            });
                        }
                    }
                }
            });

            toast({
                title: '🎉 تمت التسوية بنجاح!',
                description: `تم إيداع الأرباح للطلب #${order.id.substring(0, 5)}.`,
            });

        } catch (e: any) {
             console.error(`FATAL: Client-side settlement transaction failed for order ${order.id}:`, e);
             toast({
                variant: 'destructive',
                title: 'فشل إتمام التسوية المالية',
                description: e.message || "حدث خطأ غير متوقع أثناء محاولة تحديث قاعدة البيانات.",
                duration: 10000,
            });
        } finally {
            setSettlingOrderId(null);
        }
    };
    
    const columns = useMemo(() => getColumns(handleSettleOrder, settlingOrderId), [settlingOrderId]);
    
    if (error) {
        return (
          <div className="space-y-6">
              <div>
                  <h1 className="text-3xl font-bold tracking-tight">تسويات الأرباح</h1>
                  <p className="text-muted-foreground">مراجعة وتوزيع أرباح الطلبات المكتملة على المسوقين والتجار.</p>
              </div>
              <Card>
                <CardHeader>
                    <CardTitle className="text-destructive">خطأ في تحميل البيانات</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">فشل تحميل الطلبات: {error.message}</p>
                </CardContent>
            </Card>
          </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">تسويات الأرباح</h1>
                <p className="text-muted-foreground">مراجعة وتوزيع أرباح الطلبات المكتملة على المسوقين والتجار.</p>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>طلبات بانتظار التسوية</CardTitle>
                    <CardDescription>
                        هذه الطلبات تم توصيلها وبانتظار توزيع أرباحها.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : (
                        <DataTable columns={columns} data={pendingSettlements} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

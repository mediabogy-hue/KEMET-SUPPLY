
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from './_components/data-table';
import { getColumns } from './_components/columns';


export default function SettlementsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [settlingOrderId, setSettlingOrderId] = useState<string | null>(null);

    // Fetch all delivered orders. This is a simple query that doesn't need a composite index.
    const deliveredOrdersQuery = useMemoFirebase(
        () => (firestore ? query(
            collection(firestore, 'orders'),
            where('status', '==', 'Delivered')
        ) : null),
        [firestore]
    );
    const { data: deliveredOrders, isLoading, error } = useCollection<Order>(deliveredOrdersQuery);

    // Filter for unsettled orders on the client side. This is more robust than a complex query.
    const orders = useMemo(() => {
        if (!deliveredOrders) return [];
        return deliveredOrders.filter(order => order.isSettled !== true);
    }, [deliveredOrders]);

    
    const handleSettleOrder = async (order: Order) => {
        if (!firestore) return;

        setSettlingOrderId(order.id);
        
        try {
            await runTransaction(firestore, async (transaction) => {
                const orderRef = doc(firestore, 'orders', order.id);
                const orderDoc = await transaction.get(orderRef);

                if (!orderDoc.exists() || orderDoc.data().isSettled === true) {
                    throw new Error(`الطلب #${order.id.substring(0,5)} تم تسويته بالفعل أو غير موجود.`);
                }

                const orderData = orderDoc.data();
                const orderTotalAmount = Number(orderData.totalAmount || 0);
                const orderDropshipperCommission = Number(orderData.totalCommission || 0);
                const orderPlatformFee = Number(orderData.platformFee || 0);

                if (isNaN(orderTotalAmount) || isNaN(orderDropshipperCommission) || isNaN(orderPlatformFee)) {
                    throw new Error(`البيانات المالية للطلب #${order.id.substring(0,7)} غير صالحة.`);
                }
                
                const dropshipperId = orderData.dropshipperId;
                if (typeof dropshipperId === 'string' && dropshipperId.trim() !== '' && orderDropshipperCommission > 0) {
                    const walletRef = doc(firestore, 'wallets', dropshipperId);
                    const walletDoc = await transaction.get(walletRef);
                    
                    if (walletDoc.exists()) {
                        const currentBalance = Number(walletDoc.data()?.availableBalance);
                         if (isNaN(currentBalance)) {
                            // Correct the corrupt data and update
                            transaction.update(walletRef, { availableBalance: orderDropshipperCommission, updatedAt: serverTimestamp() });
                        } else {
                            transaction.update(walletRef, { 
                                availableBalance: currentBalance + orderDropshipperCommission,
                                updatedAt: serverTimestamp() 
                            });
                        }
                    } else {
                        // Create a full, valid wallet if it doesn't exist
                        transaction.set(walletRef, {
                            id: dropshipperId,
                            availableBalance: orderDropshipperCommission,
                            pendingBalance: 0,
                            pendingWithdrawals: 0,
                            totalWithdrawn: 0,
                            updatedAt: serverTimestamp(),
                        });
                    }
                }

                const merchantId = orderData.merchantId;
                if (typeof merchantId === 'string' && merchantId.trim() !== '') {
                    const merchantProfit = orderTotalAmount - orderDropshipperCommission - orderPlatformFee;
                    if (isNaN(merchantProfit)) {
                        throw new Error(`فشل حساب ربح التاجر للطلب #${order.id.substring(0,7)}.`);
                    }
                    if (merchantProfit < 0) {
                        throw new Error(`ربح التاجر سالب (${merchantProfit.toFixed(2)}) للطلب #${order.id.substring(0,7)}. لن تتم التسوية.`);
                    }
                    if (merchantProfit > 0) {
                        const walletRef = doc(firestore, 'wallets', merchantId);
                        const walletDoc = await transaction.get(walletRef);

                        if (walletDoc.exists()) {
                            const currentBalance = Number(walletDoc.data()?.availableBalance);
                            if (isNaN(currentBalance)) {
                               transaction.update(walletRef, { availableBalance: merchantProfit, updatedAt: serverTimestamp() });
                            } else {
                                transaction.update(walletRef, { 
                                    availableBalance: currentBalance + merchantProfit,
                                    updatedAt: serverTimestamp() 
                                });
                            }
                        } else {
                            // Create a full, valid wallet if it doesn't exist
                            transaction.set(walletRef, {
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
                
                transaction.update(orderRef, { isSettled: true, updatedAt: serverTimestamp() });
            });

            toast({
                title: '🎉 تمت التسوية بنجاح!',
                description: `تم إيداع الأرباح في المحافظ للطلب #${order.id.substring(0, 5)}.`,
            });
        } catch (e: any) {
             console.error(`FATAL: Financial settlement failed for order ${order.id}:`, e);
             toast({
                variant: 'destructive',
                title: 'فشل إتمام التسوية المالية',
                description: e.message,
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
                    {error.message.includes("The query requires an index") && (
                        <div className="mt-4 p-4 border border-dashed border-destructive rounded-lg bg-destructive/10">
                            <h3 className="font-semibold">إجراء مطلوب:</h3>
                            <p>لتحسين أداء هذه الصفحة، يتطلب الأمر إضافة فهرس مخصص لقاعدة البيانات. هذا إجراء آمن ومطلوب لفرز البيانات بكفاءة.</p>
                            <p className="mt-2">الرجاء فتح "أدوات المطورين" في متصفحك (Developer Tools)، والبحث في قسم "الكونسول" (Console) عن رسالة الخطأ التي تحتوي على رابط، ثم الضغط على هذا الرابط لإنشاء الفهرس المطلوب.</p>
                        </div>
                    )}
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
                        </div>
                    ) : (
                        <DataTable columns={columns} data={orders || []} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

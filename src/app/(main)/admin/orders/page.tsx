

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore } from "@/firebase/provider";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useMemoFirebase } from "@/hooks/useMemoFirebase";
import { collection, query, doc, updateDoc, deleteDoc, serverTimestamp, getDoc, orderBy, limit } from 'firebase/firestore';
import type { Order, Shipment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getColumns } from './_components/columns';
import { DataTable } from './_components/data-table';
import { DeleteOrderAlert } from './_components/delete-order-alert';
import { BostaManualShipmentDialog } from './_components/bosta-manual-shipment-dialog';
import { ShipmentDetailsDrawer } from '@/components/shared/shipment-details-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/auth/SessionProvider';

export default function AdminOrdersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { isFinanceManager, isAdmin, isOrdersManager } = useSession();


    // State for dialogs and drawers
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [orderToShip, setOrderToShip] = useState<Order | null>(null);
    const [orderToViewShipment, setOrderToViewShipment] = useState<Order | null>(null);
    const [shipmentDetails, setShipmentDetails] = useState<Shipment | null>(null);

    // Use real-time listener for orders, but limit to recent ones for performance.
    const ordersQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'), limit(200)) : null),
        [firestore]
    );
    const { data: orders, isLoading: ordersLoading, error: ordersError } = useCollection<Order>(ordersQuery);

    // The data is already sorted by the query, so this is not strictly necessary but harmless.
    const sortedOrders = useMemo(() => {
        if (!orders) return [];
        return orders; // Already sorted by Firestore
    }, [orders]);


    const handleStatusUpdate = async (order: Order, status: Order['status']) => {
        if (!firestore) return;

        toast({ title: `جاري تحديث حالة الطلب إلى ${status}...` });

        try {
            const orderRef = doc(firestore, 'orders', order.id);
            const updateData: any = { status, updatedAt: serverTimestamp() };
            if (status === 'Confirmed') updateData.confirmedAt = serverTimestamp();
            if (status === 'Shipped') updateData.shippedAt = serverTimestamp();
            if (status === 'Returned') updateData.returnedAt = serverTimestamp();
            if (status === 'Canceled') updateData.canceledAt = serverTimestamp();

            // If order is delivered, mark it as ready for settlement
            if (status === 'Delivered') {
                updateData.deliveredAt = serverTimestamp();
                updateData.isSettled = false;
            }

            await updateDoc(orderRef, updateData);
            toast({ title: 'تم تحديث الحالة بنجاح.' });
        } catch (e) {
            console.error('Failed to update order status:', e);
            toast({ variant: 'destructive', title: 'فشل تحديث الحالة' });
        }
    };
    
    const handleShipmentCreated = async (orderId: string, shipmentId: string, trackingNumber: string) => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'orders', orderId);
        try {
            await updateDoc(orderRef, {
                status: 'Ready to Ship',
                shipmentId: shipmentId,
                shipmentTrackingNumber: trackingNumber,
                updatedAt: serverTimestamp(),
            });
            setOrderToShip(null);
            // No need to update local state, useCollection handles it
        } catch (e) {
            console.error("Failed to link shipment to order:", e);
        }
    }

    const handleDelete = async () => {
        if (!firestore || !orderToDelete) return;
        const orderRef = doc(firestore, 'orders', orderToDelete.id);
        
        try {
            await deleteDoc(orderRef);
            // No need to update local state, useCollection handles it.
            setOrderToDelete(null);
        } catch (e) {
            console.error('Failed to delete order:', e);
            toast({ variant: 'destructive', title: 'فشل حذف الطلب' });
        }
    };

    const handleViewShipment = async (order: Order) => {
        if (!firestore || !order.shipmentId) return;
        setOrderToViewShipment(order);
        try {
            const shipmentRef = doc(firestore, 'shipments', order.shipmentId);
            const docSnap = await getDoc(shipmentRef);
            if (docSnap.exists()) {
                setShipmentDetails(docSnap.data() as Shipment);
            } else {
                toast({ variant: 'destructive', title: 'الشحنة غير موجودة' });
                setOrderToViewShipment(null);
            }
        } catch (e) {
            console.error("Failed to fetch shipment details:", e);
            toast({ variant: 'destructive', title: 'فشل جلب تفاصيل الشحنة' });
            setOrderToViewShipment(null);
        }
    };

    const columns = useMemo(
        () => getColumns(handleStatusUpdate, (order) => setOrderToDelete(order), (order) => setOrderToShip(order), handleViewShipment),
        []
    );

    const onBostaDialogShipmentCreated = () => {
        setOrderToShip(null);
    }
    
    if (ordersError) {
        return (
            <Card>
                 <CardHeader>
                    <CardTitle>خطأ</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">فشل تحميل الطلبات. قد تكون هناك مشكلة في الصلاحيات.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">إدارة الطلبات</h1>
                <p className="text-muted-foreground">عرض وتتبع جميع طلبات العملاء.</p>
            </div>
            <Card>
                <CardContent className="pt-6">
                    {ordersLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <DataTable columns={columns} data={sortedOrders || []} />
                    )}
                </CardContent>
            </Card>

            <DeleteOrderAlert
                order={orderToDelete}
                isOpen={!!orderToDelete}
                onOpenChange={(isOpen) => !isOpen && setOrderToDelete(null)}
                onConfirm={handleDelete}
            />

            <BostaManualShipmentDialog
                order={orderToShip}
                link="https://business.bosta.co/deliveries/create"
                isOpen={!!orderToShip}
                onOpenChange={(isOpen) => !isOpen && setOrderToShip(null)}
                onShipmentCreated={onBostaDialogShipmentCreated}
            />
            
            <ShipmentDetailsDrawer 
                shipment={shipmentDetails}
                isOpen={!!orderToViewShipment}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setOrderToViewShipment(null);
                        setShipmentDetails(null);
                    }
                }}
            />
        </div>
    );
}

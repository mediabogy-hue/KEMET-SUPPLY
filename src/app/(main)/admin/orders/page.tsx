
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp, getDoc, getDocs } from 'firebase/firestore';
import type { Order, Shipment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getColumns } from './_components/columns';
import { DataTable } from './_components/data-table';
import { DeleteOrderAlert } from './_components/delete-order-alert';
import { BostaManualShipmentDialog } from './_components/bosta-manual-shipment-dialog';
import { ShipmentDetailsDrawer } from '@/components/shared/shipment-details-drawer';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOrdersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // State for dialogs and drawers
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [orderToShip, setOrderToShip] = useState<Order | null>(null);
    const [orderToViewShipment, setOrderToViewShipment] = useState<Order | null>(null);
    const [shipmentDetails, setShipmentDetails] = useState<Shipment | null>(null);

    // New state for one-time data fetch
    const [orders, setOrders] = useState<Order[] | null>(null);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersError, setOrdersError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore) return;

        const fetchOrders = async () => {
            setOrdersLoading(true);
            try {
                const q = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedOrders = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Order);
                setOrders(fetchedOrders);
                setOrdersError(null);
            } catch (err: any) {
                setOrdersError(err);
                toast({ variant: 'destructive', title: 'فشل تحميل الطلبات', description: err.message });
                console.error("Error fetching orders: ", err);
            } finally {
                setOrdersLoading(false);
            }
        };

        fetchOrders();
    }, [firestore, toast]);


    const handleStatusUpdate = async (order: Order, status: Order['status']) => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'orders', order.id);
        toast({ title: `جاري تحديث حالة الطلب إلى ${status}...` });
        try {
            const updateData: any = { status, updatedAt: serverTimestamp() };
            if (status === 'Confirmed') updateData.confirmedAt = serverTimestamp();
            if (status === 'Shipped') updateData.shippedAt = serverTimestamp();
            if (status === 'Delivered') updateData.deliveredAt = serverTimestamp();
            if (status === 'Returned') updateData.returnedAt = serverTimestamp();
            if (status === 'Canceled') updateData.canceledAt = serverTimestamp();

            await updateDoc(orderRef, updateData);
            
            // Manually update local state for faster UI feedback
            setOrders(prevOrders => 
                prevOrders?.map(o => o.id === order.id ? { ...o, status: status } : o) || null
            );

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
            // Manually update local state
             setOrders(prevOrders => 
                prevOrders?.map(o => o.id === orderId ? { ...o, status: 'Ready to Ship', shipmentId, shipmentTrackingNumber } : o) || null
            );
        } catch (e) {
            console.error("Failed to link shipment to order:", e);
        }
    }

    const handleDelete = async () => {
        if (!firestore || !orderToDelete) return;
        const orderRef = doc(firestore, 'orders', orderToDelete.id);
        
        try {
            await deleteDoc(orderRef);
            // Manually update local state
            setOrders(prevOrders => prevOrders?.filter(o => o.id !== orderToDelete.id) || null);
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
        // After manual creation, we can refetch or just close the dialog.
        // The local state update in handleShipmentCreated should cover this.
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
                <p className="text-muted-foreground">عرض وتعديل وتتبع جميع طلبات العملاء.</p>
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
                        <DataTable columns={columns} data={orders || []} />
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


'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { MerchantInquiry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from './_components/data-table';
import { getColumns } from './_components/columns';

export default function MerchantInquiriesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Fetch inquiries
    const inquiriesQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'merchantInquiries'), orderBy('createdAt', 'desc')) : null),
        [firestore]
    );
    const { data: inquiries, isLoading, error } = useCollection<MerchantInquiry>(inquiriesQuery);

    const handleStatusUpdate = async (inquiry: MerchantInquiry, status: MerchantInquiry['status']) => {
        if (!firestore) return;
        const inquiryRef = doc(firestore, 'merchantInquiries', inquiry.id);
        toast({ title: `جاري تحديث حالة الطلب...` });
        try {
            await updateDoc(inquiryRef, { status, updatedAt: serverTimestamp() });
            toast({ title: 'تم تحديث الحالة بنجاح' });
        } catch (e) {
            console.error('Failed to update inquiry status:', e);
            toast({ variant: 'destructive', title: 'فشل تحديث الحالة' });
        }
    };

    const columns = useMemo(
        () => getColumns(handleStatusUpdate),
        []
    );

    if (error) {
        return <p className="text-destructive">خطأ في تحميل طلبات التجار: {error.message}</p>;
    }
    
    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">طلبات انضمام التجار</h1>
                <p className="text-muted-foreground">مراجعة طلبات التجار الجدد والموافقة عليها.</p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : (
                        <DataTable columns={columns} data={inquiries || []} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

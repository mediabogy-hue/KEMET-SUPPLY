'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductView } from './_components/product-view';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Helper to convert Firestore Timestamps to Date objects. This is important for client components.
const convertTimestampProps = (data: any): any => {
    const newData: { [key: string]: any } = { ...data };
    for (const key of ['createdAt', 'updatedAt']) {
        if (newData[key] && typeof newData[key].toDate === 'function') {
            newData[key] = newData[key].toDate();
        }
    }
    return newData;
};


export default function PublicProductPage({ params, searchParams }: { 
    params: { productId: string };
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const { productId } = params;
    const refId = typeof searchParams.ref === 'string' ? searchParams.ref : null;
    
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!productId) {
            setError("لم يتم تحديد معرّف المنتج في الرابط.");
            setIsLoading(false);
            return;
        }

        const fetchProduct = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const productRef = doc(db, 'products', productId);
                const docSnap = await getDoc(productRef);

                if (docSnap.exists() && docSnap.data().isAvailable) {
                    const productData = convertTimestampProps(docSnap.data());
                    setProduct({ id: docSnap.id, ...productData } as Product);
                } else {
                    setError("عذراً، لم نتمكن من العثور على هذا المنتج. قد يكون الرابط غير صحيح أو تمت إزالة المنتج.");
                }
            } catch (err) {
                console.error("Product fetching error:", err);
                setError("حدث خطأ أثناء تحميل بيانات المنتج. الرجاء المحاولة مرة أخرى.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
                    <div className="space-y-4">
                        <Skeleton className="w-full aspect-square" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-6 w-1/3" />
                        <Separator />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>خطأ</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            );
        }
        
        if (product) {
            return <ProductView product={product} refId={refId} />;
        }
        
        // This case should be covered by the error state, but as a fallback.
        return null;
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            {renderContent()}
        </div>
    );
}

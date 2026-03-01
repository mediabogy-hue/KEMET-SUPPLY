
'use client';

import { useEffect, useState } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Product } from '@/lib/types';
import { ProductView } from './_components/product-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PublicProductPage({ params }: { 
    params: { productId: string };
}) {
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const refId = searchParams.get('ref');

    useEffect(() => {
        if (!params.productId || !firestore) {
            setIsLoading(false);
            return;
        }

        const fetchProduct = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const productRef = doc(firestore, 'products', params.productId);
                const docSnap = await getDoc(productRef);

                if (!docSnap.exists() || !docSnap.data()?.isAvailable) {
                    setError('Product not found or is unavailable.');
                } else {
                    const data = docSnap.data() as Omit<Product, 'id'>;
                    setProduct({ id: docSnap.id, ...data });
                }
            } catch (err) {
                console.error("Failed to fetch product:", err);
                setError('Failed to load product data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [params.productId, firestore]);

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 md:p-8 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="container mx-auto p-4 md:p-8 max-w-6xl">
                <Card className="bg-destructive/10 border-destructive/30">
                    <CardHeader>
                        <CardTitle className="text-destructive">عفواً، حدث خطأ</CardTitle>
                        <CardDescription className="text-destructive/80">
                           عذراً، لم نتمكن من العثور على هذا المنتج. قد يكون الرابط غير صحيح أو تمت إزالة المنتج.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!product) {
        // This case should be covered by the error state, but as a fallback.
        notFound();
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            <ProductView product={product} refId={refId} />
        </div>
    );
}

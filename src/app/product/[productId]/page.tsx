'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { Product } from '@/lib/types';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ProductOrderForm } from './_components/product-order-form';
import { Separator } from '@/components/ui/separator';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Skeleton } from '@/components/ui/skeleton';

export default function PublicProductPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    
    const productId = typeof params.productId === 'string' ? params.productId : '';
    const refId = searchParams.get('ref');

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!productId) {
            setLoading(false);
            setError("معرّف المنتج غير موجود.");
            return;
        }

        const fetchProduct = async () => {
            try {
                setLoading(true);
                const productRef = doc(db, 'products', productId);
                const docSnap = await getDoc(productRef);

                if (docSnap.exists() && docSnap.data().isAvailable) {
                    const data = docSnap.data();
                    // Firestore timestamps are not serializable, so we convert them to a serializable format.
                    // The Product type allows for string or Timestamp, but we'll be consistent with serializable formats for client state.
                    const productData: Product = {
                        id: docSnap.id,
                        ...data,
                        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                    } as Product;
                    setProduct(productData);
                } else {
                    setError("عذراً، لم نتمكن من العثور على هذا المنتج. قد يكون الرابط غير صحيح أو تمت إزالة المنتج.");
                }
            } catch (err) {
                console.error("Error fetching product on client:", err);
                setError("حدث خطأ أثناء تحميل المنتج.");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    if (loading) {
        return (
            <div className="container mx-auto p-4 md:p-8 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
                    <div className="space-y-4">
                        <Skeleton className="aspect-square w-full rounded-lg" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-8 w-1/3" />
                        <Separator />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="container mx-auto p-4 md:p-8 max-w-2xl text-center">
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-8">
                     <h1 className="text-2xl font-bold text-destructive">حدث خطأ</h1>
                     <p className="mt-4 text-destructive/80">{error}</p>
                </div>
             </div>
        );
    }

    if (!product) {
        // This case should be covered by the error state, but as a fallback.
        return (
            <div className="container mx-auto p-4 md:p-8 max-w-2xl text-center">
                <p>المنتج غير موجود.</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
                {/* Image Gallery */}
                <div className="space-y-4 sticky top-4">
                     <Carousel className="w-full">
                        <CarouselContent>
                            {(product.imageUrls && product.imageUrls.length > 0) ? (
                                product.imageUrls.map((url, index) => (
                                    <CarouselItem key={index}>
                                        <div className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                                            <Image
                                                src={url}
                                                alt={`${product.name} - image ${index + 1}`}
                                                width={800}
                                                height={800}
                                                className="w-full h-full object-contain"
                                                priority={index === 0}
                                            />
                                        </div>
                                    </CarouselItem>
                                ))
                            ) : (
                                <CarouselItem>
                                    <div className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                                         <Image
                                            src={`https://picsum.photos/seed/${product.id}/800`}
                                            alt={product.name}
                                            width={800}
                                            height={800}
                                            className="w-full h-full object-contain"
                                            priority
                                        />
                                    </div>
                                </CarouselItem>
                            )}
                        </CarouselContent>
                        <CarouselPrevious className="hidden sm:flex" />
                        <CarouselNext className="hidden sm:flex" />
                    </Carousel>
                </div>

                {/* Product Info & Order Form */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                        <h1 className="text-3xl lg:text-4xl font-bold">{product.name}</h1>
                    </div>
                    <p className="text-2xl font-bold text-primary mt-2">{product.price.toFixed(2)} ج.م</p>
                    
                    <Separator />
                    
                    <div className="prose prose-invert max-w-none text-muted-foreground">
                       <p className="whitespace-pre-wrap">{product.description}</p>
                    </div>

                    <ProductOrderForm product={product} refId={refId} />
                </div>
            </div>
        </div>
    );
}

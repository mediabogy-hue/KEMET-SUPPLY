
import { notFound } from 'next/navigation';
import { getAdminDb } from '@/firebase/server-init';
import type { Product } from '@/lib/types';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductOrderForm } from './_components/product-order-form';
import { Separator } from '@/components/ui/separator';

type ProductPageProps = {
    params: { productId: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

async function getProduct(productId: string): Promise<Product | null> {
    const adminDb = getAdminDb();
    if (!adminDb) {
        console.error("Admin DB not available");
        return null;
    }
    const productRef = adminDb.collection('products').doc(productId);
    const docSnap = await productRef.get();

    if (!docSnap.exists) {
        return null;
    }
    // Convert Firestore Timestamp to serializable format (string)
    const data = docSnap.data() as any;
    const productData: Product = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
    };
    return productData;
}


export default async function PublicProductPage({ params, searchParams }: ProductPageProps) {
    const { productId } = params;
    const refId = typeof searchParams.ref === 'string' ? searchParams.ref : null;

    const product = await getProduct(productId);

    if (!product || !product.isAvailable) {
        notFound();
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
                {/* Image Gallery */}
                <div className="space-y-4 sticky top-4">
                     <Carousel className="w-full">
                        <CarouselContent>
                            {product.imageUrls.map((url, index) => (
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
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
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

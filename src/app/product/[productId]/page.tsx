import { Suspense } from 'react';
import { ProductPageLoader } from './_components/product-page-loader';
import { ProductPageSkeleton } from './_components/product-page-skeleton';

export default function PublicProductPage({ 
    params,
    searchParams 
}: { 
    params: { productId: string };
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const { productId } = params;
    const refId = typeof searchParams.ref === 'string' ? searchParams.ref : null;
    
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            <Suspense fallback={<ProductPageSkeleton />}>
                <ProductPageLoader productId={productId} refId={refId} />
            </Suspense>
        </div>
    );
}

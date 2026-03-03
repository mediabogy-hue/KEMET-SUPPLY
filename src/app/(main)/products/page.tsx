
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { CategoryBrowser } from './_components/category-browser';
import { ProductCard } from './_components/product-card';
import { useToast } from '@/hooks/use-toast';

export default function ProductsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Use a simpler, more robust query. Filtering will happen on the client.
    const productsQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'products'), orderBy('createdAt', 'desc')) : null),
        [firestore]
    );
    const { data: products, isLoading: productsLoading, error } = useCollection<Product>(productsQuery);
    
    // Display error toast if fetching fails
    useEffect(() => {
        if (error) {
            toast({
                variant: 'destructive',
                title: 'فشل تحميل المنتجات',
                description: 'حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.',
            });
            console.error("Product query error:", error);
        }
    }, [error, toast]);


    const filteredAndSortedProducts = useMemo(() => {
        if (!products) return [];
        
        // Filter on the client-side for maximum reliability.
        return products
            .filter(p => p.approvalStatus === 'Approved' && p.isAvailable === true)
            .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
            .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    }, [products, searchTerm, selectedCategory]);

    return (
        <div className="space-y-6">
            <CategoryBrowser 
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
            />
            
            <div className="relative mx-auto w-full max-w-lg">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input 
                    placeholder="ابحث عن منتج محدد..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 text-base h-12 rounded-full shadow-md"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productsLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-lg" />)
                ) : filteredAndSortedProducts.length > 0 ? (
                    filteredAndSortedProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-16">
                        <h3 className="text-lg font-semibold">لا توجد منتجات</h3>
                        <p className="text-muted-foreground mt-2">لا توجد منتجات متاحة للعرض حاليًا. قد تكون قيد المراجعة أو غير مضافة بعد.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

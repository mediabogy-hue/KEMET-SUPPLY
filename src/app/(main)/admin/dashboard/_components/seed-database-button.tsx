'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, DatabaseZap } from 'lucide-react';
import type { Order, Product, ProductCategory, UserProfile } from '@/lib/types';

const dropshippers: Omit<UserProfile, 'role' | 'createdAt' | 'updatedAt' | 'isActive'>[] = [
    { id: 'dropshipper-ahmad-ali', firstName: 'أحمد', lastName: 'علي', email: 'ahmad.ali@example.com' },
    { id: 'dropshipper-fatima-mohamed', firstName: 'فاطمة', lastName: 'محمد', email: 'fatima.mohamed@example.com' },
    { id: 'dropshipper-youssef-hassan', firstName: 'يوسف', lastName: 'حسن', email: 'youssef.hassan@example.com' },
];

const categories: Omit<ProductCategory, 'createdAt' | 'updatedAt'>[] = [
    { id: 'electrical-appliances-cat', name: 'أدوات كهربائية', imageUrl: 'https://picsum.photos/seed/electrical-appliances/200', dataAiHint: 'electrical appliances', isAvailable: true },
    { id: 'hand-tools-cat', name: 'أدوات يدوية', imageUrl: 'https://picsum.photos/seed/hand-tools/200', dataAiHint: 'hand tools', isAvailable: true },
    { id: 'decor-cat', name: 'ديكور', imageUrl: 'https://picsum.photos/seed/decor/200', dataAiHint: 'home decor', isAvailable: true },
    { id: 'small-appliances-cat', name: 'الأجهزة الصغيرة', imageUrl: 'https://picsum.photos/seed/small-appliances/200', dataAiHint: 'small appliances', isAvailable: true },
    { id: 'textiles-cat', name: 'منسوجات', imageUrl: 'https://picsum.photos/seed/textiles/200', dataAiHint: 'textiles', isAvailable: true },
    { id: 'smart-phone-cat', name: 'هواتف ذكية', imageUrl: 'https://picsum.photos/seed/smart-phone/200', dataAiHint: 'smart phone', isAvailable: true },
    { id: 'furniture-cat', name: 'أثاث', imageUrl: 'https://picsum.photos/seed/furniture/200', dataAiHint: 'elegant furniture', isAvailable: true },
    { id: 'shaving-machines-cat', name: 'ماكينات حلاقة', imageUrl: 'https://picsum.photos/seed/shaving/200', dataAiHint: 'shaving machines', isAvailable: true },
    { id: 'kitchen-tools-cat', name: 'أدوات المطبخ', imageUrl: 'https://picsum.photos/seed/kitchen-tools/200', dataAiHint: 'kitchen tools', isAvailable: true },
    { id: 'camping-cat', name: 'تخييم', imageUrl: 'https://picsum.photos/seed/camping/200', dataAiHint: 'camping gear', isAvailable: true },
    { id: 'kids-accessories-cat', name: 'أكسسوارات أطفال', imageUrl: 'https://picsum.photos/seed/kids-accessories/200', dataAiHint: 'kids accessories', isAvailable: true },
    { id: 'toys-games-cat', name: 'ألعاب', imageUrl: 'https://picsum.photos/seed/toys-games/200', dataAiHint: 'toys games', isAvailable: true },
    { id: 'mobile-accessories-cat', name: 'اكسسوارات الموبايل', imageUrl: 'https://picsum.photos/seed/mobile-accessories/200', dataAiHint: 'mobile accessories', isAvailable: true },
    { id: 'garden-essentials-cat', name: 'مستلزمات الحدائق', imageUrl: 'https://picsum.photos/seed/garden-essentials/200', dataAiHint: 'garden essentials', isAvailable: true },
    { id: 'gifts-cat', name: 'هدايا', imageUrl: 'https://picsum.photos/seed/gifts/200', dataAiHint: 'gifts', isAvailable: true },
    { id: 'kitchen-accessories-cat', name: 'اكسسوارات المطبخ', imageUrl: 'https://picsum.photos/seed/kitchen-accessories/200', dataAiHint: 'kitchen accessories', isAvailable: true },
    { id: 'home-heating-cat', name: 'سخانات', imageUrl: 'https://picsum.photos/seed/home-heating/200', dataAiHint: 'home heating', isAvailable: true },
    { id: 'cleaning-essentials-cat', name: 'منتجات التنظيف', imageUrl: 'https://picsum.photos/seed/cleaning-essentials/200', dataAiHint: 'cleaning essentials', isAvailable: true },
    { id: 'beauty-health-cat', name: 'صحة وجمال', imageUrl: 'https://picsum.photos/seed/beauty-health/200', dataAiHint: 'beauty health', isAvailable: true },
];

const products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { name: 'سماعة رأس لاسلكية', description: 'صوت نقي وبطارية تدوم طويلاً', category: 'أدوات كهربائية', price: 750, commission: 80, stockQuantity: 50, isAvailable: true, approvalStatus: 'Approved', imageUrls: ['https://picsum.photos/seed/headphones/600'] },
    { name: 'تيشيرت قطني أسود', description: 'تيشيرت مريح وعالي الجودة', category: 'منسوجات', price: 300, commission: 40, stockQuantity: 120, isAvailable: true, approvalStatus: 'Approved', imageUrls: ['https://picsum.photos/seed/tshirt/600'] },
    { name: 'خلاط كهربائي قوي', description: 'للعصائر والمشروبات الباردة', category: 'أدوات المطبخ', price: 1200, commission: 150, stockQuantity: 30, isAvailable: true, approvalStatus: 'Approved', imageUrls: ['https://picsum.photos/seed/blender/600'] },
    { name: 'ساعة ذكية رياضية', description: 'تتبع نشاطك اليومي ونبضات القلب', category: 'هواتف ذكية', price: 1500, commission: 200, stockQuantity: 40, isAvailable: true, approvalStatus: 'Approved', imageUrls: ['https://picsum.photos/seed/smartwatch/600'] },
    { name: 'بنطلون جينز أزرق', description: 'تصميم عصري ومناسب لجميع الأوقات', category: 'منسوجات', price: 550, commission: 60, stockQuantity: 80, isAvailable: true, approvalStatus: 'Approved', imageUrls: ['https://picsum.photos/seed/jeans/600'] },
];

export function SeedDatabaseButton() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSeed = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Firestore is not available.' });
            return;
        }

        setIsLoading(true);
        toast({ title: 'بدء عملية ملء البيانات...', description: 'قد يستغرق هذا بضع ثوانٍ.' });

        try {
            const batch = writeBatch(firestore);

            // 1. Seed Users (Dropshippers) and their Wallets
            dropshippers.forEach(user => {
                const userRef = doc(firestore, 'users', user.id);
                batch.set(userRef, {
                    ...user,
                    role: 'Dropshipper',
                    isActive: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });

                const walletRef = doc(firestore, 'wallets', user.id);
                batch.set(walletRef, {
                    id: user.id,
                    availableBalance: 0,
                    pendingBalance: 0,
                    pendingWithdrawals: 0,
                    totalWithdrawn: 0,
                    updatedAt: serverTimestamp(),
                });
            });
            
            // 2. Seed Categories
            categories.forEach(category => {
                const categoryRef = doc(firestore, 'productCategories', category.id);
                batch.set(categoryRef, { ...category, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            });

            // 3. Seed Products
            products.forEach(product => {
                const productId = doc(collection(firestore, 'id_generator')).id;
                const productRef = doc(firestore, 'products', productId);
                const productData: any = { ...product, id: productId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
                batch.set(productRef, productData);
            });

            // 4. Seed Orders
            const customerNames = ['خالد إبراهيم', 'نورة عبدالله', 'سالم القحطاني', 'مريم الغامدي', 'عمر الزهراني'];
            const cities = ['القاهرة', 'الجيزة', 'الإسكندرية'];
            const statuses: Order['status'][] = ['Delivered', 'Shipped', 'Pending', 'Confirmed', 'Returned', 'Canceled'];
            const allProductIds = products.map((p, i) => `product-seed-${i}`); // Assume we need stable IDs for orders

            for (let i = 0; i < 25; i++) {
                const orderId = doc(collection(firestore, 'id_generator')).id;
                const orderRef = doc(firestore, 'orders', orderId);
                const randomProduct = products[i % products.length];
                const randomDropshipper = dropshippers[i % dropshippers.length];
                const quantity = Math.floor(Math.random() * 3) + 1;
                const orderDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);

                const orderData: Partial<Order> = {
                    id: orderId,
                    dropshipperId: randomDropshipper.id,
                    dropshipperName: `${randomDropshipper.firstName} ${randomDropshipper.lastName}`,
                    customerName: customerNames[i % customerNames.length],
                    customerPhone: `010${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
                    customerAddress: `123 شارع المثال، حي الأمل`,
                    customerCity: cities[i % cities.length],
                    customerPaymentMethod: 'Cash on Delivery',
                    productId: allProductIds[i % allProductIds.length],
                    productName: randomProduct.name,
                    quantity: quantity,
                    unitPrice: randomProduct.price,
                    totalAmount: randomProduct.price * quantity,
                    unitCommission: randomProduct.commission,
                    totalCommission: randomProduct.commission * quantity,
                    status: i % 4 === 0 ? 'Pending' : statuses[i % statuses.length], // Ensure some are pending
                    createdAt: orderDate as any,
                    updatedAt: orderDate as any,
                    platformFee: 0,
                };
                
                batch.set(orderRef, orderData);
            }
            
            await batch.commit();

            toast({ title: '🎉 تم ملء قاعدة البيانات بنجاح!', description: 'سيتم تحديث الصفحة تلقائياً لعرض البيانات.' });
            
            // Reload the page to reflect the new data
            setTimeout(() => window.location.reload(), 2000);

        } catch (error: any) {
            console.error("Database seeding failed:", error);
            toast({ variant: 'destructive', title: 'فشل ملء البيانات', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button onClick={handleSeed} disabled={isLoading} size="lg">
            {isLoading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="me-2" />}
            {isLoading ? 'جاري ملء البيانات...' : 'ملء قاعدة البيانات ببيانات تجريبية'}
        </Button>
    );
}

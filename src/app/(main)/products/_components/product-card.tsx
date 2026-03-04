
'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/auth/SessionProvider';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { Copy } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { user } = useSession();
    const { toast } = useToast();

    const handleCopyLink = () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'الرجاء تسجيل الدخول أولاً' });
            return;
        }
        
        const domain = window.location.origin;
        const affiliateLink = `${domain}/product/${product.id}?ref=${user.uid}`;

        const copyToClipboard = (text: string) => {
             if (navigator.clipboard && window.isSecureContext) {
                return navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.top = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                return new Promise<void>((res, rej) => {
                    document.execCommand('copy') ? res() : rej();
                }).finally(() => {
                    document.body.removeChild(textArea);
                });
            }
        };

        copyToClipboard(affiliateLink).then(() => {
            toast({ title: "تم نسخ رابط التسويق بنجاح!" });
        }).catch(() => {
            toast({ variant: "destructive", title: "فشل نسخ الرابط" });
        });
    };

    const isSellable = product.approvalStatus === 'Approved' && product.isAvailable;

    return (
        <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
            <Link href={`/product/${product.id}${user ? `?ref=${user.uid}` : ''}`} className="block">
                 <CardContent className="p-0 aspect-square relative">
                     <Image
                        src={product.imageUrls?.[0] || `https://picsum.photos/seed/${product.id}/600`}
                        alt={product.name}
                        width={600}
                        height={600}
                        className="w-full h-full object-contain transition-transform group-hover:scale-105"
                    />
                    {!isSellable && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="destructive" className="text-base py-1 px-3">
                                {product.approvalStatus !== 'Approved' ? 'قيد المراجعة' : 'غير متوفر'}
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Link>
            <CardHeader className="flex-grow">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>{product.category}</CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col items-start gap-3 pt-0">
                <div className="w-full flex justify-between items-baseline font-bold">
                    <span className="text-muted-foreground">السعر:</span>
                    <span className="text-xl text-primary">{product.price.toFixed(2)} ج.م</span>
                </div>
                 <div className="w-full flex justify-between items-baseline font-semibold">
                    <span className="text-muted-foreground">العمولة:</span>
                    <span className="text-lg text-green-600">{product.commission.toFixed(2)} ج.م</span>
                </div>
                <Button className="w-full mt-2" onClick={handleCopyLink} disabled={!isSellable}>
                    <Copy className="me-2"/>
                    {isSellable ? 'نسخ رابط التسويق' : 'لا يمكن التسويق'}
                </Button>
            </CardFooter>
        </Card>
    );
}

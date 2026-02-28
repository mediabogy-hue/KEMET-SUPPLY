"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useStorage, useCollection, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp, collection, query, orderBy, writeBatch } from "firebase/firestore";
import type { Product, ProductCategory } from "@/lib/types";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { useSession } from "@/auth/SessionProvider";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { compressImage } from "@/lib/utils";
import Image from "next/image";


interface EditProductDialogProps {
    product: Product | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function EditProductDialog({ product, isOpen, onOpenChange }: EditProductDialogProps) {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user, profile } = useSession();
  const { toast } = useToast();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Product state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // File state
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  
  // Control state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (product) {
        setName(product.name || "");
        setCategory(product.category || "");
        setDescription(product.description || "");
        setPrice(product.price?.toString() || "");
        setCommission(product.commission?.toString() || "");
        setStockQuantity(product.stockQuantity?.toString() || "");
        setImageUrls(product.imageUrls || []);
        setVideoUrl(product.videoUrl || null);
        setPurchaseUrl(product.purchaseUrl || "");
        setIsAvailable(product.isAvailable);

        // Reset file inputs when a new product is loaded
        setNewImageFiles([]);
        setNewVideoFile(null);
        setUploadProgress(0);

    }
  }, [product, isOpen]);

  const handleRemoveImage = (urlToRemove: string) => {
    setImageUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleUpdateProduct = async () => {
    if (!product || !firestore || !profile || !storage) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
        let finalImageUrls = [...imageUrls];
        let finalVideoUrl = videoUrl;

        const totalFiles = newImageFiles.length + (newVideoFile ? 1 : 0);
        let filesUploaded = 0;

        if (newImageFiles.length > 0) {
            const imageUploadPromises = newImageFiles.map(async (file) => {
                const compressedBlob = await compressImage(file, { maxWidth: 1024, quality: 0.8 });
                const fileRef = storageRef(storage, `products/${product.id}/${Date.now()}-${file.name}`);
                const uploadTask = uploadBytesResumable(fileRef, compressedBlob);

                return new Promise<string>((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {},
                        (error) => reject(error),
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            filesUploaded++;
                            setUploadProgress((filesUploaded / totalFiles) * 100);
                            resolve(downloadURL);
                        }
                    );
                });
            });
            const newUrls = await Promise.all(imageUploadPromises);
            finalImageUrls.push(...newUrls);
        }

        if (newVideoFile) {
             const fileRef = storageRef(storage, `products/${product.id}/${Date.now()}-${newVideoFile.name}`);
             const uploadTask = uploadBytesResumable(fileRef, newVideoFile);
             finalVideoUrl = await new Promise<string>((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {},
                    (error) => reject(error),
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        filesUploaded++;
                        setUploadProgress((filesUploaded / totalFiles) * 100);
                        resolve(downloadURL);
                    });
             });
        }

        const productDocRef = doc(firestore, "products", product.id);
        
        const updatedData: any = {
          name,
          category,
          description,
          price: parseFloat(price) || 0,
          commission: parseFloat(commission) || 0,
          stockQuantity: parseInt(stockQuantity, 10) || 0,
          isAvailable,
          purchaseUrl,
          imageUrls: finalImageUrls,
          videoUrl: finalVideoUrl,
          updatedAt: serverTimestamp(),
        };

        await updateDoc(productDocRef, updatedData);
        onOpenChange(false);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "فشل تحديث المنتج",
            description: error.message || "قد لا تملك الصلاحيات الكافية.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if(isSubmitting) return;
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تعديل المنتج</DialogTitle>
          <DialogDescription>
            تحديث تفاصيل المنتج. ستنعكس التغييرات على جميع المسوقين.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-2 space-y-4">
            <div className="grid gap-4 py-4">
               <div className="space-y-2">
                <Label htmlFor="edit-name">الاسم</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">الفئة</Label>
                <Input id="edit-category" placeholder="اكتب اسم فئة جديدة أو موجودة" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isSubmitting}/>
              </div>
               <div className="space-y-2">
                <Label htmlFor="edit-description">الوصف</Label>
                <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} disabled={isSubmitting}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-price">السعر (ج.م)</Label>
                    <Input id="edit-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isSubmitting}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-commission">العمولة (ج.م)</Label>
                    <Input id="edit-commission" type="number" value={commission} onChange={(e) => setCommission(e.target.value)} disabled={isSubmitting}/>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stockQuantity">الكمية المتاحة</Label>
                <Input id="edit-stockQuantity" type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} disabled={isSubmitting}/>
              </div>

               <div className="space-y-2">
                    <Label>صور المنتج</Label>
                    {imageUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {imageUrls.map((url, i) => (
                                <div key={i} className="relative aspect-square group">
                                    <Image src={url} alt="preview" fill className="rounded-md object-cover"/>
                                    <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveImage(url)} disabled={isSubmitting}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()} disabled={isSubmitting}>
                        <Upload className="me-2"/> إضافة صور جديدة
                    </Button>
                    <Input type="file" ref={imageInputRef} multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && setNewImageFiles(Array.from(e.target.files))} />
                    {newImageFiles.length > 0 && <p className="text-sm text-muted-foreground">تم اختيار {newImageFiles.length} صور جديدة للرفع.</p>}
               </div>

              <div className="space-y-2">
                <Label>فيديو المنتج</Label>
                {videoUrl && <p className="text-xs text-muted-foreground truncate">الفيديو الحالي: {videoUrl}</p>}
                 <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={isSubmitting} className="w-full">
                    <Upload className="me-2"/> {videoUrl ? 'تغيير الفيديو' : 'رفع فيديو'}
                </Button>
                <Input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={(e) => e.target.files && setNewVideoFile(e.target.files[0])}/>
                {newVideoFile && <p className="text-sm text-muted-foreground">فيديو جديد مختار: {newVideoFile.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-purchaseUrl">رابط الشراء</Label>
                <Input id="edit-purchaseUrl" placeholder="https://supplier.com/product (اختياري)" value={purchaseUrl} onChange={(e) => setPurchaseUrl(e.target.value)} disabled={isSubmitting}/>
              </div>
               <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                 <div className="space-y-0.5">
                    <Label htmlFor="edit-isAvailable">الحالة</Label>
                    <p className="text-xs text-muted-foreground">إلغاء التفعيل سيخفي المنتج من المتجر.</p>
                </div>
                <Switch id="edit-isAvailable" checked={isAvailable} onCheckedChange={setIsAvailable} disabled={isSubmitting}/>
              </div>

               {isSubmitting && (
                <div className="space-y-2">
                    <Label>جاري رفع الملفات الجديدة...</Label>
                    <Progress value={uploadProgress} />
                </div>
              )}
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>إلغاء</Button>
          <Button type="button" onClick={handleUpdateProduct} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

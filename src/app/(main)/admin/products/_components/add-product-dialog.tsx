'use client';

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useStorage } from "@/firebase";
import { useSession } from "@/auth/SessionProvider";
import { collection, doc, setDoc, serverTimestamp, query, orderBy, writeBatch } from "firebase/firestore";
import type { Product, ProductCategory } from "@/lib/types";
import { Loader2, PlusCircle, Globe, Sparkles, Upload, Video, Image as ImageIcon } from "lucide-react";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { compressImage } from "@/lib/utils";
import Image from "next/image";

export function AddProductDialog() {
  const { user, profile } = useSession();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, "productCategories"), orderBy("name", "asc")) : null, [firestore, user]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<ProductCategory>(categoriesQuery);

  // File Inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Product fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [commission, setCommission] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  
  // File State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  // Control state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetForm = () => {
      setName("");
      setCategory("");
      setDescription("");
      setPrice("");
      setCommission("");
      setStockQuantity("");
      setPurchaseUrl("");
      setIsAvailable(true);
      setImageFiles([]);
      setVideoFile(null);
      setUploadProgress(0);
  };

  const handleSaveProduct = async () => {
    const priceNumber = parseFloat(price);
    const commissionNumber = parseFloat(commission);
    const quantityNumber = parseInt(stockQuantity, 10);

    if (!name || !description || isNaN(priceNumber) || isNaN(quantityNumber) || isNaN(commissionNumber) || !category) {
      toast({ variant: "destructive", title: "خطأ", description: "الرجاء ملء جميع الحقول المطلوبة بقيم صحيحة." });
      return;
    }
     if (imageFiles.length === 0) {
      toast({ variant: "destructive", title: "خطأ", description: "يجب رفع صورة واحدة على الأقل للمنتج." });
      return;
    }
    
    if (!firestore || !user || !profile || !storage) {
        toast({ variant: "destructive", title: "خطأ", description: "خدمات Firebase غير متاحة." });
        return;
    }

    setIsSubmitting(true);
    
    try {
        const batch = writeBatch(firestore);
        const productId = doc(collection(firestore, "id_generator")).id;

        // --- File Upload Logic ---
        let uploadedImageUrls: string[] = [];
        let uploadedVideoUrl: string | undefined = undefined;

        const totalFiles = imageFiles.length + (videoFile ? 1 : 0);
        let filesUploaded = 0;

        // Upload Images
        const imageUploadPromises = imageFiles.map(async (file) => {
            const compressedBlob = await compressImage(file, { maxWidth: 1024, quality: 0.8 });
            const fileRef = storageRef(storage, `products/${productId}/${Date.now()}-${file.name}`);
            const uploadTask = uploadBytesResumable(fileRef, compressedBlob);

            return new Promise<string>((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        // This progress is per file. A more complex UI could show individual progress.
                    },
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
        
        uploadedImageUrls = await Promise.all(imageUploadPromises);

        // Upload Video
        if (videoFile) {
             const fileRef = storageRef(storage, `products/${productId}/${Date.now()}-${videoFile.name}`);
             const uploadTask = uploadBytesResumable(fileRef, videoFile);
             uploadedVideoUrl = await new Promise<string>((resolve, reject) => {
                uploadTask.on('state_changed', 
                    (snapshot) => { /* Per-file progress */ }, 
                    (error) => reject(error), 
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        filesUploaded++;
                        setUploadProgress((filesUploaded / totalFiles) * 100);
                        resolve(downloadURL);
                    });
             });
        }
        // --- End File Upload ---
        
        const productDocRef = doc(firestore, "products", productId);

        const newProductData: Omit<Product, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
          id: productId,
          name: name,
          category: category,
          description: description,
          price: priceNumber,
          commission: commissionNumber,
          stockQuantity: quantityNumber,
          isAvailable: isAvailable,
          imageUrls: uploadedImageUrls,
          videoUrl: uploadedVideoUrl,
          purchaseUrl: purchaseUrl,
          merchantId: profile?.role === 'Merchant' ? user.uid : null,
          merchantName: profile?.role === 'Merchant' ? `${profile.firstName} ${profile.lastName}`.trim() : 'Kemet Supply',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        batch.set(productDocRef, newProductData);
        await batch.commit();

        setIsOpen(false);
      }
      catch (error: any) {
        toast({
          variant: "destructive",
          title: "فشل إضافة المنتج",
          description: error.message || "قد لا تملك الصلاحيات الكافية.",
        });
      }
      finally {
          setIsSubmitting(false);
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (isSubmitting) return;
        setIsOpen(open);
        if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle />
          إضافة منتج جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة منتج جديد</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل المنتج الجديد والملفات المطلوبة.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[65vh] overflow-y-auto px-1 space-y-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المنتج</Label>
                <Input id="name" placeholder="مثال: سماعة لاسلكية" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">الفئة</Label>
                <Input id="category" placeholder="اكتب اسم فئة جديدة أو موجودة" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isSubmitting}/>
               </div>
               <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea id="description" placeholder="وصف مختصر ومفيد للمنتج" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} disabled={isSubmitting}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">السعر (ج.م)</Label>
                    <Input id="price" type="number" placeholder="99.99" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isSubmitting}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission">العمولة (ج.م)</Label>
                    <Input id="commission" type="number" placeholder="10.00" value={commission} onChange={(e) => setCommission(e.target.value)} disabled={isSubmitting}/>
                  </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="stockQuantity">الكمية المتاحة</Label>
                <Input id="stockQuantity" type="number" placeholder="100" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} disabled={isSubmitting}/>
              </div>

               <div className="space-y-2">
                    <Label>ملفات المنتج</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()} disabled={isSubmitting}>
                            <Upload className="me-2"/> رفع صور ({imageFiles.length})
                        </Button>
                         <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()} disabled={isSubmitting}>
                            <Video className="me-2"/> {videoFile ? "تغيير الفيديو" : "رفع فيديو"}
                        </Button>
                    </div>
                    <Input type="file" ref={imageInputRef} multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && setImageFiles(Array.from(e.target.files))} />
                    <Input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={(e) => e.target.files && setVideoFile(e.target.files[0])}/>
                    
                    {imageFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {imageFiles.map((file, i) => (
                                <div key={i} className="relative aspect-square">
                                    <Image src={URL.createObjectURL(file)} alt="preview" fill className="rounded-md object-cover"/>
                                </div>
                            ))}
                        </div>
                    )}
                    {videoFile && <p className="text-sm text-muted-foreground mt-1">الفيديو المختار: {videoFile.name}</p>}
               </div>
              
              <div className="space-y-2">
                <Label htmlFor="purchaseUrl">رابط الشراء من المورد (اختياري)</Label>
                <Input id="purchaseUrl" placeholder="https://supplier.com/product" value={purchaseUrl} onChange={(e) => setPurchaseUrl(e.target.value)} disabled={isSubmitting}/>
              </div>
               <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                 <div className="space-y-0.5">
                    <Label htmlFor="isAvailable">الحالة</Label>
                    <p className="text-xs text-muted-foreground">إلغاء التفعيل سيخفي المنتج من المتجر.</p>
                </div>
                <Switch id="isAvailable" checked={isAvailable} onCheckedChange={setIsAvailable} disabled={isSubmitting}/>
              </div>

              {isSubmitting && (
                <div className="space-y-2">
                    <Label>جاري رفع الملفات...</Label>
                    <Progress value={uploadProgress} />
                </div>
              )}
            </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>إلغاء</Button>
          </DialogClose>
          <Button type="button" onClick={handleSaveProduct} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ المنتج'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

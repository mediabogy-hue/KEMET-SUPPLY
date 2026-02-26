
"use client";

import { Badge } from "@/components/ui/badge";
import type { MerchantInquiry } from "@/lib/types";

type InquiryStatus = MerchantInquiry['status'];

const statusConfig: Record<InquiryStatus, { text: string; className: string }> = {
    'New': { text: 'جديد', className: 'bg-blue-500 hover:bg-blue-500/80' },
    'Contacted': { text: 'تم التواصل', className: 'bg-yellow-500 hover:bg-yellow-500/80 text-black' },
    'Approved': { text: 'مقبول', className: 'bg-green-500 hover:bg-green-500/80' },
    'Rejected': { text: 'مرفوض', className: 'bg-red-500 hover:bg-red-500/80' },
};

export function InquiryStatusBadge({ status }: { status: InquiryStatus | string }) {
    const config = statusConfig[status as InquiryStatus] || { text: status, className: 'bg-gray-400' };
    return <Badge className={config.className}>{config.text}</Badge>;
}

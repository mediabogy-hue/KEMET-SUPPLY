"use client";

import { Badge } from "@/components/ui/badge";
import type { WithdrawalRequest } from "@/lib/types";

const statusConfig: Record<WithdrawalRequest['status'], { text: string; className: string }> = {
    'Pending': { text: 'قيد المراجعة', className: 'bg-yellow-500 hover:bg-yellow-500/80' },
    'Completed': { text: 'مدفوع', className: 'bg-green-500 hover:bg-green-500/80' },
    'Rejected': { text: 'مرفوض', className: 'bg-red-500 hover:bg-red-500/80' },
};

export function WithdrawalStatusBadge({ status }: { status: WithdrawalRequest['status'] }) {
    const config = statusConfig[status] || { text: status, className: 'bg-gray-400' };
    return (
        <Badge className={config.className}>{config.text}</Badge>
    );
}

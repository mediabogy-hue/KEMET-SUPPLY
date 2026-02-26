
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { MerchantInquiry } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, ArrowUpDown, Check, X, PhoneOutgoing } from "lucide-react"
import { format } from 'date-fns'
import { InquiryStatusBadge } from "./inquiry-status-badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


export const getColumns = (
    onStatusUpdate: (inquiry: MerchantInquiry, status: MerchantInquiry['status']) => void,
): ColumnDef<MerchantInquiry>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "الاسم",
    cell: ({ row }) => {
        const inquiry = row.original;
        return (
            <div className="flex flex-col">
                <span className="font-medium">{inquiry.name}</span>
                <span className="text-muted-foreground text-xs">{inquiry.companyName}</span>
            </div>
        )
    }
  },
  {
    accessorKey: "email",
    header: "معلومات التواصل",
    cell: ({ row }) => {
        const inquiry = row.original;
        return (
            <div className="flex flex-col gap-1 text-xs">
                <span>{inquiry.email}</span>
                <span className="font-mono">{inquiry.phone}</span>
            </div>
        )
    }
  },
  {
    accessorKey: "message",
    header: "الرسالة",
    cell: ({ row }) => {
        const message = row.original.message;
        const truncated = message.length > 50 ? message.substring(0, 50) + "..." : message;
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <p className="max-w-xs cursor-help">{truncated}</p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                        <p className="whitespace-pre-wrap">{message}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => {
        return <InquiryStatusBadge status={row.original.status} />
    }
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          التاريخ
          <ArrowUpDown className="ms-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const date = row.original.createdAt?.toDate();
        return <div className="text-center text-xs">{date ? format(date, 'yyyy/MM/dd') : 'N/A'}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const inquiry = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>تغيير الحالة</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onStatusUpdate(inquiry, 'Contacted')}><PhoneOutgoing className="me-2"/> تم التواصل</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusUpdate(inquiry, 'Approved')}><Check className="me-2 text-green-500"/> قبول</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onStatusUpdate(inquiry, 'Rejected')}><X className="me-2"/> رفض</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

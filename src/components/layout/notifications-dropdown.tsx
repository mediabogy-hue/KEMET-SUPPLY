
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Bell, DollarSign, MessageSquare, Loader2, Package, Gift } from "lucide-react"
import { useSession } from "@/auth/SessionProvider";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, writeBatch, doc } from "firebase/firestore";
import type { Notification } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState, useMemo } from "react";
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

const NOTIFICATION_LIMIT = 10;

const notificationIcons: Record<Notification['type'], React.ReactElement> = {
    order_status_update: <Package className="h-4 w-4 text-blue-500" />,
    payment_verified: <DollarSign className="h-4 w-4 text-green-500" />,
    new_bonus: <Gift className="h-4 w-4 text-amber-500" />,
    new_message: <MessageSquare className="h-4 w-4 text-orange-500" />,
    general_announcement: <Bell className="h-4 w-4 text-primary" />,
};


export function NotificationsDropdown() {
    const { user } = useSession();
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = useState(false);

    const notificationsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, `users/${user.uid}/notifications`), 
            orderBy('createdAt', 'desc'),
            limit(NOTIFICATION_LIMIT)
        );
    }, [firestore, user]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
    
    const unreadCount = useMemo(() => {
        return notifications?.filter(n => !n.isRead).length || 0;
    }, [notifications]);

    const handleMarkAllAsRead = async () => {
        if (!firestore || !user || !notifications || unreadCount === 0) return;

        const batch = writeBatch(firestore);
        notifications.forEach(notification => {
            if (!notification.isRead) {
                const notifRef = doc(firestore, `users/${user.uid}/notifications`, notification.id);
                batch.update(notifRef, { isRead: true });
            }
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open && unreadCount > 0) {
            // Mark as read after a short delay to allow user to see them
            setTimeout(() => {
                handleMarkAllAsRead();
            }, 3000);
        }
    }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
            <span>الإشعارات</span>
            {unreadCount > 0 && <Badge variant="secondary">{unreadCount}</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
            {isLoading && (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            )}
            {!isLoading && notifications?.length === 0 && (
                 <p className="text-center text-sm text-muted-foreground p-4">لا توجد إشعارات جديدة.</p>
            )}
            {!isLoading && notifications?.map((notification) => {
                const Wrapper = notification.link ? Link : 'div';
                return (
                    <DropdownMenuItem key={notification.id} asChild className="cursor-pointer">
                        <Wrapper href={notification.link || '#'}>
                            <div className={cn("flex items-start gap-3 p-3 w-full", !notification.isRead && "bg-accent/50")}>
                                <div className="mt-1">
                                    {notificationIcons[notification.type] || <Bell className="h-4 w-4 text-muted-foreground"/>}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium whitespace-normal">{notification.title}</p>
                                    {notification.description && <p className="text-xs text-muted-foreground whitespace-normal">{notification.description}</p>}
                                    {notification.createdAt && (
                                        <p className="text-xs text-muted-foreground/80 mt-1">
                                            {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: ar })}
                                        </p>
                                    )}
                                </div>
                                {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-1 self-center"></div>}
                            </div>
                        </Wrapper>
                    </DropdownMenuItem>
                );
            })}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center" disabled>
            عرض كل الإشعارات
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

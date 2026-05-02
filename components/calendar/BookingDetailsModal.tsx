'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import BookingModal from './BookingModal';
import { Booking } from '@/types';
import { bookingService } from '@/services/bookingService';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { lightenColor } from '@/lib/colors';
import { HEBREW_MONTHS } from '@/lib/dateUtils';
import { Clock, Calendar, StickyNote, Trash2, Pencil } from 'lucide-react';

interface Props {
  booking: Booking | null;
  onClose: () => void;
}

function formatHebDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ב${HEBREW_MONTHS[m - 1]} ${y}`;
}

export default function BookingDetailsModal({ booking, onClose }: Props) {
  const { currentUser, reloadBookings } = useApp();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!booking) return null;

  const isOwner = booking.userId === currentUser?.id;

  const handleDelete = async () => {
    if (!currentUser) return;
    setDeleting(true);
    const { error } = await bookingService.deleteBooking(booking.id, currentUser.id);
    setDeleting(false);
    if (error) { toast(error, 'error'); return; }
    toast('הבקשה נמחקה', 'info');
    await reloadBookings();
    onClose();
  };

  if (editOpen) {
    return (
      <BookingModal
        open={editOpen}
        onClose={() => { setEditOpen(false); onClose(); }}
        editBooking={booking}
      />
    );
  }

  return (
    <Modal open={!!booking} onClose={onClose} title="פרטי הבקשה" size="sm">
      <div className="p-5 flex flex-col gap-4">
        {/* User banner */}
        <div
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ backgroundColor: lightenColor(booking.userColor, 0.88) }}
        >
          <Avatar emoji={booking.userEmoji} color={booking.userColor} size="md" />
          <div>
            <p className="font-bold text-gray-900">{booking.userName}</p>
            {isOwner && (
              <span className="text-xs text-brand-600 font-medium">הבקשה שלי</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm font-medium">{formatHebDate(booking.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm font-medium">
              {booking.startTime} — {booking.endTime}
            </span>
          </div>
          {booking.note && (
            <div className="flex items-start gap-2 text-gray-700">
              <StickyNote className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span className="text-sm">{booking.note}</span>
            </div>
          )}
        </div>

        {/* Owner actions */}
        {isOwner && !confirmDelete && (
          <div className="flex gap-2 pt-1 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
              עריכה
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              מחיקה
            </Button>
          </div>
        )}

        {isOwner && confirmDelete && (
          <div className="flex flex-col gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
            <p className="text-sm font-medium text-red-700">למחוק את הבקשה הזו?</p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-gray-600"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                ביטול
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={handleDelete}
                loading={deleting}
              >
                כן, מחק
              </Button>
            </div>
          </div>
        )}

        {!isOwner && (
          <p className="text-xs text-gray-400 text-center">
            רק בעל הבקשה יכול לערוך או למחוק
          </p>
        )}
      </div>
    </Modal>
  );
}

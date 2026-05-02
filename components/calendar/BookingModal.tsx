'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Booking } from '@/types';
import { bookingService } from '@/services/bookingService';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { toDateString } from '@/lib/dateUtils';
import { timeToMinutes, cn } from '@/lib/utils';
import { AlertTriangle, Zap, Moon, Clock } from 'lucide-react';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  prefillDate?: string;
  prefillStart?: string;
  prefillEnd?: string;
  editBooking?: Booking | null;
}

function getNow() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = (Math.ceil(now.getMinutes() / 15) * 15 % 60).toString().padStart(2, '0');
  const h2 = (now.getHours() + 1).toString().padStart(2, '0');
  return {
    date: toDateString(now),
    start: `${h}:${m}`,
    end: `${h2}:${m}`,
  };
}

interface FormState {
  date: string;
  startTime: string;
  endTime: string;
  note: string;
}

interface FormErrors {
  date?: string;
  startTime?: string;
  endTime?: string;
}

export default function BookingModal({
  open, onClose, prefillDate, prefillStart, prefillEnd, editBooking,
}: BookingModalProps) {
  const { currentUser, group, bookings, reloadBookings } = useApp();
  const { toast } = useToast();

  // Use empty strings as initial state — getNow() relies on new Date() which
  // differs between server and client. The useEffect below sets the real values.
  const [form, setForm] = useState<FormState>({
    date: prefillDate ?? '',
    startTime: prefillStart ?? '',
    endTime: prefillEnd ?? '',
    note: '',
  });

  // Set defaults once on the client after mount
  useEffect(() => {
    if (prefillDate || prefillStart || prefillEnd) return; // already set via props
    const d = getNow();
    setForm(f => ({
      ...f,
      date:      f.date      || d.date,
      startTime: f.startTime || d.start,
      endTime:   f.endTime   || d.end,
    }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [hasOverlap, setHasOverlap] = useState(false);

  // Reset / pre-fill when modal opens
  useEffect(() => {
    if (!open) return;
    if (editBooking) {
      setForm({
        date: editBooking.date,
        startTime: editBooking.startTime,
        endTime: editBooking.endTime,
        note: editBooking.note ?? '',
      });
    } else {
      const d = getNow();
      setForm({
        date: prefillDate ?? d.date,
        startTime: prefillStart ?? d.start,
        endTime: prefillEnd ?? d.end,
        note: '',
      });
    }
    setErrors({});
    setHasOverlap(false);
  }, [open, prefillDate, prefillStart, prefillEnd, editBooking]);

  // Check overlaps when times change
  useEffect(() => {
    if (!form.date || !form.startTime || !form.endTime) return;
    if (form.startTime >= form.endTime) return;
    const overlap = bookings.some(b => {
      if (b.date !== form.date) return false;
      if (editBooking && b.id === editBooking.id) return false;
      if (b.userId === currentUser?.id) return false;
      return timeToMinutes(form.startTime) < timeToMinutes(b.endTime) &&
             timeToMinutes(form.endTime) > timeToMinutes(b.startTime);
    });
    setHasOverlap(overlap);
  }, [form.date, form.startTime, form.endTime, bookings, currentUser, editBooking]);

  const setQuick = (type: 'now' | 'evening') => {
    const d = new Date();
    if (type === 'now') {
      const h = d.getHours();
      const m = (Math.ceil(d.getMinutes() / 15) * 15 % 60);
      const start = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
      const end = `${(h+1).toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
      setForm(f => ({ ...f, startTime: start, endTime: end }));
    } else {
      setForm(f => ({ ...f, startTime: '19:00', endTime: '22:00' }));
    }
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.date) e.date = 'יש לבחור תאריך';
    if (!form.startTime) e.startTime = 'יש לבחור שעת התחלה';
    if (!form.endTime) e.endTime = 'יש לבחור שעת סיום';
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      e.endTime = 'שעת הסיום חייבת להיות אחרי שעת ההתחלה';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !currentUser || !group) return;
    setLoading(true);
    try {
      if (editBooking) {
        const { error } = await bookingService.updateBooking(editBooking.id, currentUser.id, {
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          note: form.note.trim() || undefined,
        });
        if (error) { toast(error, 'error'); return; }
        toast('ההזמנה עודכנה בהצלחה ✓', 'success');
      } else {
        const { error } = await bookingService.createBooking({
          groupId: group.id,
          userId: currentUser.id,
          userName: currentUser.name,
          userColor: currentUser.color,
          userEmoji: currentUser.profileEmoji,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          note: form.note.trim() || undefined,
        });
        if (error) { toast(error, 'error'); return; }
        toast('הבקשה נשמרה בהצלחה 🚗', 'success');
      }
      await reloadBookings();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const title = editBooking ? 'עריכת בקשה' : 'בקשה חדשה לרכב';

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div className="p-5 flex flex-col gap-4">

        {/* Quick options */}
        {!editBooking && (
          <div>
            <p className="text-xs text-gray-500 mb-2">אפשרויות מהירות</p>
            <div className="flex gap-2">
              <button
                onClick={() => setQuick('now')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium hover:bg-brand-100 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                עכשיו לשעה
              </button>
              <button
                onClick={() => setQuick('evening')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                <Moon className="w-3.5 h-3.5" />
                ערב (19:00–22:00)
              </button>
            </div>
          </div>
        )}

        {/* Date */}
        <Input
          label="תאריך"
          type="date"
          value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          error={errors.date}
        />

        {/* Time row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="שעת התחלה"
            type="time"
            value={form.startTime}
            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
            error={errors.startTime}
          />
          <Input
            label="שעת סיום"
            type="time"
            value={form.endTime}
            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
            error={errors.endTime}
          />
        </div>

        {/* Duration hint */}
        {form.startTime && form.endTime && form.startTime < form.endTime && (
          <div className="flex items-center gap-1.5 -mt-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">
              {(() => {
                const mins = timeToMinutes(form.endTime) - timeToMinutes(form.startTime);
                const h = Math.floor(mins / 60), m = mins % 60;
                return h > 0 ? (m > 0 ? `${h} שעות ו-${m} דקות` : `${h} שעות`) : `${m} דקות`;
              })()}
            </span>
          </div>
        )}

        {/* Overlap warning */}
        {hasOverlap && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">
              שים לב — יש חפיפה עם בקשה של משתמש אחר
            </p>
          </div>
        )}

        {/* Note */}
        <Textarea
          label="הערה (אופציונלי)"
          placeholder="לאן נוסעים? לכמה זמן?"
          value={form.note}
          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            ביטול
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            loading={loading}
          >
            {editBooking ? 'שמור שינויים' : 'שמור בקשה'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

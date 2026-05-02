'use client';

import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { CarGroup } from '@/types';

interface Props {
  group: CarGroup;
}

export default function JoinCodeDisplay({ group }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(group.joinCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    const text = `הצטרף לקבוצה "${group.carName}" ב-CarShare Family!\nקוד ההצטרפות: ${group.joinCode}`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-gradient-to-l from-brand-50 to-mint-50 border border-brand-200 rounded-2xl p-4">
      <p className="text-xs text-brand-700 font-semibold mb-2 text-right">
        קוד הצטרפות לקבוצה
      </p>
      <div className="flex items-center gap-3">
        {/* Code display */}
        <div className="flex-1 bg-white rounded-xl px-4 py-3 border border-brand-100 text-center">
          <span className="text-2xl font-black tracking-[0.25em] text-brand-700 font-mono">
            {group.joinCode}
          </span>
        </div>

        {/* Copy */}
        <button
          onClick={handleCopy}
          title="העתק קוד"
          className="flex flex-col items-center gap-1 p-2.5 bg-white rounded-xl border border-brand-100 hover:bg-brand-50 transition-colors min-w-[48px]"
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Copy className="w-5 h-5 text-brand-600" />
          )}
          <span className="text-[10px] text-gray-500 font-medium">
            {copied ? 'הועתק!' : 'העתק'}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          title="שלח לחברים"
          className="flex flex-col items-center gap-1 p-2.5 bg-white rounded-xl border border-brand-100 hover:bg-brand-50 transition-colors min-w-[48px]"
        >
          <Share2 className="w-5 h-5 text-brand-600" />
          <span className="text-[10px] text-gray-500 font-medium">שתף</span>
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-right">
        שתף את הקוד עם בני המשפחה כדי שיוכלו להצטרף
      </p>
    </div>
  );
}

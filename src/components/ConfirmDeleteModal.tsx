import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3.5 border border-rose-100 shadow-2xs">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="font-bold text-slate-900 text-base mb-1.5">{title}</h3>

          <p className="text-xs text-slate-500 leading-relaxed mb-2">
            {message}
          </p>

          {itemName && (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 mb-4 text-xs font-semibold text-slate-800 break-words">
              {itemName}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onCancel}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-rose-200 transition-all flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

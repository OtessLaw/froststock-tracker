import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', confirmClass = 'btn-danger', loading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-navy-800 text-lg mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${confirmClass} flex-1`}
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 spinner border-2 border-white/30 border-t-white" />
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

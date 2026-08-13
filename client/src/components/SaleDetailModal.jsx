import React from 'react';
import { X, Download, TrendingUp, CreditCard, Smartphone, Building2, MoreHorizontal, User, Calendar } from 'lucide-react';

const formatCurrency = (amount) =>
  `GH₵${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-GH', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const padSaleNumber = (id) => {
  const num = String(id || '').replace(/\D/g, '');
  return num ? `FS${num.padStart(5, '0')}` : String(id);
};

const PAYMENT_LABELS = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  bank: 'Bank Transfer',
  other: 'Other',
};

const PAYMENT_ICONS = {
  cash: CreditCard,
  mobile_money: Smartphone,
  bank: Building2,
  other: MoreHorizontal,
};

export default function SaleDetailModal({ sale, onClose }) {
  if (!sale) return null;

  const saleNum = sale.saleNumber || sale.receiptNumber || padSaleNumber(sale._id?.slice(-5));
  const items = sale.items || [];
  const subtotal = items.reduce((s, i) => s + (i.subtotal || i.total || i.quantity * (i.unitPrice || 0)), 0);
  const total = sale.total || sale.totalAmount || subtotal;
  const profit = sale.profit || sale.grossProfit || 0;
  const paymentMethod = sale.paymentMethod || 'cash';
  const PayIcon = PAYMENT_ICONS[paymentMethod] || CreditCard;
  const staffName = sale.staff?.name || sale.staffName || sale.createdBy?.name || '—';
  const createdAt = sale.createdAt || sale.date;

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 148, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('FROSTSTOCK TRACKER', 74, 12, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Sale Detail Report', 74, 20, { align: 'center' });

      // Reset color
      doc.setTextColor(0, 0, 0);

      // Meta section
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Sale Number:', 10, 38);
      doc.setFont('helvetica', 'normal');
      doc.text(String(saleNum), 50, 38);

      doc.setFont('helvetica', 'bold');
      doc.text('Date:', 10, 44);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(createdAt), 50, 44);

      doc.setFont('helvetica', 'bold');
      doc.text('Staff:', 10, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(staffName, 50, 50);

      doc.setFont('helvetica', 'bold');
      doc.text('Payment:', 10, 56);
      doc.setFont('helvetica', 'normal');
      doc.text(PAYMENT_LABELS[paymentMethod] || paymentMethod, 50, 56);

      // Items table
      const tableRows = items.map((item) => {
        const name = item.product?.name || item.productName || item.name || 'Item';
        const qty = item.quantity || 0;
        const unit = item.unit || item.product?.unit || 'pcs';
        const unitPrice = item.unitPrice || item.sellingPrice || item.product?.sellingPrice || 0;
        const itemSubtotal = item.subtotal || item.total || qty * unitPrice;
        return [name, `${qty} ${unit}`, formatCurrency(unitPrice), formatCurrency(itemSubtotal)];
      });

      autoTable(doc, {
        startY: 62,
        head: [['Product', 'Qty', 'Unit Price', 'Total']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [253, 242, 248] },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' },
        },
        margin: { left: 10, right: 10 },
      });

      const finalY = doc.lastAutoTable.finalY + 5;

      // Totals
      doc.setFillColor(239, 246, 255);
      doc.rect(10, finalY, 128, 26, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Subtotal:', 14, finalY + 7);
      doc.text(formatCurrency(subtotal), 138, finalY + 7, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('TOTAL:', 14, finalY + 16);
      doc.setTextColor(59, 130, 246);
      doc.text(formatCurrency(total), 138, finalY + 16, { align: 'right' });
      doc.setTextColor(0, 0, 0);

      if (profit > 0) {
        doc.setFontSize(8);
        doc.setTextColor(34, 197, 94);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gross Profit: ${formatCurrency(profit)}`, 14, finalY + 23);
        doc.setTextColor(0, 0, 0);
      }

      // Footer
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150);
      doc.text('Generated by FrostStock Tracker', 74, finalY + 35, { align: 'center' });

      doc.save(`Sale-${saleNum}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Sale Detail</h2>
            <p className="text-blue-100 text-sm font-medium">{saleNum}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Meta Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-pink-50 rounded-2xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </p>
              <p className="text-sm font-semibold text-gray-700">{formatDate(createdAt)}</p>
            </div>
            <div className="bg-pink-50 rounded-2xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Staff
              </p>
              <p className="text-sm font-semibold text-gray-700">{staffName}</p>
            </div>
          </div>

          {/* Payment badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm border border-blue-100">
              <PayIcon className="w-4 h-4" />
              {PAYMENT_LABELS[paymentMethod] || paymentMethod}
            </span>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Items</h3>
            <div className="space-y-2">
              {items.map((item, idx) => {
                const name = item.product?.name || item.productName || item.name || 'Item';
                const qty = item.quantity || 0;
                const unit = item.unit || item.product?.unit || 'pcs';
                const unitPrice = item.unitPrice || item.sellingPrice || item.product?.sellingPrice || 0;
                const itemSubtotal = item.subtotal || item.total || qty * unitPrice;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-pink-50 rounded-xl p-3 border border-pink-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {qty} {unit} × {formatCurrency(unitPrice)}
                      </p>
                    </div>
                    <p className="font-bold text-blue-600 text-sm ml-4 flex-shrink-0">{formatCurrency(itemSubtotal)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-xl text-blue-600 pt-2 border-t border-blue-200">
              <span>TOTAL</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {profit > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-200">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-500">Gross Profit</span>
                <span className="ml-auto font-bold text-green-600">{formatCurrency(profit)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 pt-3 border-t border-pink-100 flex gap-3 flex-shrink-0">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-blue-200"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="px-6 flex items-center justify-center bg-pink-50 hover:bg-pink-100 text-gray-600 font-semibold py-3 rounded-xl transition-colors text-sm border border-pink-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

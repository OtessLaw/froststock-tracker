import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle } from 'lucide-react';

const formatCurrency = (amount) =>
  `GH₵${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr) => {
  const d = new Date(dateStr || Date.now());
  return d.toLocaleString('en-GH', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const padSaleNumber = (num) => `FS${String(num || 1).padStart(5, '0')}`;

const PAYMENT_LABELS = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  bank: 'Bank Transfer',
  other: 'Other',
};

export default function ReceiptModal({ sale, onClose }) {
  const receiptRef = useRef(null);

  if (!sale) return null;

  const saleNumber = sale.saleNumber || sale.receiptNumber || sale.id || sale._id || '1';
  const items = sale.items || [];
  const subtotal = items.reduce((s, i) => s + (i.subtotal || i.total || (i.quantity * i.unitPrice) || 0), 0);
  const total = sale.total || sale.totalAmount || subtotal;
  const paymentMethod = PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod || 'Cash';
  const createdAt = sale.createdAt || sale.date || new Date().toISOString();
  const staffName = sale.staff?.name || sale.staffName || sale.createdBy?.name || 'Staff';

  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${typeof saleNumber === 'number' ? padSaleNumber(saleNumber) : saleNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; color: #111; background: #fff; padding: 16px; }
          .receipt-header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 12px; margin-bottom: 12px; }
          .receipt-header h1 { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
          .receipt-header p { font-size: 11px; color: #555; margin-top: 2px; }
          .receipt-meta { margin-bottom: 12px; }
          .receipt-meta p { font-size: 11px; color: #333; margin-bottom: 3px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .items-table th { text-align: left; font-size: 10px; text-transform: uppercase; padding: 4px 0; border-bottom: 1px dashed #ccc; }
          .items-table td { font-size: 11px; padding: 4px 0; vertical-align: top; }
          .items-table td:last-child { text-align: right; }
          .items-table th:last-child { text-align: right; }
          .total-section { border-top: 2px dashed #ccc; padding-top: 8px; margin-top: 8px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
          .total-row.grand { font-weight: bold; font-size: 14px; margin-top: 6px; }
          .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #555; border-top: 1px dashed #ccc; padding-top: 12px; }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ unit: 'mm', format: [80, 200], orientation: 'portrait' });
      const displaySaleNum = typeof saleNumber === 'number' ? padSaleNumber(saleNumber) : saleNumber;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('FROSTSTOCK TRACKER', 40, 10, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Cold Store Management', 40, 15, { align: 'center' });

      doc.setLineWidth(0.3);
      doc.line(5, 18, 75, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Receipt: ${displaySaleNum}`, 5, 23);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Date: ${formatDate(createdAt)}`, 5, 28);
      doc.text(`Staff: ${staffName}`, 5, 33);
      doc.text(`Payment: ${paymentMethod}`, 5, 38);

      doc.line(5, 41, 75, 41);

      const tableBody = items.map((item) => {
        const itemName = item.product?.name || item.productName || item.name || 'Item';
        const qty = item.quantity || 0;
        const unit = item.unit || item.product?.unit || 'pcs';
        const unitPrice = item.unitPrice || item.sellingPrice || 0;
        const itemSubtotal = item.subtotal || item.total || qty * unitPrice;
        return [itemName, `${qty} ${unit}`, formatCurrency(unitPrice), formatCurrency(itemSubtotal)];
      });

      autoTable(doc, {
        startY: 44,
        head: [['Product', 'Qty', 'Price', 'Total']],
        body: tableBody,
        theme: 'plain',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fontStyle: 'bold', fillColor: false },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 14 },
          2: { cellWidth: 16 },
          3: { cellWidth: 16, halign: 'right' },
        },
        margin: { left: 5, right: 5 },
      });

      const finalY = doc.lastAutoTable.finalY + 4;
      doc.line(5, finalY, 75, finalY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TOTAL:', 5, finalY + 6);
      doc.text(formatCurrency(total), 75, finalY + 6, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Thank you for your purchase!', 40, finalY + 14, { align: 'center' });
      doc.text('Powered by FrostStock Tracker', 40, finalY + 18, { align: 'center' });

      doc.save(`Receipt-${displaySaleNum}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to print if jsPDF fails
      handlePrint();
    }
  };

  const displaySaleNum = typeof saleNumber === 'number' ? padSaleNumber(saleNumber) : saleNumber;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Sale Complete!</h2>
              <p className="text-blue-100 text-xs">{displaySaleNum}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content (printable) */}
        <div className="flex-1 overflow-y-auto">
          <div ref={receiptRef} className="px-6 py-4">
            {/* Receipt Header */}
            <div className="receipt-header text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <h1 className="text-xl font-extrabold tracking-widest text-gray-800 uppercase">
                FrostStock Tracker
              </h1>
              <p className="text-xs text-gray-500 mt-1">Cold Store Management System</p>
            </div>

            {/* Meta info */}
            <div className="receipt-meta space-y-1.5 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt No:</span>
                <span className="font-bold text-gray-800">{displaySaleNum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="text-gray-700">{formatDate(createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Staff:</span>
                <span className="text-gray-700">{staffName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment:</span>
                <span className="font-medium text-blue-600">{paymentMethod}</span>
              </div>
            </div>

            {/* Items table */}
            <div className="border-t-2 border-dashed border-gray-300 pt-3 mb-3">
              <table className="items-table w-full text-sm">
                <thead>
                  <tr className="border-b border-dashed border-gray-200">
                    <th className="text-left pb-2 text-xs uppercase text-gray-500 font-semibold">Product</th>
                    <th className="text-center pb-2 text-xs uppercase text-gray-500 font-semibold">Qty</th>
                    <th className="text-right pb-2 text-xs uppercase text-gray-500 font-semibold">Price</th>
                    <th className="text-right pb-2 text-xs uppercase text-gray-500 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const itemName = item.product?.name || item.productName || item.name || 'Item';
                    const qty = item.quantity || 0;
                    const unit = item.unit || item.product?.unit || 'pcs';
                    const unitPrice = item.unitPrice || item.sellingPrice || item.product?.sellingPrice || 0;
                    const itemSubtotal = item.subtotal || item.total || qty * unitPrice;
                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 pr-2 text-gray-800 font-medium">{itemName}</td>
                        <td className="py-2 text-center text-gray-600 text-xs">
                          {qty} {unit}
                        </td>
                        <td className="py-2 text-right text-gray-600 text-xs">{formatCurrency(unitPrice)}</td>
                        <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(itemSubtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total section */}
            <div className="total-section border-t-2 border-dashed border-gray-300 pt-3">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-lg text-blue-600 mt-2 pt-2 border-t border-dashed border-gray-200">
                <span>TOTAL</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="footer text-center mt-4 pt-4 border-t-2 border-dashed border-gray-300">
              <p className="text-sm font-semibold text-gray-700">Thank you for your purchase!</p>
              <p className="text-xs text-gray-400 mt-1">Powered by FrostStock Tracker</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 pt-3 border-t border-pink-100 flex gap-3 flex-shrink-0">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-pink-50 hover:bg-pink-100 text-pink-600 font-semibold py-3 rounded-xl border border-pink-200 transition-colors text-sm"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-blue-200"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

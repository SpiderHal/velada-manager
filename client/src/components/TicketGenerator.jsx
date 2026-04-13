import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';

const TicketGenerator = ({ reservation, onComplete }) => {
  const qrRef = useRef();

  const generatePDF = () => {
    const canvas = qrRef.current.querySelector('canvas');
    const qrDataUrl = canvas.toDataURL('image/png');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5',
    });

    // Diseño del Boleto
    doc.setFillColor(63, 81, 181); // Indigo
    doc.rect(0, 0, 148, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('BOLETO DE ACCESO', 74, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Velada Ana María Gómez Campos', 74, 25, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Comprador: ${reservation.buyerName}`, 20, 55);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 62);
    
    doc.setFontSize(14);
    doc.text('DETALLE DE LUGARES', 20, 80);
    doc.setLineWidth(0.5);
    doc.line(20, 82, 128, 82);

    let yPos = 90;
    reservation.seats.forEach((seat, index) => {
      doc.setFontSize(11);
      doc.text(`• Mesa ${seat.tableNumber} - Asiento ${seat.seatNumber}`, 25, yPos);
      yPos += 7;
    });

    // QR Code
    doc.addImage(qrDataUrl, 'PNG', 49, 110, 50, 50);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Presente este código QR al ingresar', 74, 165, { align: 'center' });

    doc.save(`Ticket_${reservation.buyerName.replace(/\s+/g, '_')}.pdf`);
    if (onComplete) onComplete();
  };

  // Datos para el QR
  const qrValue = JSON.stringify({
    buyer: reservation.buyerName,
    seats: reservation.seats.map(s => ({ m: s.tableNumber, a: s.seatNumber })),
    date: new Date().toISOString()
  });

  return (
    <div className="hidden">
      <div ref={qrRef}>
        <QRCodeCanvas value={qrValue} size={256} />
      </div>
      <button id="download-ticket-btn" onClick={generatePDF}>Download</button>
    </div>
  );
};

export default TicketGenerator;

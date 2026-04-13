import React from 'react';

const Seat = ({ seat, isSelected, onToggle }) => {
  const getStatusColor = () => {
    if (seat.status === 'OCCUPIED') return 'bg-red-500 cursor-not-allowed';
    if (isSelected) return 'bg-yellow-400 ring-2 ring-yellow-600';
    return 'bg-green-500 hover:bg-green-600 cursor-pointer';
  };

  return (
    <div
      onClick={() => seat.status === 'AVAILABLE' && onToggle(seat.id)}
      className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white font-bold transition-all ${getStatusColor()}`}
      title={seat.status === 'OCCUPIED' ? `Ocupado por: ${seat.buyerName || 'Anónimo'}` : `Mesa ${seat.tableId}, Asiento ${seat.seatNumber}`}
    >
      {seat.seatNumber}
    </div>
  );
};

export default Seat;

import React from 'react';

const Seat = ({ seat, isSelected, onToggle }) => {
  const getStatusColor = () => {
    if (seat.status === 'OCCUPIED') return 'bg-red-500 dark:bg-red-600 text-white cursor-not-allowed';
    if (isSelected) return 'bg-yellow-400 dark:bg-yellow-500 text-indigo-950 ring-2 ring-yellow-600 dark:ring-yellow-300';
    return 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-500 cursor-pointer text-white';
  };

  return (
    <div
      onClick={() => seat.status === 'AVAILABLE' && onToggle(seat.id)}
      className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black transition-all duration-300 shadow-sm ${getStatusColor()}`}
      title={seat.status === 'OCCUPIED' ? `Ocupado por: ${seat.buyerName || 'Anónimo'}` : `Asiento ${seat.seatNumber}`}
    >
      {seat.seatNumber}
    </div>
  );
};

export default Seat;

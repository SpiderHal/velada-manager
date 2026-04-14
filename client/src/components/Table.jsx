import React from 'react';
import Seat from './Seat';

const Table = ({ table, selectedSeats, onToggleSeat }) => {
  const radius = 38; // Reducido de 45 a 38 para acercar las sillas a la mesa
  const totalSeats = table.seats.length;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center min-h-[200px] transition-all hover:shadow-md">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Mesa Central - Más grande */}
        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full border-2 border-gray-200 dark:border-slate-600 shadow-inner flex items-center justify-center z-10">
          <span className="text-xs font-black text-gray-500 dark:text-gray-400 text-center leading-tight">Mesa<br/>{table.number}</span>
        </div>

        {/* Asientos alrededor */}
        {table.seats.map((seat, index) => {
          const angle = (index * 360) / totalSeats;
          const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

          return (
            <div
              key={seat.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
            >
              <Seat
                seat={seat}
                isSelected={selectedSeats.includes(seat.id)}
                onToggle={onToggleSeat}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Table;

import React from 'react';
import Seat from './Seat';

const Table = ({ table, selectedSeats, onToggleSeat }) => {
  const radius = 38; // Radio para posicionar los asientos
  const totalSeats = table.seats.length;

  return (
    <div className="bg-white p-2 rounded-xl shadow-md border border-gray-100 flex flex-col items-center justify-center min-h-[160px]">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Mesa Central */}
        <div className="w-16 h-16 bg-gray-100 rounded-full border-2 border-gray-200 shadow-inner flex items-center justify-center z-10">
          <span className="text-[10px] font-black text-gray-500 text-center">Mesa<br/>{table.number}</span>
        </div>

        {/* Asientos alrededor */}
        {table.seats.map((seat, index) => {
          const angle = (index * 360) / totalSeats;
          const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

          return (
            <div
              key={seat.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
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

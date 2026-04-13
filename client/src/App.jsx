import React, { useState, useEffect, useRef } from 'react';
import Table from './components/Table';
import TicketGenerator from './components/TicketGenerator';
import { LogOut, UserPlus, Trash2, Download, Search, CheckCircle } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [user, setUser] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [buyerName, setBuyerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', role: 'USER' });
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingTicket, setPendingTicket] = useState(null);

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_URL}/tables`);
      if (!response.ok) throw new Error('Error al cargar mesas');
      const data = await response.json();
      setTables(data);
      setLoading(false);
      setError('');
    } catch (err) {
      setError('Error al conectar con el servidor.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const toggleSeat = (id) => {
    setSelectedSeatIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    if (selectedSeatIds.length === 0) return alert('Selecciona al menos un asiento.');
    if (!buyerName) return alert('El nombre del comprador es obligatorio.');

    try {
      const response = await fetch(`${API_URL}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIds: selectedSeatIds, buyerName }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Preparar datos para el boleto
      const reservedSeatsInfo = [];
      tables.forEach(t => {
        t.seats.forEach(s => {
          if (selectedSeatIds.includes(s.id)) {
            reservedSeatsInfo.push({ tableNumber: t.number, seatNumber: s.seatNumber });
          }
        });
      });

      setPendingTicket({ buyerName, seats: reservedSeatsInfo });
      setMessage('¡Reserva exitosa! Descargando boleto...');
      setBuyerName('');
      setSelectedSeatIds([]);
      fetchTables();
      
      setTimeout(() => {
        document.getElementById('download-ticket-btn')?.click();
        setMessage('');
        setPendingTicket(null);
      }, 1500);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (seatIds) => {
    if (!window.confirm('¿Estás seguro de cancelar esta reserva?')) return;
    try {
      const response = await fetch(`${API_URL}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIds }),
      });
      if (!response.ok) throw new Error('Error al cancelar');
      fetchTables();
      alert('Reserva cancelada correctamente');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      if (!response.ok) throw new Error('Error al crear usuario');
      alert('Usuario creado correctamente');
      setNewUserForm({ username: '', password: '', role: 'USER' });
      setShowUserModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
          <h1 className="text-2xl font-black text-indigo-900 mb-2 text-center">Velada AMGC</h1>
          <p className="text-gray-500 text-center mb-8 font-medium">Inicia sesión para gestionar lugares</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="text"
              placeholder="Usuario"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            />
            <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              Ingresar al Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {pendingTicket && <TicketGenerator reservation={pendingTicket} />}
      
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-950">Velada AMGC</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-2 py-1 rounded-md uppercase">
              {user.role}
            </span>
            <span className="text-gray-500 font-medium">Hola, {user.username}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {user.role === 'ADMIN' && (
            <button 
              onClick={() => setShowUserModal(true)}
              className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
            >
              <UserPlus size={18} /> Nuevo Usuario
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold border border-red-100 hover:bg-red-100 transition-all"
          >
            <LogOut size={18} /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                🗺️ Mapa de Mesas
              </h2>
              <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div> Disponible</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> Seleccionado</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div> Ocupado</div>
              </div>
            </div>
            
            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <div className="min-w-[1400px]">
                {/* Escenario */}
                <div className="w-full bg-indigo-900 text-white text-center py-6 rounded-b-3xl font-black tracking-[1.5em] uppercase shadow-lg mb-16 relative overflow-hidden">
                  <div className="relative z-10">ESCENARIO</div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Grid de Mesas */}
                <div className="grid grid-cols-10 gap-x-4 gap-y-12 px-4">
                  {tables.map((table) => (
                    <Table
                      key={table.id}
                      table={table}
                      selectedSeats={selectedSeatIds}
                      onToggleSeat={toggleSeat}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Controls and Search */}
        <div className="lg:col-span-1 space-y-6">
          {/* Reservation Form */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 sticky top-8">
            <h2 className="text-xl font-black text-gray-800 mb-6">Panel de Control</h2>
            
            {selectedSeatIds.length > 0 ? (
              <form onSubmit={handleReserve} className="space-y-6">
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <p className="text-xs font-black text-indigo-400 uppercase mb-1">Asientos</p>
                  <p className="text-3xl font-black text-indigo-700">{selectedSeatIds.length}</p>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">
                    Apartar a nombre de:
                  </label>
                  <input
                    type="text"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    placeholder="Ej. Familia García"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    required
                  />
                </div>
                <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                  <CheckCircle size={20} /> Confirmar y Descargar
                </button>
                {message && (
                  <div className="bg-green-500 text-white p-4 rounded-2xl text-sm font-bold text-center animate-pulse">
                    {message}
                  </div>
                )}
              </form>
            ) : (
              <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300 text-center">
                <p className="text-gray-400 font-medium text-sm">Selecciona lugares en el mapa para iniciar una reserva</p>
              </div>
            )}

            {/* Admin: Buscar Reservas */}
            {user.role === 'ADMIN' && (
              <div className="mt-10 pt-10 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-400 uppercase mb-4 tracking-widest">Gestionar Apartados</h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Buscar por nombre..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {tables.flatMap(t => t.seats)
                    .filter(s => s.status === 'OCCUPIED' && (searchQuery === '' || s.buyerName?.toLowerCase().includes(searchQuery.toLowerCase())))
                    .reduce((acc, curr) => {
                      const existing = acc.find(item => item.buyerName === curr.buyerName);
                      if (existing) existing.ids.push(curr.id);
                      else acc.push({ buyerName: curr.buyerName, ids: [curr.id] });
                      return acc;
                    }, [])
                    .map((res, i) => (
                      <div key={i} className="bg-white border border-gray-100 p-3 rounded-xl flex justify-between items-center group hover:border-red-100 hover:bg-red-50/30 transition-all">
                        <div>
                          <p className="text-xs font-bold text-gray-700 truncate w-32">{res.buyerName}</p>
                          <p className="text-[10px] text-gray-400 font-black">{res.ids.length} Lugares</p>
                        </div>
                        <button 
                          onClick={() => handleCancel(res.ids)}
                          className="text-red-400 hover:text-red-600 p-2 hover:bg-red-100 rounded-lg transition-all"
                          title="Cancelar reserva"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* User Creation Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
            <h2 className="text-xl font-black text-gray-800 mb-6">Crear Nuevo Colaborador</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre de usuario"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                value={newUserForm.username}
                onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                required
              />
              <select
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none appearance-none"
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
              >
                <option value="USER">Vendedor (USER)</option>
                <option value="ADMIN">Administrador (ADMIN)</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl"
                >
                  Cancelar
                </button>
                <button className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

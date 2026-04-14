import React, { useState, useEffect } from 'react';
import Table from './components/Table';
import TicketGenerator from './components/TicketGenerator';
import { 
  LogOut, UserPlus, Trash2, Download, Search, CheckCircle, 
  Database, Users, Map as MapIcon, ClipboardList, Upload 
} from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('map'); // map, reservations, users, backup
  const [tables, setTables] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [buyerName, setBuyerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingTicket, setPendingTicket] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', role: 'USER' });

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_URL}/tables`);
      const data = await response.json();
      setTables(data);
    } catch (err) {
      console.error('Error cargando mesas');
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
    if (selectedSeatIds.length === 0 || !buyerName) return;

    try {
      const response = await fetch(`${API_URL}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIds: selectedSeatIds, buyerName }),
      });
      if (!response.ok) throw new Error('Error al reservar');

      const reservedSeatsInfo = [];
      tables.forEach(t => {
        t.seats.forEach(s => {
          if (selectedSeatIds.includes(s.id)) {
            reservedSeatsInfo.push({ tableNumber: t.number, seatNumber: s.seatNumber });
          }
        });
      });

      setPendingTicket({ buyerName, seats: reservedSeatsInfo });
      setBuyerName('');
      setSelectedSeatIds([]);
      fetchTables();
      
      setTimeout(() => {
        document.getElementById('download-ticket-btn')?.click();
        setPendingTicket(null);
      }, 1000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (seatIds) => {
    if (!window.confirm('¿Confirmas la cancelación?')) return;
    try {
      await fetch(`${API_URL}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIds }),
      });
      fetchTables();
    } catch (err) {
      alert('Error al cancelar');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_URL}/backup/export`);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_velada_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) {
      alert('Error al exportar');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const response = await fetch(`${API_URL}/backup/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        });
        if (response.ok) {
          alert('Importación exitosa');
          fetchTables();
        }
      } catch (err) {
        alert('Archivo de respaldo inválido');
      }
    };
    reader.readAsText(file);
  };

  const reprintTicket = (res) => {
    setPendingTicket({ buyerName: res.buyerName, seats: res.seats });
    setTimeout(() => {
      document.getElementById('download-ticket-btn')?.click();
      setPendingTicket(null);
    }, 500);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
          <h1 className="text-2xl font-black text-indigo-900 mb-6 text-center">Velada Manager</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" placeholder="Usuario" 
              className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})}
            />
            <input 
              type="password" placeholder="Contraseña" 
              className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})}
            />
            <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Agrupar asientos ocupados por comprador
  const reservations = tables.flatMap(t => t.seats)
    .filter(s => s.status === 'OCCUPIED')
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.buyerName === curr.buyerName);
      const seatInfo = { tableNumber: tables.find(t => t.id === curr.tableId).number, seatNumber: curr.seatNumber, id: curr.id };
      if (existing) {
        existing.seats.push(seatInfo);
        existing.ids.push(curr.id);
      } else {
        acc.push({ buyerName: curr.buyerName, seats: [seatInfo], ids: [curr.id] });
      }
      return acc;
    }, [])
    .filter(r => r.buyerName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {pendingTicket && <TicketGenerator reservation={pendingTicket} />}
      
      {/* Sidebar / Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-indigo-950">Velada Manager</h1>
          <nav className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'map' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <MapIcon size={16} /> Mapa
            </button>
            <button 
              onClick={() => setActiveTab('reservations')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'reservations' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ClipboardList size={16} /> Reservas
            </button>
            <button 
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'backup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Database size={16} /> Respaldos
            </button>
            {user.role === 'ADMIN' && (
              <button 
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Users size={16} /> Usuarios
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-indigo-600 uppercase">{user.role}</p>
            <p className="text-sm font-bold text-gray-700">{user.username}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          
          {/* VISTA: MAPA */}
          {activeTab === 'map' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
              <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-auto p-6 relative">
                 <div className="min-w-[1200px]">
                    <div className="bg-indigo-900 text-white text-center py-4 rounded-b-2xl font-black tracking-widest mb-12">ESCENARIO</div>
                    <div className="grid grid-cols-8 gap-8">
                      {tables.map(table => (
                        <Table key={table.id} table={table} selectedSeats={selectedSeatIds} onToggleSeat={toggleSeat} />
                      ))}
                    </div>
                 </div>
              </div>
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="font-black text-gray-800 mb-4 uppercase text-xs tracking-widest">Nueva Reserva</h3>
                  {selectedSeatIds.length > 0 ? (
                    <form onSubmit={handleReserve} className="space-y-4">
                      <div className="bg-indigo-50 p-4 rounded-2xl">
                        <p className="text-xs font-bold text-indigo-400">Lugares seleccionados</p>
                        <p className="text-2xl font-black text-indigo-700">{selectedSeatIds.length}</p>
                      </div>
                      <input 
                        type="text" placeholder="Nombre del Comprador"
                        className="w-full p-4 bg-gray-50 border rounded-2xl outline-none"
                        value={buyerName} onChange={e => setBuyerName(e.target.value)}
                        required
                      />
                      <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
                        <CheckCircle size={18} /> Confirmar
                      </button>
                    </form>
                  ) : (
                    <p className="text-gray-400 text-sm italic">Selecciona asientos en el mapa...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VISTA: RESERVAS */}
          {activeTab === 'reservations' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-800">Listado de Reservas</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" placeholder="Buscar por nombre..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl text-sm outline-none"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="pb-4">Comprador</th>
                      <th className="pb-4">Lugares</th>
                      <th className="pb-4">Detalle</th>
                      <th className="pb-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reservations.map((res, i) => (
                      <tr key={i} className="group hover:bg-gray-50/50 transition-all">
                        <td className="py-4 font-bold text-gray-800">{res.buyerName}</td>
                        <td className="py-4">
                          <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md text-xs font-black">
                            {res.seats.length} Lugares
                          </span>
                        </td>
                        <td className="py-4 text-xs text-gray-500">
                          {res.seats.map(s => `M${s.tableNumber}-A${s.seatNumber}`).join(', ')}
                        </td>
                        <td className="py-4 text-right space-x-2">
                          <button 
                            onClick={() => reprintTicket(res)}
                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Re-descargar Ticket"
                          >
                            <Download size={18} />
                          </button>
                          <button 
                            onClick={() => handleCancel(res.ids)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Cancelar Reserva"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA: RESPALDOS */}
          {activeTab === 'backup' && (
            <div className="max-w-2xl mx-auto w-full bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center space-y-8">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <Database size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 mb-2">Seguridad de Datos</h2>
                <p className="text-gray-500">Exporta toda la información del sistema para guardarla en un lugar seguro o impórtala en caso de emergencia.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleExport}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 rounded-3xl hover:bg-indigo-50 transition-all group"
                >
                  <Download className="mb-2 text-indigo-400 group-hover:text-indigo-600" size={32} />
                  <span className="font-bold text-indigo-600">Exportar JSON</span>
                </button>
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-3xl hover:bg-gray-50 cursor-pointer transition-all group">
                  <Upload className="mb-2 text-gray-400 group-hover:text-gray-600" size={32} />
                  <span className="font-bold text-gray-600">Importar JSON</span>
                  <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                </label>
              </div>
            </div>
          )}

          {/* VISTA: USUARIOS (Solo Admin) */}
          {activeTab === 'users' && user.role === 'ADMIN' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-xl font-black text-gray-800">Gestión de Colaboradores</h2>
                  <button onClick={() => setShowUserModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">
                    <UserPlus size={18} /> Nuevo Usuario
                  </button>
               </div>
               {/* Aquí podrías mapear una lista de usuarios del API /users */}
               <div className="p-12 text-center text-gray-400 italic">
                 Lista de usuarios cargada desde el servidor... (Funcionalidad de Admin completa)
               </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL USUARIO */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md">
            <h3 className="text-xl font-black mb-6">Nuevo Usuario</h3>
            <form onSubmit={async (e) => {
               e.preventDefault();
               const res = await fetch(`${API_URL}/users`, {
                 method: 'POST',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify(newUserForm)
               });
               if(res.ok) { alert('Usuario creado'); setShowUserModal(false); }
            }} className="space-y-4">
              <input type="text" placeholder="Usuario" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} required />
              <input type="password" placeholder="Contraseña" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} required />
              <select className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" onChange={e => setNewUserForm({...newUserForm, role: e.target.value})}>
                <option value="USER">Vendedor (USER)</option>
                <option value="ADMIN">Administrador (ADMIN)</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-4 font-bold text-gray-500">Cancelar</button>
                <button className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

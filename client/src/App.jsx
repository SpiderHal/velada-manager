import React, { useState, useEffect } from 'react';
import Table from './components/Table';
import TicketGenerator from './components/TicketGenerator';
import QRScanner from './components/QRScanner';
import { 
  LogOut, UserPlus, Trash2, Edit2, Download, Search, CheckCircle, 
  Database, Users, Map as MapIcon, ClipboardList, Upload, Sun, Moon, Scan 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('map'); 
  
  // Ajustar pestaña activa al cambiar de usuario o cargar
  useEffect(() => {
    if (user) {
      if (user.role === 'LECTOR') setActiveTab('lector');
      else setActiveTab('map');
    }
  }, [user]);

  const [tables, setTables] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [buyerName, setBuyerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingTicket, setPendingTicket] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', role: 'USER' });
  const [usersList, setUsersList] = useState([]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      setUsersList(data);
    } catch (err) {
      console.error('Error cargando usuarios');
    }
  };

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

  useEffect(() => {
    if (activeTab === 'users' && user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Fallo en la respuesta del servidor');
      }
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_velada_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); // Necesario para algunos navegadores
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error al exportar: ${err.message}`);
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
      <div className="min-h-screen bg-indigo-900 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-transparent dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
             <h1 className="text-2xl font-black text-indigo-900 dark:text-indigo-400">Velada Manager</h1>
             <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-600 dark:text-gray-300">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" placeholder="Usuario" 
              className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})}
            />
            <input 
              type="password" placeholder="Contraseña" 
              className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})}
            />
            <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  const reservations = tables.flatMap(t => t.seats)
    .filter(s => s.status === 'OCCUPIED')
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.buyerName === curr.buyerName);
      const tableFound = tables.find(t => t.id === curr.tableId);
      const seatInfo = { tableNumber: tableFound ? tableFound.number : '?', seatNumber: curr.seatNumber, id: curr.id };
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      {pendingTicket && <TicketGenerator reservation={pendingTicket} />}
      
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-indigo-950 dark:text-white">Velada Manager</h1>
          <nav className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: 'map', icon: MapIcon, label: 'Mapa', roles: ['ADMIN', 'USER'] },
              { id: 'reservations', icon: ClipboardList, label: 'Reservas', roles: ['ADMIN', 'USER'] },
              { id: 'lector', icon: Scan, label: 'Lector', roles: ['ADMIN', 'LECTOR'] },
              { id: 'backup', icon: Database, label: 'Respaldos', roles: ['ADMIN', 'USER'] },
              { id: 'users', icon: Users, label: 'Usuarios', roles: ['ADMIN'] }
            ].map(item => (
              (item.roles.includes(user.role)) && (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === item.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  <item.icon size={16} /> <span className="hidden sm:inline">{item.label}</span>
                </button>
              )
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-xl text-gray-600 dark:text-gray-300 transition-all">
             {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">{user.role}</p>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{user.username}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          
          {activeTab === 'map' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-auto p-12 relative">
                 <div className="min-w-[1800px]">
                    <div className="bg-indigo-900 dark:bg-indigo-700 text-white text-center py-4 rounded-b-2xl font-black tracking-widest mb-16 shadow-lg">ESCENARIO</div>
                    <div className="grid grid-cols-10 gap-x-6 gap-y-20">
                      {tables.map(table => (
                        <Table key={table.id} table={table} selectedSeats={selectedSeatIds} onToggleSeat={toggleSeat} />
                      ))}
                    </div>
                 </div>
              </div>
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                  <h3 className="font-black text-gray-800 dark:text-gray-200 mb-4 uppercase text-xs tracking-widest">Nueva Reserva</h3>
                  {selectedSeatIds.length > 0 ? (
                    <form onSubmit={handleReserve} className="space-y-4">
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border dark:border-indigo-500/30">
                        <p className="text-xs font-bold text-indigo-400 dark:text-indigo-300">Lugares seleccionados</p>
                        <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{selectedSeatIds.length}</p>
                      </div>
                      <input 
                        type="text" placeholder="Nombre del Comprador"
                        className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none dark:text-white placeholder:dark:text-gray-500"
                        value={buyerName} onChange={e => setBuyerName(e.target.value)}
                        required
                      />
                      <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
                        <CheckCircle size={18} /> Confirmar
                      </button>
                    </form>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 text-sm italic">Selecciona asientos en el mapa...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-800 dark:text-white">Listado de Reservas</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" placeholder="Buscar por nombre..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800">
                      <th className="pb-4">Comprador</th>
                      <th className="pb-4">Lugares</th>
                      <th className="pb-4">Detalle</th>
                      <th className="pb-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {reservations.map((res, i) => (
                      <tr key={i} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all">
                        <td className="py-4 font-bold text-gray-800 dark:text-gray-200">{res.buyerName}</td>
                        <td className="py-4">
                          <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded-md text-xs font-black">
                            {res.seats.length} Lugares
                          </span>
                        </td>
                        <td className="py-4 text-xs text-gray-500 dark:text-gray-400">
                          {res.seats.map(s => `M${s.tableNumber}-A${s.seatNumber}`).join(', ')}
                        </td>
                        <td className="py-4 text-right space-x-2">
                          <button 
                            onClick={() => reprintTicket(res)}
                            className="p-2 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                            title="Re-descargar Ticket"
                          >
                            <Download size={18} />
                          </button>
                          <button 
                            onClick={() => handleCancel(res.ids)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
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

          {activeTab === 'lector' && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <QRScanner apiUrl={API_URL} />
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="max-w-2xl mx-auto w-full bg-white dark:bg-slate-900 p-12 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 text-center space-y-8">
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto">
                <Database size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Seguridad de Datos</h2>
                <p className="text-gray-500 dark:text-gray-400">Exporta toda la información del sistema para guardarla en un lugar seguro o impórtala en caso de emergencia.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleExport}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-3xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                >
                  <Download className="mb-2 text-indigo-400 group-hover:text-indigo-600" size={32} />
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Exportar JSON</span>
                </button>
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-3xl hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-all group">
                  <Upload className="mb-2 text-gray-400 group-hover:text-gray-600" size={32} />
                  <span className="font-bold text-gray-600 dark:text-gray-400">Importar JSON</span>
                  <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'users' && user.role === 'ADMIN' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-full overflow-hidden">
               <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                  <h2 className="text-xl font-black text-gray-800 dark:text-white">Gestión de Colaboradores</h2>
                  <button onClick={() => { setEditingUser(null); setNewUserForm({ username: '', password: '', role: 'USER' }); setShowUserModal(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all">
                    <UserPlus size={18} /> Nuevo Usuario
                  </button>
               </div>
               <div className="flex-1 overflow-auto p-6">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-slate-800">
                       <th className="pb-4">Usuario</th>
                       <th className="pb-4">Rol</th>
                       <th className="pb-4 text-right">Acciones</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                     {usersList.map((u, i) => (
                       <tr key={i} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-all">
                         <td className="py-4 font-bold text-gray-800 dark:text-gray-200">{u.username}</td>
                         <td className="py-4">
                           <span className={`px-2 py-1 rounded-md text-xs font-black ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300' : (u.role === 'LECTOR' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300')}`}>
                             {u.role}
                           </span>
                         </td>
                         <td className="py-4 text-right">
                           <button 
                             onClick={() => {
                               setEditingUser(u);
                               setNewUserForm({ username: u.username, role: u.role, password: '' });
                               setShowUserModal(true);
                             }}
                             className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all mr-2"
                           >
                             <Edit2 size={18} />
                           </button>
                           {u.username !== user.username && (
                             <button 
                               onClick={async () => {
                                 if(window.confirm(`¿Eliminar al usuario ${u.username}?`)) {
                                   await fetch(`${API_URL}/users/${u.id}`, { method: 'DELETE' });
                                   fetchUsers();
                                 }
                               }}
                               className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                             >
                               <Trash2 size={18} />
                             </button>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL USUARIO */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-md border border-transparent dark:border-slate-800">
            <h3 className="text-xl font-black mb-6 dark:text-white">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <form onSubmit={async (e) => {
               e.preventDefault();
               const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`;
               const method = editingUser ? 'PUT' : 'POST';
               const res = await fetch(url, {
                 method,
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify(newUserForm)
               });
               if(res.ok) { 
                 alert(editingUser ? 'Usuario actualizado' : 'Usuario creado'); 
                 setShowUserModal(false); 
                 setEditingUser(null);
                 fetchUsers();
               }
            }} className="space-y-4">
              <input 
                type="text" 
                placeholder="Usuario" 
                className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none dark:text-white" 
                value={newUserForm.username}
                onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} 
                required 
              />
              {!editingUser && (
                <input 
                  type="password" 
                  placeholder="Contraseña" 
                  className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none dark:text-white" 
                  value={newUserForm.password}
                  onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} 
                  required 
                />
              )}
              <select 
                className="w-full p-4 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none dark:text-white" 
                value={newUserForm.role}
                onChange={e => setNewUserForm({...newUserForm, role: e.target.value})}
              >
                <option value="USER">Vendedor (USER)</option>
                <option value="ADMIN">Administrador (ADMIN)</option>
                <option value="LECTOR">Lector de Acceso (LECTOR)</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowUserModal(false); setEditingUser(null); }} className="flex-1 py-4 font-bold text-gray-500 dark:text-gray-400">Cancelar</button>
                <button className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl">
                  {editingUser ? 'Guardar' : 'Crear'}
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

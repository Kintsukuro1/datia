import React, { useState } from 'react';
import { Users, UserPlus, Search, ShieldCheck, Edit3, X, Save, Check } from 'lucide-react';
import { authService } from '../../services/auth_service';

export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  is_admin: boolean;
}

interface AdminUsersTabProps {
  users: UserItem[];
  onRefreshUsers?: () => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ users, onRefreshUsers }) => {
  const [userList, setUserList] = useState<UserItem[]>(users);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isAdminCheck, setIsAdminCheck] = useState<boolean>(false);
  const [isSuccessBanner, setIsSuccessBanner] = useState<string | null>(null);

  // New user modal state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Economista');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('datia_governance_users');
      if (stored) {
        setUserList(JSON.parse(stored));
      } else {
        setUserList(users);
      }
    } catch {
      setUserList(users);
    }
  }, [users]);

  const saveUsersToStorage = (updated: UserItem[]) => {
    setUserList(updated);
    try {
      localStorage.setItem('datia_governance_users', JSON.stringify(updated));
    } catch {
      // Ignore quota error
    }
  };

  const filteredUsers = userList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditRole = (user: UserItem) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setIsAdminCheck(user.is_admin);
  };

  const handleSaveRoleChange = () => {
    if (!editingUser) return;

    const updated = userList.map((u) => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          role: selectedRole,
          is_admin: isAdminCheck,
        };
      }
      return u;
    });

    saveUsersToStorage(updated);
    setIsSuccessBanner(`Rol actualizado exitosamente para ${editingUser.name} -> ${selectedRole}`);
    setEditingUser(null);
    setTimeout(() => setIsSuccessBanner(null), 3500);
  };


  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setCreateError('Por favor completa el nombre de usuario y contraseña.');
      return;
    }

    try {
      await authService.register({
        username: newUsername,
        email: newEmail || undefined,
        password: newPassword,
        is_admin: newIsAdmin,
      });

      const createdItem: UserItem = {
        id: Date.now(),
        name: newUsername,
        email: newEmail || `${newUsername}@empresa.com`,
        role: newRole,
        is_admin: newIsAdmin,
      };

      const updatedUsers = [...userList, createdItem];
      saveUsersToStorage(updatedUsers);
      setIsSuccessBanner(`Usuario '${newUsername}' registrado correctamente.`);

      setIsNewUserModalOpen(false);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setCreateError(null);

      if (onRefreshUsers) onRefreshUsers();
      setTimeout(() => setIsSuccessBanner(null), 3500);
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Error al registrar el nuevo usuario.');
    }
  };

  const getRoleBadgeStyle = (role: string, isAdmin: boolean) => {
    if (isAdmin || role === 'Administrador') {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
    if (role === 'Economista') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (role === 'TI') {
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-5">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" /> Matriz de Usuarios y Gobernanza RBAC
          </h3>
          <p className="text-xs text-gray-400">Asignación de perfiles (Administrador, Economista, TI, Usuario) y Column-Level Security</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar usuario o rol..."
              className="bg-dark-base border border-dark-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={() => setIsNewUserModalOpen(true)}
            className="flex items-center space-x-1.5 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium px-4 py-2 rounded-xl shadow-lg shadow-purple-600/30 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Usuario</span>
          </button>
        </div>
      </div>

      {isSuccessBanner && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2 animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          <span>{isSuccessBanner}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-dark-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-dark-base border-b border-dark-border text-gray-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol RBAC Asignado</th>
              <th className="px-4 py-3">Privilegios Admin</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border text-gray-200">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-dark-card/50 transition-colors">
                <td className="px-4 py-3 font-medium text-white flex items-center space-x-2">
                  <span className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center justify-center">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                  <span>{u.name}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`border px-2.5 py-1 rounded-lg text-xs font-semibold ${getRoleBadgeStyle(u.role, u.is_admin)}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.is_admin ? (
                    <span className="inline-flex items-center space-x-1 text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Super Admin</span>
                    </span>
                  ) : (
                    <span className="text-gray-500">Estándar</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEditRole(u)}
                    className="flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-1 rounded-lg transition-colors ml-auto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Rol</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <h4 className="text-sm font-bold text-white">Editar Perfil & Gobernanza - {editingUser.name}</h4>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-300 mb-1">Seleccionar Perfil RBAC</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-dark-base border border-dark-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Economista">Economista (Finanzas, Ventas, Costos, Márgenes)</option>
                  <option value="TI">TI (Servidores, Incidentes, Telemetría CPU/RAM)</option>
                  <option value="Administrador">Administrador (Acceso Total + Auditoría)</option>
                  <option value="Usuario">Usuario (Sin asignación - Bloqueado)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isAdminCheckModal"
                  checked={isAdminCheck}
                  onChange={(e) => setIsAdminCheck(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded bg-dark-base border-dark-border focus:ring-purple-500"
                />
                <label htmlFor="isAdminCheckModal" className="text-gray-300 font-medium cursor-pointer">
                  Otorgar Privilegios de Super Administrador
                </label>
              </div>
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-dark-border">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-dark-card text-gray-300 text-xs font-medium hover:bg-dark-border"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRoleChange}
                className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Rol</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New User Modal */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-400" /> Registrar Nuevo Usuario
              </h4>
              <button onClick={() => setIsNewUserModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              {createError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-gray-300 font-medium mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="ej. felipe_analista"
                  className="w-full bg-dark-base border border-dark-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full bg-dark-base border border-dark-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Contraseña Inicial</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-base border border-dark-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Perfil Rol RBAC</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-dark-base border border-dark-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Economista">Economista</option>
                  <option value="TI">TI</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Usuario">Usuario (Pendiente asignación)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="newIsAdminCheck"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded bg-dark-base border-dark-border focus:ring-purple-500"
                />
                <label htmlFor="newIsAdminCheck" className="text-gray-300 cursor-pointer">
                  Otorgar Privilegios de Administrador
                </label>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-dark-card text-gray-300 text-xs hover:bg-dark-border"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-xl text-xs"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

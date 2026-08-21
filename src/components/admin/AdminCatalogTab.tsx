import React, { useState } from 'react';
import { Sparkles, Check, Search, Plus, Edit3, X, Save, BookOpen } from 'lucide-react';

export interface CatalogItem {
  table: string;
  column: string;
  desc: string;
  formula: string;
  is_ai: boolean;
}

interface AdminCatalogTabProps {
  catalog: CatalogItem[];
  aiEnriching: boolean;
  aiSuccess: boolean;
  onRunAiCatalog: () => void;
}

export const AdminCatalogTab: React.FC<AdminCatalogTabProps> = ({
  catalog,
  aiEnriching,
  aiSuccess,
  onRunAiCatalog,
}) => {
  const [items, setItems] = useState<CatalogItem[]>(() => {
    try {
      const stored = localStorage.getItem('datia_semantic_catalog');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return catalog || [];
  });

  const saveCatalogToStorage = (updatedItems: CatalogItem[]) => {
    setItems(updatedItems);
    try {
      localStorage.setItem('datia_semantic_catalog', JSON.stringify(updatedItems));
    } catch {}
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTableFilter, setSelectedTableFilter] = useState('ALL');


  // Edit / Add modal state
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formTable, setFormTable] = useState('');
  const [formColumn, setFormColumn] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formFormula, setFormFormula] = useState('');

  const uniqueTables = Array.from(new Set(items.map((i) => i.table)));

  const filteredItems = items.filter((cat) => {
    const matchesSearch =
      cat.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.column.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTable = selectedTableFilter === 'ALL' || cat.table === selectedTableFilter;
    return matchesSearch && matchesTable;
  });

  const handleEditClick = (cat: CatalogItem) => {
    setEditingItem(cat);
    setFormTable(cat.table);
    setFormColumn(cat.column);
    setFormDesc(cat.desc);
    setFormFormula(cat.formula);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    const updated = items.map((i) =>
      i.table === editingItem.table && i.column === editingItem.column
        ? { ...i, desc: formDesc, formula: formFormula }
        : i
    );
    saveCatalogToStorage(updated);
    setEditingItem(null);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTable.trim() || !formColumn.trim() || !formDesc.trim()) return;

    const newItem: CatalogItem = {
      table: formTable.trim(),
      column: formColumn.trim(),
      desc: formDesc.trim(),
      formula: formFormula.trim() || 'MANUAL_RULE',
      is_ai: false,
    };

    const updated = [newItem, ...items];
    saveCatalogToStorage(updated);
    setIsAddModalOpen(false);
    setFormTable('');
    setFormColumn('');
    setFormDesc('');
    setFormFormula('');
  };


  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-5">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" /> Catálogo Semántico y Diccionario de Datos (IA)
          </h3>
          <p className="text-xs text-gray-400">
            Define descripciones en lenguaje natural y reglas de gobernanza para el modelo Qwen2.5-Coder
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setFormTable('');
              setFormColumn('');
              setFormDesc('');
              setFormFormula('');
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-1.5 text-xs bg-dark-base hover:bg-dark-border text-gray-200 border border-dark-border px-3.5 py-2 rounded-xl transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Regla</span>
          </button>

          <button
            onClick={onRunAiCatalog}
            disabled={aiEnriching}
            className="flex items-center space-x-2 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium px-4 py-2 rounded-xl shadow-lg shadow-purple-600/30 transition-colors"
          >
            <Sparkles className={`w-4 h-4 ${aiEnriching ? 'animate-spin' : ''}`} />
            <span>{aiEnriching ? 'Analizando Esquema...' : 'Auto-enriquecer con IA'}</span>
          </button>
        </div>
      </div>

      {aiSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>Catálogo semántico enriquecido automáticamente con descripciones generadas por la IA local.</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tabla, campo o descripción..."
            className="w-full bg-dark-base border border-dark-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs w-full sm:w-auto">
          <span className="text-gray-400 font-medium whitespace-nowrap">Filtrar por tabla:</span>
          <select
            value={selectedTableFilter}
            onChange={(e) => setSelectedTableFilter(e.target.value)}
            className="bg-dark-base border border-dark-border rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-purple-500 text-xs"
          >
            <option value="ALL">Todas las Tablas ({items.length})</option>
            {uniqueTables.map((tbl) => (
              <option key={tbl} value={tbl}>
                {tbl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="overflow-x-auto rounded-xl border border-dark-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-dark-base border-b border-dark-border text-gray-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Tabla BD</th>
              <th className="px-4 py-3">Campo / Columna</th>
              <th className="px-4 py-3">Descripción Semántica (Contexto IA)</th>
              <th className="px-4 py-3">Fórmula / Regla</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border text-gray-200">
            {filteredItems.map((cat) => (
              <tr key={`${cat.table}-${cat.column}`} className="hover:bg-dark-card/50 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-purple-400">{cat.table}</td>
                <td className="px-4 py-3 font-mono font-medium text-white">{cat.column}</td>
                <td className="px-4 py-3 text-gray-300 max-w-md">{cat.desc}</td>
                <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">{cat.formula}</td>
                <td className="px-4 py-3">
                  {cat.is_ai ? (
                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                      IA Auto-generado
                    </span>
                  ) : (
                    <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded text-[10px]">
                      Manual Admin
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEditClick(cat)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors ml-auto"
                    title="Editar Regla"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Rule Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <h4 className="text-sm font-bold text-white">
                Editar Regla Semántica: {editingItem.table}.{editingItem.column}
              </h4>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Descripción Semántica (para LLM)</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-dark-base border border-dark-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Fórmula o Regla de Cálculo</label>
                <input
                  type="text"
                  value={formFormula}
                  onChange={(e) => setFormFormula(e.target.value)}
                  className="w-full bg-dark-base border border-dark-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-dark-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-dark-card text-gray-300 text-xs hover:bg-dark-border"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-xl text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Rule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" /> Nueva Regla Semántica
              </h4>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Nombre de Tabla</label>
                <input
                  type="text"
                  value={formTable}
                  onChange={(e) => setFormTable(e.target.value)}
                  placeholder="ej. Answer o fact_ventas"
                  className="w-full bg-dark-base border border-dark-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Nombre de Columna / Campo</label>
                <input
                  type="text"
                  value={formColumn}
                  onChange={(e) => setFormColumn(e.target.value)}
                  placeholder="ej. AnswerText o monto_total"
                  className="w-full bg-dark-base border border-dark-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Descripción Semántica</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Explicación de qué representa este campo para que la IA elija la columna correcta..."
                  rows={3}
                  className="w-full bg-dark-base border border-dark-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Fórmula o Regla (Opcional)</label>
                <input
                  type="text"
                  value={formFormula}
                  onChange={(e) => setFormFormula(e.target.value)}
                  placeholder="ej. SUM(monto) / MASKED / TEXT_LITERAL"
                  className="w-full bg-dark-base border border-dark-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-dark-card text-gray-300 text-xs hover:bg-dark-border"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-xl text-xs"
                >
                  Añadir al Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Star,
  Flag,
  Play,
  Search,
  BookOpen,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
} from 'lucide-react';
import type { UserFavorite, SanitizedQuestion } from '../types';
import { api } from '../services/api';

interface Props {
  userId: string;
  onStartSessionWithQuestions: (questionIds: string[]) => void;
  onNavigateToQuestion: (questionId: string) => void;
}

export const FavoritesView: React.FC<Props> = ({
  userId,
  onStartSessionWithQuestions,
  onNavigateToQuestion,
}) => {
  const [favoritesList, setFavoritesList] = useState<Array<{ favorite: UserFavorite; question: SanitizedQuestion }>>([]);
  const [filterType, setFilterType] = useState<'todas' | 'favoritas' | 'revisao'>('todas');
  const [search, setSearch] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUserFavorites(userId);
      setFavoritesList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [userId]);

  const handleSaveNote = async (questionId: string) => {
    try {
      await api.toggleFavorite({
        userId,
        questionId,
        notes: tempNote,
      });
      setEditingNoteId(null);
      fetchFavorites();
    } catch (err) {
      alert('Erro ao salvar anotação');
    }
  };

  const handleRemove = async (questionId: string) => {
    try {
      await api.toggleFavorite({
        userId,
        questionId,
        bookmarked: false,
        needsReview: false,
      });
      fetchFavorites();
    } catch (err) {
      alert('Erro ao remover marcação');
    }
  };

  const filtered = favoritesList.filter((item) => {
    if (filterType === 'favoritas' && !item.favorite.bookmarked) return false;
    if (filterType === 'revisao' && !item.favorite.needsReview) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        item.question.statement.toLowerCase().includes(s) ||
        item.question.topic.toLowerCase().includes(s) ||
        item.question.volume.toLowerCase().includes(s) ||
        item.question.id.toLowerCase().includes(s) ||
        (item.favorite.notes && item.favorite.notes.toLowerCase().includes(s))
      );
    }
    return true;
  });

  const handleStartSession = () => {
    const ids = filtered.map((f) => f.question.id);
    if (ids.length === 0) return;
    onStartSessionWithQuestions(ids);
  };

  return (
    <div id="favorites-view-container" className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE6DF] pb-4">
        <div>
          <h1 className="font-editorial-heading text-2xl font-bold text-[#1A1A1A]">Caderno de Revisão & Favoritas</h1>
          <p className="font-editorial-serif text-xs text-[#78716C] mt-0.5">
            Gerencie suas questões marcadas, anotações de estudo e crie sessões direcionadas.
          </p>
        </div>

        {filtered.length > 0 && (
          <button
            id="start-session-from-favorites-btn"
            onClick={handleStartSession}
            className="px-4 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-[#FAF8F5]" />
            <span>Resolver Marcadas ({filtered.length})</span>
          </button>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-2.5" />
          <input
            id="search-favorites-input"
            type="text"
            placeholder="Buscar por termo, disciplina, tópico ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg pl-9 pr-3 py-2 text-[#1A1A1A] placeholder-[#A8A29E] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917] focus:bg-white transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 border border-[#EAE6DF] rounded-lg text-xs font-mono font-medium">
          <button
            onClick={() => setFilterType('todas')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterType === 'todas' ? 'bg-white text-[#1C1917] shadow-2xs font-bold border border-[#EAE6DF]' : 'text-[#78716C]'
            }`}
          >
            Todas ({favoritesList.length})
          </button>
          <button
            onClick={() => setFilterType('favoritas')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
              filterType === 'favoritas' ? 'bg-[#FEFCE8] text-[#A16207] shadow-2xs font-bold border border-[#FEF08A]' : 'text-[#78716C]'
            }`}
          >
            <Star className="w-3 h-3 fill-[#EAB308] text-[#CA8A04]" />
            <span>Favoritas</span>
          </button>
          <button
            onClick={() => setFilterType('revisao')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
              filterType === 'revisao' ? 'bg-[#FAF8F5] text-[#1C1917] shadow-2xs font-bold border border-[#1C1917]' : 'text-[#78716C]'
            }`}
          >
            <Flag className="w-3 h-3 fill-[#1C1917] text-[#1C1917]" />
            <span>Para Revisar</span>
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="p-8 text-center bg-white rounded-xl border border-[#EAE6DF] text-xs font-mono text-[#78716C]">
          Carregando caderno de revisão...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#EAE6DF] text-[#A8A29E] flex items-center justify-center mx-auto">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">Nenhuma questão marcada encontrada.</h3>
          <p className="font-editorial-serif text-xs text-[#78716C] max-w-sm mx-auto leading-relaxed">
            Durante suas sessões de estudo, clique na estrela para favoritar ou na bandeira para marcar para revisão.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ favorite, question }) => (
            <div
              key={question.id}
              id={`fav-card-${question.id}`}
              className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {favorite.bookmarked && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold bg-[#FEFCE8] text-[#A16207] border border-[#FEF08A] px-2 py-0.5 rounded-md">
                      <Star className="w-3 h-3 fill-[#EAB308] text-[#CA8A04]" />
                      <span>Favorita</span>
                    </span>
                  )}
                  {favorite.needsReview && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold bg-[#FAF8F5] text-[#1C1917] border border-[#EAE6DF] px-2 py-0.5 rounded-md">
                      <Flag className="w-3 h-3 fill-[#1C1917] text-[#1C1917]" />
                      <span>Revisar</span>
                    </span>
                  )}
                  <span className="text-xs font-bold text-[#1C1917]">{question.volume}</span>
                  <span className="text-[#D6D3D1]">•</span>
                  <span className="text-xs text-[#57534E]">{question.topic}</span>
                  <span className="text-[#D6D3D1]">•</span>
                  <span className="text-[10px] font-mono text-[#A8A29E]">ID: {question.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingNoteId(question.id);
                      setTempNote(favorite.notes || '');
                    }}
                    className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F5] rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Editar anotação"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium hidden sm:inline">Anotação</span>
                  </button>

                  <button
                    onClick={() => handleRemove(question.id)}
                    className="p-1.5 text-[#A8A29E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
                    title="Remover das marcadas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Statement Snippet */}
              <p className="font-editorial-serif text-sm text-[#1A1A1A] leading-relaxed line-clamp-3">
                {question.statement}
              </p>

              {/* Note display or edit box */}
              {editingNoteId === question.id ? (
                <div className="p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg space-y-2">
                  <label className="block text-[11px] font-mono font-bold text-[#1C1917]">
                    Sua Anotação de Estudo:
                  </label>
                  <textarea
                    rows={2}
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    placeholder="Ex: Cuidado com a exceção do art. 151 do CTN..."
                    className="w-full text-xs p-2 bg-white border border-[#EAE6DF] rounded-md text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="px-2.5 py-1 text-[11px] text-[#78716C] hover:bg-[#EAE6DF] rounded-md transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveNote(question.id)}
                      className="px-3 py-1 text-[11px] font-semibold bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>
              ) : favorite.notes ? (
                <div className="p-2.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg text-xs text-[#44403C] flex items-start gap-2">
                  <span className="font-mono font-bold text-[#78716C] shrink-0 text-[11px]">Nota:</span>
                  <span className="font-editorial-serif italic text-xs text-[#292524]">{favorite.notes}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


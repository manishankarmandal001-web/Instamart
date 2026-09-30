import React, { useState } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { DataNote, addDataNote, deleteDataNote, addCustomRecord } from '../firebase/firestoreService';
import {
  MessageSquare,
  PlusCircle,
  Trash2,
  Calendar,
  Building2,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatDateWithDay } from '../utils/formatters';

interface NotesAndSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: DataNote[];
  defaultDate?: string;
  defaultCity?: string;
  onRecordAdded?: () => void;
}

export const NotesAndSyncModal: React.FC<NotesAndSyncModalProps> = ({
  isOpen,
  onClose,
  notes,
  defaultDate,
  defaultCity,
  onRecordAdded,
}) => {
  const { user, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'notes' | 'addRecord'>('notes');

  // Note form state
  const [noteText, setNoteText] = useState('');
  const [noteDate, setNoteDate] = useState(defaultDate || '2026-09-12');
  const [noteCity, setNoteCity] = useState(defaultCity || 'Bangalore');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Add Record form state
  const [recordBrand, setRecordBrand] = useState('nafa');
  const [recordDate, setRecordDate] = useState('2026-09-30');
  const [recordCity, setRecordCity] = useState('');
  const [recordImpressions, setRecordImpressions] = useState('');
  const [recordGmv, setRecordGmv] = useState('');
  const [recordOrders, setRecordOrders] = useState('');
  const [recordNtb, setRecordNtb] = useState('');
  const [recordStatus, setRecordStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      signIn();
      return;
    }
    if (!noteText.trim()) return;

    setSubmittingNote(true);
    try {
      await addDataNote(user.uid, user.email || 'user', noteDate, noteCity, noteText.trim());
      setNoteText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      signIn();
      return;
    }
    if (!recordCity.trim()) {
      alert('Please enter a city name.');
      return;
    }

    try {
      await addCustomRecord(user.uid, {
        brand: recordBrand.trim().toLowerCase(),
        date: recordDate,
        city: recordCity.trim().toLowerCase(),
        impressions: Number(recordImpressions) || 0,
        gmv: Number(recordGmv) || 0,
        orders: Number(recordOrders) || 0,
        ntbBuyers: Number(recordNtb) || 0,
      });
      setRecordStatus('Record saved and synced to Firebase in real-time!');
      if (onRecordAdded) onRecordAdded();
      setTimeout(() => {
        setRecordStatus(null);
        setRecordCity('');
        setRecordImpressions('');
        setRecordGmv('');
        setRecordOrders('');
        setRecordNtb('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setRecordStatus('Error saving record');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              T
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Trrop Real-Time Hub & Collaboration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Powered by Firebase Cloud Firestore
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Collaborative Analysis Notes ({notes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('addRecord')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'addRecord'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Custom Record / Data</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'notes' ? (
            <div>
              {/* Note Submission Form */}
              <form onSubmit={handleCreateNote} className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3">
                  Write Anomaly or Performance Annotation:
                </h4>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Target Date</label>
                    <input
                      type="date"
                      value={noteDate}
                      onChange={(e) => setNoteDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">City Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore or All Cities"
                      value={noteCity}
                      onChange={(e) => setNoteCity(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Insight / Note Content</label>
                  <textarea
                    rows={2}
                    placeholder="e.g., On Sept 12 Bangalore generated highest single-day spike of ₹41k GMV driven by weekend promotions..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    maxLength={1000}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {user ? `Posting as ${user.email}` : 'Sign in required to post'}
                  </span>
                  <button
                    type="submit"
                    disabled={submittingNote}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
                  >
                    {user ? 'Save Note' : 'Sign in & Post'}
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Shared Insights ({notes.length})
                </h5>
                {notes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No notes posted yet. Be the first to add an analysis note!</p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="text-indigo-600 dark:text-indigo-400">{note.date}</span>
                          <span className="text-slate-400">•</span>
                          <span className="capitalize text-slate-700 dark:text-slate-300">{note.city || 'All Cities'}</span>
                        </div>
                        {user && user.uid === note.userId && (
                          <button
                            onClick={() => deleteDataNote(note.id)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed mb-2">
                        {note.note}
                      </p>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-1.5">
                        <span>By: {note.userEmail}</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Add Custom Record Form */
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200">
                Any custom sales or ad record entered here is saved to your personal Firebase cloud database and instantly updates all analytics, charts, and metrics!
              </div>

              {recordStatus && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{recordStatus}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Brand Name</label>
                  <select
                    value={recordBrand}
                    onChange={(e) => setRecordBrand(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value="nafa">nafa</option>
                    <option value="averx">averx</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore, Delhi, Pune..."
                    value={recordCity}
                    onChange={(e) => setRecordCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Ad Impressions</label>
                  <input
                    type="number"
                    placeholder="e.g. 3500"
                    value={recordImpressions}
                    onChange={(e) => setRecordImpressions(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Gross GMV (₹ Sales)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={recordGmv}
                    onChange={(e) => setRecordGmv(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Orders Count</label>
                  <input
                    type="number"
                    placeholder="e.g. 12"
                    value={recordOrders}
                    onChange={(e) => setRecordOrders(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">NTB Buyers (New To Brand)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={recordNtb}
                    onChange={(e) => setRecordNtb(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all"
                >
                  {user ? 'Save Record to Firebase' : 'Sign In with Google to Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

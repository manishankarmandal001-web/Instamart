import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { SalesRecord } from '../data/initialData';

export interface SavedFilter {
  id: string;
  userId: string;
  name: string;
  filterJson: string;
  createdAt: string;
}

export interface DataNote {
  id: string;
  userId: string;
  userEmail: string;
  date: string;
  city?: string;
  note: string;
  createdAt: string;
}

// Saved Filters
export async function saveFilterPreset(userId: string, name: string, filterData: object): Promise<string> {
  const filterId = 'flt_' + Date.now();
  const path = `users/${userId}/savedFilters/${filterId}`;
  try {
    const docRef = doc(db, 'users', userId, 'savedFilters', filterId);
    await setDoc(docRef, {
      userId,
      name,
      filterJson: JSON.stringify(filterData),
      createdAt: new Date().toISOString(),
    });
    return filterId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeSavedFilters(userId: string, callback: (filters: SavedFilter[]) => void) {
  const path = `users/${userId}/savedFilters`;
  const q = collection(db, 'users', userId, 'savedFilters');
  return onSnapshot(
    q,
    (snapshot) => {
      const filters: SavedFilter[] = [];
      snapshot.forEach((d) => {
        filters.push({ id: d.id, ...d.data() } as SavedFilter);
      });
      callback(filters);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteSavedFilter(userId: string, filterId: string): Promise<void> {
  const path = `users/${userId}/savedFilters/${filterId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'savedFilters', filterId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Real-time custom sales records added by user
export async function addCustomRecord(userId: string, record: Omit<SalesRecord, 'id' | 'aov' | 'conversionRate' | 'rpm' | 'salesTier' | 'dayOfWeek' | 'isTrafficLeak' | 'isSpike'>): Promise<string> {
  const recordId = 'rec_' + Date.now();
  const path = `users/${userId}/salesRecords/${recordId}`;
  try {
    const docRef = doc(db, 'users', userId, 'salesRecords', recordId);
    await setDoc(docRef, {
      userId,
      brand: record.brand,
      date: record.date,
      city: record.city,
      ntbBuyers: record.ntbBuyers || 0,
      impressions: record.impressions || 0,
      gmv: record.gmv || 0,
      orders: record.orders || 0,
      createdAt: new Date().toISOString(),
    });
    return recordId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeCustomRecords(userId: string, callback: (records: SalesRecord[]) => void) {
  const path = `users/${userId}/salesRecords`;
  const q = collection(db, 'users', userId, 'salesRecords');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return onSnapshot(
    q,
    (snapshot) => {
      const records: SalesRecord[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const dt = new Date(data.date + 'T00:00:00Z');
        const dayOfWeek = dayNames[dt.getUTCDay()] || 'Monday';
        const gmv = Number(data.gmv) || 0;
        const orders = Number(data.orders) || 0;
        const impressions = Number(data.impressions) || 0;
        let salesTier: 'zero' | 'low' | 'medium' | 'high' = 'zero';
        if (gmv >= 10000) salesTier = 'high';
        else if (gmv >= 1000) salesTier = 'medium';
        else if (gmv > 0) salesTier = 'low';

        records.push({
          id: d.id,
          brand: data.brand,
          date: data.date,
          city: data.city,
          ntbBuyers: Number(data.ntbBuyers) || 0,
          impressions,
          gmv,
          orders,
          aov: orders > 0 ? Math.round(gmv / orders) : 0,
          conversionRate: impressions > 0 ? Number(((orders / impressions) * 100).toFixed(2)) : 0,
          rpm: impressions > 0 ? Number(((gmv / impressions) * 1000).toFixed(1)) : 0,
          salesTier,
          dayOfWeek,
          isTrafficLeak: impressions >= 150 && gmv === 0,
          isSpike: gmv >= 15000,
        });
      });
      callback(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Real-time Collaborative Notes / Annotations on anomalies & dates
export async function addDataNote(userId: string, userEmail: string, date: string, city: string, note: string): Promise<string> {
  const noteId = 'not_' + Date.now();
  const path = `notes/${noteId}`;
  try {
    const docRef = doc(db, 'notes', noteId);
    await setDoc(docRef, {
      userId,
      userEmail,
      date,
      city: city || 'All Cities',
      note,
      createdAt: new Date().toISOString(),
    });
    return noteId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeDataNotes(callback: (notes: DataNote[]) => void) {
  const path = 'notes';
  const q = collection(db, 'notes');
  return onSnapshot(
    q,
    (snapshot) => {
      const notes: DataNote[] = [];
      snapshot.forEach((d) => {
        notes.push({ id: d.id, ...d.data() } as DataNote);
      });
      notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(notes);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteDataNote(noteId: string): Promise<void> {
  const path = `notes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'notes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

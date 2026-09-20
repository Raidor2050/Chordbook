import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getStore, isDuplicateError } from '../api/store.js';
import { assertCanSubmit, recordSubmission } from '../api/rateLimit.js';
import { editTokenFor, saveEditToken } from '../api/editTokens.js';

const Ctx = createContext(null);

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export function AppProvider({ children }) {
  const [store, setStore] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeError, setStoreError] = useState(null);
  const [query, setQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const refresh = useCallback(async () => {
    const s = await getStore();
    const list = await s.list();
    setSongs(list);
    return list;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await getStore();
        if (!alive) return;
        setStore(s);
        const list = await s.list();
        if (!alive) return;
        setSongs(list);
      } catch (err) {
        if (alive) setStoreError(err && err.message ? err.message : String(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const notify = useCallback((message, kind = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'err' ? 7000 : 3600);
  }, []);

  const addSong = useCallback(
    async (draft) => {
      const s = await getStore();
      assertCanSubmit();
      const res = await s.create(draft);
      recordSubmission();
      saveEditToken(res.song.id, res.editToken);
      await refresh();
      return res;
    },
    [refresh]
  );

  const updateSong = useCallback(
    async (song, patch, token) => {
      const s = await getStore();
      const updated = await s.update(song.slug || song.id, patch, token);
      await refresh();
      return updated;
    },
    [refresh]
  );

  const removeSong = useCallback(
    async (song, token) => {
      const s = await getStore();
      await s.remove(song.slug || song.id, token);
      await refresh();
    },
    [refresh]
  );

  const value = useMemo(
    () => ({
      store,
      songs,
      loading,
      storeError,
      refresh,
      addSong,
      updateSong,
      removeSong,
      notify,
      toasts,
      query,
      setQuery,
      isDuplicateError,
      editTokenFor,
      storeKind: store ? store.kind : null,
      storeLabel: store ? store.label : 'Loading…',
    }),
    [store, songs, loading, storeError, refresh, addSong, updateSong, removeSong, notify, toasts, query]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
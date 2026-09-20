import { useApp } from '../context/AppContext.jsx';

export default function StoreBadge() {
  const { storeKind, storeLabel, storeError } = useApp();
  if (storeError) {
    return (
      <span className="store-badge" title={storeError} data-kind="error">
        <span className="dot" style={{ background: '#d9605f' }} />
        Setup needed
      </span>
    );
  }
  const kind = storeKind === 'supabase' ? 'cloud' : 'local';
  const title =
    kind === 'cloud'
      ? storeLabel
      : 'Local draft mode — songs are saved in this browser. Add a Supabase backend to share the library.';
  return (
    <span className={`store-badge ${kind}`} title={title}>
      <span className="dot" />
      {kind === 'cloud' ? 'Shared library' : 'Local draft'}
    </span>
  );
}
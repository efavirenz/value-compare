import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Menu from './Menu';
import { strings, type Lang } from './i18n';
import {
  MAX_ITEMS,
  MIN_ITEMS,
  chooseDecimals,
  formatPercent,
  formatUnitPrice,
  itemLabel,
  rankItems,
  sanitizeNumber,
  type RowData,
  type Unit,
} from './logic';
import { loadState, saveState, type PersistedState } from './storage';
import { applyTheme, type ThemeId } from './themes';

interface Row extends RowData {
  id: number;
}
type Field = 'price' | 'qty';

interface ToastState {
  seq: number;
  text: string;
  duration: number;
  /** Rows to restore when the user taps Undo. */
  undoRows?: Row[];
}

const UNDO_MS = 5000;
const INFO_MS = 3000;

let nextRowId = 1;
const makeRow = (data?: Partial<RowData>): Row => ({
  id: nextRowId++,
  price: data?.price ?? '',
  qty: data?.qty ?? '',
});

const isEmptyRow = (r: RowData) => r.price === '' && r.qty === '';

function waitForInstalled(worker: ServiceWorker, timeoutMs = 20000): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      worker.removeEventListener('statechange', onChange);
      window.clearTimeout(timer);
      resolve();
    };
    const onChange = () => {
      if (worker.state !== 'installing') done();
    };
    const timer = window.setTimeout(done, timeoutMs);
    worker.addEventListener('statechange', onChange);
    onChange();
  });
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function App({ initial }: { initial: PersistedState }) {
  const [rows, setRows] = useState<Row[]>(() => initial.rows.map((r) => makeRow(r)));
  const [unit, setUnit] = useState<Unit>(initial.unit);
  const [lang, setLang] = useState<Lang>(initial.lang);
  const [theme, setTheme] = useState<ThemeId>(initial.theme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [checking, setChecking] = useState(false);
  const [focusReq, setFocusReq] = useState<{ id: number; field: Field } | null>(null);

  const t = strings[lang];
  const inputRefs = useRef(new Map<string, HTMLInputElement>());
  const pageRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const toastSeq = useRef(0);
  const registration = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const storageWarned = useRef(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      registration.current = reg;
    },
  });

  // ---- persistence & presentation -------------------------------------------------------------
  useEffect(() => {
    const success = saveState({ rows: rows.map(({ price, qty }) => ({ price, qty })), unit, lang, theme });
    if (!success && !storageWarned.current) {
      storageWarned.current = true;
      showToast(t.storageFailed, 5000);
    }
  }, [rows, unit, lang, theme, t.storageFailed]);

  // Synchronize state across multiple browser tabs (F-013)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'value-compare:state:v1') {
        const latest = loadState();
        setRows(latest.rows.map((r) => makeRow(r)));
        setUnit(latest.unit);
        setLang(latest.lang);
        setTheme(latest.theme);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    pageRef.current?.toggleAttribute('inert', menuOpen);
  }, [menuOpen]);

  // ---- toast ----------------------------------------------------------------------------------
  const showToast = (text: string, duration: number, undoRows?: Row[]) => {
    toastSeq.current += 1;
    setToast({ seq: toastSeq.current, text, duration, undoRows });
  };
  const dismissUndo = () => setToast((cur) => (cur?.undoRows ? null : cur));

  const toastSeqValue = toast?.seq;
  const toastDuration = toast?.duration ?? 0;
  useEffect(() => {
    if (toastSeqValue === undefined) return;
    const timer = window.setTimeout(() => {
      setToast((cur) => (cur && cur.seq === toastSeqValue ? null : cur));
    }, toastDuration);
    return () => window.clearTimeout(timer);
  }, [toastSeqValue, toastDuration]);

  // ---- service worker messages ----------------------------------------------------------------
  useEffect(() => {
    if (offlineReady) {
      showToast(t.offlineReady, INFO_MS);
      setOfflineReady(false);
    }
  }, [offlineReady, t.offlineReady]);

  useEffect(() => {
    if (needRefresh) showToast(t.updateAvailable, 5000);
  }, [needRefresh, t.updateAvailable]);

  const onVersionTap = async () => {
    if (checking) return;
    if (needRefresh) {
      showToast(t.updating, INFO_MS);
      await updateServiceWorker(true);
      return;
    }
    let reg = registration.current;
    if (!reg && 'serviceWorker' in navigator) {
      try {
        reg = (await navigator.serviceWorker.getRegistration()) ?? undefined;
        if (reg) registration.current = reg;
      } catch {
        // SW registration lookup failed
      }
    }
    if (!reg) {
      showToast(t.checkFailed, INFO_MS);
      return;
    }
    setChecking(true);
    try {
      await reg.update();
      if (reg.installing) await waitForInstalled(reg.installing);
      if (reg.waiting) {
        showToast(t.updating, INFO_MS);
        await updateServiceWorker(true);
      } else {
        showToast(t.latest, INFO_MS);
      }
    } catch {
      showToast(t.checkFailed, 4000);
    } finally {
      setChecking(false);
    }
  };

  // ---- focus ----------------------------------------------------------------------------------
  useEffect(() => {
    if (!focusReq) return;
    inputRefs.current.get(`${focusReq.id}:${focusReq.field}`)?.focus();
    setFocusReq(null);
  }, [focusReq]);

  // ---- row actions ----------------------------------------------------------------------------
  const onChange = (id: number, field: Field, raw: string) => {
    const value = sanitizeNumber(raw);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    dismissUndo(); // Undo would overwrite what the user is typing now
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number, field: Field) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (field === 'price') {
      setFocusReq({ id: rows[index].id, field: 'qty' });
    } else if (rows[index + 1]) {
      setFocusReq({ id: rows[index + 1].id, field: 'price' });
    } else {
      e.currentTarget.blur();
    }
  };

  const addRow = () => {
    if (rows.length >= MAX_ITEMS) return;
    const row = makeRow();
    setRows([...rows, row]);
    setFocusReq({ id: row.id, field: 'price' });
    dismissUndo();
  };

  const clearAll = () => {
    if (rows.length === MIN_ITEMS && rows.every(isEmptyRow)) return;
    showToast(t.cleared, UNDO_MS, rows);
    setRows(Array.from({ length: MIN_ITEMS }, () => makeRow()));
  };

  const deleteRow = (index: number) => {
    const target = rows[index];
    if (!target) return;
    const isLast = index === rows.length - 1;

    if (rows.length <= MIN_ITEMS && isLast) {
      // Minimum rows and last item: clear in place and wait at its price box.
      setFocusReq({ id: target.id, field: 'price' });
      if (isEmptyRow(target)) return;
      showToast(t.itemDeleted(itemLabel(index)), UNDO_MS, rows);
      setRows(rows.map((r, i) => (i === index ? { ...r, price: '', qty: '' } : r)));
      return;
    }

    // Remove the row; later items move up and are relabelled by position.
    let next = rows.filter((_, i) => i !== index);
    while (next.length < MIN_ITEMS) next = [...next, makeRow()];
    showToast(t.itemDeleted(itemLabel(index)), UNDO_MS, rows);
    setRows(next);
  };

  const undo = () => {
    if (!toast?.undoRows) return;
    setRows(toast.undoRows);
    setToast(null);
  };

  // ---- menu -----------------------------------------------------------------------------------
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => menuBtnRef.current?.focus());
  }, []);

  // ---- results --------------------------------------------------------------------------------
  const ranked = useMemo(() => rankItems(rows), [rows]);
  const bestIndexes = useMemo(
    () => new Set(ranked.filter((r) => r.rank === 1).map((r) => r.index)),
    [ranked],
  );
  const decimals = useMemo(() => chooseDecimals(ranked.map((r) => r.unitPrice)), [ranked]);

  return (
    <>
      <div className="page" ref={pageRef}>
        <header className="topbar">
          <button
            ref={menuBtnRef}
            type="button"
            className="icon-btn"
            aria-label={t.menu}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </button>
          <button
            type="button"
            className="version"
            aria-label={needRefresh ? t.versionAriaUpdate(__APP_VERSION__) : t.versionAria(__APP_VERSION__)}
            aria-busy={checking}
            onClick={onVersionTap}
          >
            v{__APP_VERSION__}
            {needRefresh && <span className="dot" aria-hidden="true" />}
          </button>
        </header>

        <main>
          <div className="cols head">
            <span />
            <span className="colhead">{t.price}</span>
            <div className="seg" role="radiogroup" aria-label={t.unitLabel}>
              {(['g', 'ml'] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  role="radio"
                  aria-checked={unit === u}
                  tabIndex={unit === u ? 0 : -1}
                  onClick={() => setUnit(u)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      setUnit(unit === 'g' ? 'ml' : 'g');
                    }
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
            <span />
          </div>

          <div className="rows">
            {rows.map((row, index) => {
              const label = itemLabel(index);
              const isBest = bestIndexes.has(index);
              const setRef = (field: Field) => (el: HTMLInputElement | null) => {
                const key = `${row.id}:${field}`;
                if (el) inputRefs.current.set(key, el);
                else inputRefs.current.delete(key);
              };
              return (
                <div key={row.id} className={`row cols${isBest ? ' is-best' : ''}`}>
                  <span className="label">{label}</span>
                  <input
                    ref={setRef('price')}
                    className="field"
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="next"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label={t.priceOf(label)}
                    value={row.price}
                    onChange={(e) => onChange(row.id, 'price', e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, index, 'price')}
                  />
                  <input
                    ref={setRef('qty')}
                    className="field"
                    type="text"
                    inputMode="decimal"
                    enterKeyHint={rows[index + 1] ? 'next' : 'done'}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label={t.qtyOf(label, unit)}
                    value={row.qty}
                    onChange={(e) => onChange(row.id, 'qty', e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, index, 'qty')}
                  />
                  <button
                    type="button"
                    className="del"
                    aria-label={t.removeItem(label)}
                    onClick={() => deleteRow(index)}
                  >
                    <CloseIcon />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="actions">
            <button
              type="button"
              className="pill"
              onClick={addRow}
              disabled={rows.length >= MAX_ITEMS}
              title={rows.length >= MAX_ITEMS ? t.maxItems : undefined}
            >
              {t.add}
            </button>
            <button type="button" className="pill clear" onClick={clearAll}>
              {t.clear}
            </button>
          </div>

          {ranked.length >= 2 && (
            <fieldset className="result">
              <legend>{t.result}</legend>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t.rank}</th>
                      <th>{t.item}</th>
                      <th>{t.price}</th>
                      <th>
                        {t.unitPrice}
                        <small>{t.perUnit(unit)}</small>
                      </th>
                      <th>{t.vsBest}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((r) => (
                      <tr key={r.index} className={r.rank === 1 ? 'best' : undefined}>
                        <td>{r.rank}</td>
                        <td>{r.label}</td>
                        <td>{r.priceText}</td>
                        <td>{formatUnitPrice(r.unitPrice, decimals)}</td>
                        <td>{formatPercent(r.pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </fieldset>
          )}
        </main>
      </div>

      {menuOpen && (
        <Menu t={t} lang={lang} theme={theme} onLang={setLang} onTheme={setTheme} onClose={closeMenu} />
      )}

      {/* Persistent live region container for screen reader announcements (F-006) */}
      <div
        className={`toast${toast ? '' : ' is-hidden'}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast && (
          <>
            <span>{toast.text}</span>
            {toast.undoRows && (
              <button type="button" onClick={undo}>
                {t.undo}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

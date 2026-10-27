import { useEffect, useRef } from 'react';
import type { Lang, Strings } from './i18n';
import { themes, type Theme, type ThemeId } from './themes';

interface MenuProps {
  t: Strings;
  lang: Lang;
  theme: ThemeId;
  onLang: (lang: Lang) => void;
  onTheme: (theme: ThemeId) => void;
  onClose: () => void;
}

function ThemeButton({
  theme,
  lang,
  selected,
  onPick,
  buttonRef,
}: {
  theme: Theme;
  lang: Lang;
  selected: boolean;
  onPick: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}) {
  const v = theme.vars;
  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      className="theme-btn"
      onClick={onPick}
    >
      <span className="swatch" style={{ background: v.bg, borderColor: v.line }} aria-hidden="true">
        <i style={{ background: v.best }} />
        <i style={{ background: v.clear }} />
        <i style={{ background: v.text }} />
      </span>
      <span>{theme.name[lang]}</span>
    </button>
  );
}

export default function Menu({ t, lang, theme, onLang, onTheme, onClose }: MenuProps) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const themeRefs = useRef<Map<ThemeId, HTMLButtonElement>>(new Map());
  const langRefs = useRef<Map<Lang, HTMLButtonElement>>(new Map());

  // Focus close button on mount once (F-003)
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Keyboard navigation: Escape and Tab focus trap (N-005)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        if (!drawerRef.current) return;
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]):not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onLangKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const nextLang = lang === 'en' ? 'th' : 'en';
      onLang(nextLang);
      langRefs.current.get(nextLang)?.focus();
    }
  };

  const onThemeKeyDown = (e: React.KeyboardEvent) => {
    const idx = themes.findIndex((th) => th.id === theme);
    if (idx === -1) return;
    let nextIdx = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (idx + 1) % themes.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (idx - 1 + themes.length) % themes.length;
    } else {
      return;
    }
    const nextTheme = themes[nextIdx].id;
    onTheme(nextTheme);
    themeRefs.current.get(nextTheme)?.focus();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <aside
        ref={drawerRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t.settings}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <h2>{t.settings}</h2>
          <button ref={closeRef} type="button" className="icon-btn small" aria-label={t.close} onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>

        <section>
          <h3>{t.language}</h3>
          <div className="seg wide" role="radiogroup" aria-label={t.language} onKeyDown={onLangKeyDown}>
            {(['en', 'th'] as Lang[]).map((code) => (
              <button
                key={code}
                ref={(el) => {
                  if (el) langRefs.current.set(code, el);
                  else langRefs.current.delete(code);
                }}
                type="button"
                role="radio"
                aria-checked={lang === code}
                tabIndex={lang === code ? 0 : -1}
                onClick={() => onLang(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>{t.theme}</h3>
          <div role="radiogroup" aria-label={t.theme} onKeyDown={onThemeKeyDown}>
            {([false, true] as const).map((dark) => (
              <div key={String(dark)} className="theme-group">
                <h4>{dark ? t.darkThemes : t.lightThemes}</h4>
                <div className="themes">
                  {themes
                    .filter((th) => th.dark === dark)
                    .map((th) => (
                      <ThemeButton
                        key={th.id}
                        theme={th}
                        lang={lang}
                        selected={theme === th.id}
                        buttonRef={(el) => {
                          if (el) themeRefs.current.set(th.id, el);
                          else themeRefs.current.delete(th.id);
                        }}
                        onPick={() => onTheme(th.id)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

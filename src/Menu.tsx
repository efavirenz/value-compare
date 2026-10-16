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

function ThemeButton({ theme, lang, selected, onPick }: {
  theme: Theme;
  lang: Lang;
  selected: boolean;
  onPick: () => void;
}) {
  const v = theme.vars;
  return (
    <button type="button" role="radio" aria-checked={selected} className="theme-btn" onClick={onPick}>
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
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <aside
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
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>

        <section>
          <h3>{t.language}</h3>
          <div className="seg wide" role="radiogroup" aria-label={t.language}>
            {(['en', 'th'] as Lang[]).map((code) => (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={lang === code}
                onClick={() => onLang(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3>{t.theme}</h3>
          <div role="radiogroup" aria-label={t.theme}>
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

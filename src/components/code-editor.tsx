'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
type Editor = { setValue(value: string): void; setDisabled(value: boolean): void; focus(): void; dispose(): void };
type EditorLibrary = { create(container: HTMLElement, value: string, label: string, onChange: (value: string) => void, onEscape: () => void): Editor };
declare global { interface Window { VibeCodeEditor?: EditorLibrary } }
let loading: Promise<EditorLibrary> | undefined;
function loadEditor() {
  if (window.VibeCodeEditor) return Promise.resolve(window.VibeCodeEditor);
  return loading ??= new Promise<EditorLibrary>((resolve, reject) => {
    if (!document.querySelector('link[data-code-editor]')) {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/editor-assets/editor.css'; css.dataset.codeEditor = 'true'; document.head.appendChild(css);
    }
    const script = document.createElement('script'); script.src = '/editor-assets/editor.js';
    script.nonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content') || '';
    script.onload = () => window.VibeCodeEditor ? resolve(window.VibeCodeEditor) : reject(new Error('Editor unavailable.'));
    script.onerror = () => { loading = undefined; script.remove(); reject(new Error('Editor unavailable.')); };
    document.head.appendChild(script);
  });
}
export function CodeEditor({ id, value, onChange, describedBy, disabled }: { id: string; value: string; onChange(value: string): void; describedBy: string; disabled: boolean }) {
  const [advanced, setAdvanced] = useState(false), [status, setStatus] = useState('');
  const container = useRef<HTMLDivElement>(null), toggle = useRef<HTMLButtonElement>(null), editor = useRef<Editor | null>(null);
  const latest = useRef({ value, onChange, disabled }); latest.current = { value, onChange, disabled };
  useEffect(() => {
    if (!advanced) return;
    let cancelled = false; setStatus('Loading advanced editor…');
    loadEditor().then(library => {
      if (cancelled || !container.current) return;
      const instance = library.create(container.current, latest.current.value, 'Your TypeScript code. Tab moves out of the editor. Escape returns to the editor switch.', next => {
        if (next.length > 20000) { instance.setValue(latest.current.value); setStatus('Code is limited to 20,000 characters.'); return; }
        latest.current.onChange(next);
      }, () => toggle.current?.focus());
      editor.current = instance; instance.setDisabled(latest.current.disabled); instance.focus(); setStatus('Advanced editor ready. Tab moves between controls; Escape returns to the editor switch.');
    }).catch(() => { if (!cancelled) { setAdvanced(false); setStatus('Advanced editor could not load. Your code is available in the plain editor.'); } });
    return () => { cancelled = true; editor.current?.dispose(); editor.current = null; };
  }, [advanced]);
  useEffect(() => { editor.current?.setValue(value); editor.current?.setDisabled(disabled); }, [value, disabled]);
  return <div className="code-editor-shell">
    <Button ref={toggle} type="button" variant="secondary" disabled={disabled} aria-pressed={advanced} onClick={() => setAdvanced(!advanced)}>{advanced ? 'Use plain editor' : 'Use advanced editor'}</Button>
    <p className="small-muted" role="status" aria-live="polite">{status || 'Plain editor is ready. Optional advanced editing adds syntax colors and line numbers.'}</p>
    {advanced ? <div ref={container} id={id} className="monaco-host" aria-describedby={describedBy} /> : <textarea id={id} className="practice-editor" value={value} onChange={event => onChange(event.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" maxLength={20000} rows={14} aria-describedby={describedBy} disabled={disabled} />}
  </div>;
}

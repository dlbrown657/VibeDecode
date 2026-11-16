'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Bookmark, Check, Code2, FileCode2, LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { AnalysisView } from './analysis-view';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { LearningRewards } from './learning-rewards';
import { hybridSampleAnalysis, sampleProject } from '@/lib/sample';
import type { Analysis, Exercise, Project } from '@/lib/model';

type Preview = { id: string; label: string; project: Project; analysis: Analysis };

export function Workspace({ preview, showLocalReport = false }: { preview?: Preview; showLocalReport?: boolean }) {
  const analysis = preview?.analysis ?? hybridSampleAnalysis;
  const project = preview?.project ?? sampleProject;
  const analysisId = preview?.id ?? 'sample';
  const savedKey = preview ? `codeatlas-${analysisId}-saved` : 'codeatlas-sample-saved';
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [initialTab, setInitialTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const ids: unknown = JSON.parse(localStorage.getItem(savedKey) ?? '[]');
      if (Array.isArray(ids)) setSavedIds(ids.filter(id => typeof id === 'string'));
    } catch { /* Browser storage may be unavailable. */ }
  }, [savedKey]);

  function save(exercise: Exercise) {
    const wasSaved = savedIds.includes(exercise.id);
    const next = wasSaved ? savedIds.filter(id => id !== exercise.id) : [...savedIds, exercise.id];
    setSavedIds(next);
    try {
      localStorage.setItem(savedKey, JSON.stringify(next));
      setNotice(wasSaved ? 'Exercise removed.' : 'Exercise saved in this browser.');
    } catch { setNotice('Saved for this session only.'); }
  }

  function showTab(tab: string) {
    setSavedOpen(false);
    setMenuOpen(false);
    setInitialTab(tab);
  }

  function openPractice() {
    showTab('practice');
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[role="tab"][data-state="active"]')?.focus({ preventScroll: true });
      document.querySelector('[role="tablist"]')?.scrollIntoView({ block: 'start' });
    });
  }

  const saved = analysis.exercises.filter(exercise => savedIds.includes(exercise.id));
  const results = [
    { title: 'Architecture and system overview', tab: 'overview', detail: analysis.summary },
    ...analysis.concepts.map(item => ({ title: item.title, tab: 'concepts', detail: item.explanation })),
    ...analysis.exercises.map(item => ({ title: item.title, tab: 'practice', detail: `${item.pattern} ${item.difficulty}` })),
    ...(analysis.debugChallenges ?? []).map(item => ({ title: item.title, tab: 'debug', detail: item.symptom })),
    ...(analysis.recallExercises ?? []).map(item => ({ title: item.title, tab: 'recall', detail: item.whatItDoes })),
    ...analysis.interviews.map(item => ({ title: item.question, tab: 'interview', detail: item.category })),
    ...analysis.roadmap.map(item => ({ title: item.title, tab: 'roadmap', detail: item.category })),
  ].filter(item => `${item.title} ${item.detail}`.toLowerCase().includes(query.toLowerCase())).slice(0, 12);

  return (
    <div className={`app-shell ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      {menuOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`} id="workspace-navigation" aria-label="Workspace navigation">
        <Link className="brand" href="/"><span className="brand-mark"><Code2 size={22} /></span>VibeDecode<span className="brand-period">.</span></Link>
        <button className="sidebar-search" onClick={() => setSearchOpen(true)}><Search size={16} />Search analysis</button>
        <nav className="main-nav" aria-label="Workspace">
          <button className={savedOpen ? '' : 'active'} onClick={() => showTab('overview')}><LayoutDashboard size={18} />Overview</button>
          <button className={savedOpen ? 'active' : ''} onClick={() => { setSavedOpen(true); setMenuOpen(false); }}><Bookmark size={18} />Saved practice{saved.length > 0 && <span>{saved.length}</span>}</button>
        </nav>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button className="sidebar-toggle" onClick={() => setSidebarHidden(!sidebarHidden)} aria-label={sidebarHidden ? 'Show sidebar' : 'Hide sidebar'} title={sidebarHidden ? 'Show sidebar' : 'Hide sidebar'} aria-expanded={!sidebarHidden} aria-controls="workspace-navigation">
              {sidebarHidden ? <PanelLeftOpen size={21} /> : <PanelLeftClose size={21} />}
            </button>
            <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen} aria-controls="workspace-navigation"><Menu size={21} /></button>
            <span>{project.name}</span>
          </div>
          <div className="topbar-actions">
            <Button asChild size="sm" variant="secondary"><Link href="/demo">Sample</Link></Button>
            {showLocalReport && <Button asChild size="sm" variant="secondary"><Link href="/local">Local report</Link></Button>}
            {showLocalReport && <Button asChild size="sm" variant="secondary"><Link href="/compare">Compare changes</Link></Button>}
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="main-content">
          <p className="sr-only" role="status">{notice}</p>
          {savedOpen ? (
            <section className="saved-library" aria-label="Saved practice">
              {saved.length ? saved.map(exercise => (
                <article className="card saved-card" key={exercise.id}>
                  <Bookmark size={20} /><h2>{exercise.title}</h2><p>{exercise.connection}</p>
                  <Button variant="secondary" onClick={openPractice}>Open practice <ArrowRight size={15} /></Button>
                </article>
              )) : <div className="empty-state"><Bookmark size={32} /><h2>Saved practice</h2><p>Bookmark an exercise in the Practice tab to find it here.</p><Button onClick={openPractice}>Explore practice</Button></div>}
            </section>
          ) : (
            <>
              {preview && <section className="config-notice"><strong>{preview.label}</strong><p>Review the explanations and exercises against your source code.</p></section>}
              <div className="project-header">
                <div className="project-title">
                  <span className="project-symbol"><Code2 size={25} /></span>
                  <div><div className="project-title-row"><h1>{project.name}</h1><span className="badge ready"><Check size={11} />Analysis ready</span></div><p>{project.files.length} files · {project.languages.length} languages</p></div>
                </div>
              </div>
              <div className="stat-grid">
                <Stat label="Source lines" value={project.total_loc} icon={<FileCode2 size={17} />} />
                <Stat label="Core concepts" value={analysis.concepts.length} icon={<Code2 size={17} />} />
                <Stat label="Practice challenges" value={analysis.exercises.length + (analysis.debugChallenges?.length ?? 0) + (analysis.recallExercises?.length ?? 0)} icon={<Sparkles size={17} />} />
                <Stat label="Improvements" value={analysis.roadmap.length} icon={<ShieldCheck size={17} />} />
              </div>
              <LearningRewards key={preview ? analysisId : 'demo'} scope={preview ? analysisId : 'demo'} onPractice={openPractice} />
              <AnalysisView key={`${project.id}:${initialTab}`} analysisId={analysisId} project={project} analysis={analysis} savedIds={savedIds} onSave={save} initialTab={initialTab} />
            </>
          )}
        </main>
      </div>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogTitle>Search analysis</DialogTitle>
          <DialogDescription>Find explanations, practice questions, and improvements.</DialogDescription>
          <label className="field">Search analysis<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <div className="search-results">
            {results.map((item, index) => <button key={index} onClick={() => { showTab(item.tab); setSearchOpen(false); }}><Search size={15} /><span><strong>{item.title}</strong><small>{item.tab}</small></span><ArrowRight size={15} /></button>)}
            {results.length === 0 && <p>No matches.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="stat-card"><div><span>{label}</span>{icon}</div><strong>{value.toLocaleString()}</strong></div>;
}

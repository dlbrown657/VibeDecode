'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="standalone"><h1>The workspace couldn’t load.</h1><p>Your saved projects have not been changed.</p><button className="button button-primary" onClick={reset}>Try again</button></main>; }

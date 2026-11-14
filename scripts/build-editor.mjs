import { build } from 'esbuild';
import { readFile, mkdir, copyFile } from 'node:fs/promises';
await mkdir('public/editor-assets',{recursive:true});
// Monaco creates theme styles dynamically. Attach the current page nonce at build time;
// never relax script/style CSP or turn uploaded code into HTML.
const nonceStyles = { name:'monaco-csp-nonce', setup(builder) {
  builder.onLoad({filter:/domStylesheets\.js$/},async ({path})=>{
    const source=await readFile(path,'utf8');
    const needle="const style = document.createElement('style');";
    if(!source.includes(needle))throw new Error('Review Monaco CSP integration after dependency upgrades.');
    return {contents:source.replace(needle, needle+"\n    style.nonce = document.querySelector('meta[name=\"csp-nonce\"]')?.getAttribute('content') || '';"),loader:'js'};
  });
}};
await build({entryPoints:['src/editor/entry.ts'],bundle:true,format:'iife',globalName:'VibeCodeEditor',outfile:'public/editor-assets/editor.js',minify:true,target:'es2022',loader:{'.ttf':'file'},assetNames:'[name]-[hash]',plugins:[nonceStyles]});
await build({entryPoints:['node_modules/monaco-editor/esm/vs/editor/editor.worker.js'],bundle:true,format:'esm',outfile:'public/editor-assets/editor.worker.js',minify:true,target:'es2022'});
await copyFile('node_modules/monaco-editor/LICENSE','public/editor-assets/LICENSE.txt');

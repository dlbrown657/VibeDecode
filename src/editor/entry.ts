import * as monaco from 'monaco-editor/editor/editor.api';
import { language, conf } from 'monaco-editor/languages/definitions/typescript/typescript.js';
self.MonacoEnvironment = { getWorker: () => new Worker('/editor-assets/editor.worker.js', { type: 'module' }) };
monaco.languages.register({ id: 'typescript' });
monaco.languages.setMonarchTokensProvider('typescript', language);
monaco.languages.setLanguageConfiguration('typescript', conf);
export function create(container: HTMLElement, value: string, label: string, onChange: (value: string)=>void, onEscape: ()=>void) {
  const editor = monaco.editor.create(container, { value, language:'typescript', theme:'vs', automaticLayout:true, minimap:{enabled:false}, fontSize:14, lineNumbers:'on', scrollBeyondLastLine:false, wordWrap:'on', tabFocusMode:true, accessibilitySupport:'on', editContext:false, ariaLabel:label, suggestOnTriggerCharacters:false, quickSuggestions:false, hover:{enabled:'off'}, contextmenu:false });
  const listener = editor.onDidChangeModelContent(()=>onChange(editor.getValue()));
  const key = editor.onKeyDown(event=>{if(event.keyCode===monaco.KeyCode.Escape){event.preventDefault();onEscape();}});
  return { setValue:(next:string)=>{if(editor.getValue()!==next)editor.setValue(next);}, setDisabled:(readOnly:boolean)=>editor.updateOptions({readOnly}), focus:()=>editor.focus(), dispose:()=>{listener.dispose();key.dispose();editor.getModel()?.dispose();editor.dispose();} };
}

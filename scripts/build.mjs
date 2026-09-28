import {rm,mkdir,cp} from 'node:fs/promises';
import {build} from 'esbuild';
await rm('www',{recursive:true,force:true});await mkdir('www',{recursive:true});
await cp('public','www',{recursive:true});
await build({entryPoints:['src/app.mjs'],outfile:'www/app.js',bundle:true,format:'iife',platform:'browser',target:'es2020'});

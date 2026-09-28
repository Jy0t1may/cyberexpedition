import test from 'node:test';import assert from 'node:assert/strict';import {toggle,move,complete,decodeRoute} from '../src/roadmap.mjs';
test('old saved roadmap migrates without losing course IDs',()=>assert.deepEqual(decodeRoute(null,'["cert-2"]',new Set(['cert-2'])),{ids:['cert-2'],done:[]}));
test('completion toggles independently and remove clears completed state',()=>{const one={ids:['cert-2','cert-3'],done:[]};assert.deepEqual(complete(one,'cert-2'),{ids:['cert-2','cert-3'],done:['cert-2']});assert.deepEqual(toggle(complete(one,'cert-2'),'cert-2'),{ids:['cert-3'],done:[]})});
test('reorder preserves completion state',()=>assert.deepEqual(move({ids:['cert-2','cert-3'],done:['cert-2']},'cert-2',1),{ids:['cert-3','cert-2'],done:['cert-2']}));

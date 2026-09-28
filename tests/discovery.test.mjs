import test from 'node:test';import assert from 'node:assert/strict';import {normalize,filterNews,filterCerts,categoriesFor} from '../src/discovery.mjs';
test('normalizes accents punctuation and spacing',()=>assert.equal(normalize('  Sécurity-+  '),'security'));
test('certificate search ignores punctuation case and matches acronym',()=>{const c={acronym:'CCNA',full_name:'Cisco Certified Network Associate',main_domain:'network'};assert.deepEqual(filterCerts([c],'  c.c.n.a ', 'all'),[c])});
test('source and category filters combine and categories include aliases',()=>{const a={source:'sans',title:'New cloud vulnerability',tags:['ai-security']},b={source:'krebs',title:'Breach',tags:['breach']};assert.deepEqual(filterNews([a,b],{source:'sans',categories:['vulnerability'],query:''}),[a]);assert.ok(categoriesFor(a).includes('ai-security'))});
test('unknown categories stay Other, not invented',()=>assert.deepEqual(categoriesFor({title:'Weekly briefing',extract:''}),['other']));

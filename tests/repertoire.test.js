import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterSongs } from '../src/scripts/repertoire.js';
const {songs}=JSON.parse(readFileSync(new URL('../public/content.json',import.meta.url)));
test('import has complete metadata and no duplicate title/artist pairs',()=>{
  assert.ok(songs.length>500);
  const pairs=new Set();
  for(const s of songs){
    for(const k of ['title','artist','genre','decade'])assert.ok(s[k]?.trim(),`${s.title}: missing ${k}`);
    assert.match(s.decade,/^(18|19|20)\d0s$/);
    const pair=(s.title+'|'+s.artist).normalize('NFD').toLowerCase().replace(/[\u0300-\u036f\W_]/g,'');
    assert.ok(!pairs.has(pair),`Duplicate: ${s.title} / ${s.artist}`);pairs.add(pair);
  }
});
test('artist, genre, decade and text search combine without leaking other versions',()=>{
  const result=filterSongs(songs,{query:'gravity',artist:'Sara Bareilles',genre:'Pop',decade:'2000s'});
  assert.equal(result.length,1);assert.equal(result[0].artist,'Sara Bareilles');
  assert.equal(filterSongs(songs,{query:'gravity',artist:'John Mayer',decade:'1990s'}).length,0);
});
test('search handles accents and omitted apostrophes, and clearing returns the full list',()=>{
  assert.ok(filterSongs(songs,{query:'dont stop believin'}).some(s=>s.artist==='Journey'));
  assert.ok(filterSongs(songs,{query:'buble home'}).some(s=>s.title==='Home'));
  assert.equal(filterSongs(songs).length,songs.length);
});
test('user clarified songs and both explicitly listed Gravity and Hello versions survive import',()=>{
  for(const [title,artist] of [['The Load-Out','Jackson Browne'],['Wildflower','Skylark'],['Your Side of the Bed','Little Big Town'],['Gravity','John Mayer'],['Gravity','Sara Bareilles'],['Hello','Lionel Richie'],['Hello','Adele']]){
    assert.ok(songs.some(s=>s.title===title&&s.artist===artist),`${title} / ${artist}`);
  }
});

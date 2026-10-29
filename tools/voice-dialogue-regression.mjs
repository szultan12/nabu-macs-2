import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
 const page=await browser.newPage();
 await page.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:8130'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:8130/nabu_macs/preview.html');
 const result=await page.evaluate(async()=>{
   const {AssistPipelineTracker}=await import('/nabu_macs/backend/assistPipeline.js');
   let callback,unsub=0,events=[],reads=0;
   const tracker=new AssistPipelineTracker();
   tracker.setConfig({assist_pipeline_enabled:true,assist_pipeline_entity:'test',assist_satellite_entity:'assist_satellite.test'});
   tracker.setHass({connection:{subscribeEvents:async fn=>{callback=fn;return ()=>unsub++;}},callWS:async req=>{
     reads++;return req.type.endsWith('/list')?{pipeline_runs:[{pipeline_run_id:'one'}]}:{events};
   }});
   await new Promise(r=>setTimeout(r,1300));
   const before=reads;
   events=[null,{type:'stt-end',data:{stt_output:{text:'Teszt kérdés'}}}];
   callback({data:{entity_id:'assist_satellite.other'}});
   await new Promise(r=>setTimeout(r,200));
   const unrelatedIgnored=before===reads;
   callback({data:{entity_id:'assist_satellite.test'}});
   await new Promise(r=>setTimeout(r,200));
   const heard=tracker.getTurns()[0]?.heard;
   events.push({type:'intent-end',data:{intent_output:{response:{speech:{plain:{speech:'Teszt válasz'}}}}}});
   callback({data:{entity_id:'assist_satellite.test'}});
   await new Promise(r=>setTimeout(r,1500));
   const turns=tracker.getTurns();
   const malformed=tracker.extract([null,{type:'stt-end',data:{stt_output:{text:{bad:true}}}},{type:'error',data:{code:'aborted'}}]);
   tracker.dispose();const end=reads;
   await new Promise(r=>setTimeout(r,1000));
   return {unrelatedIgnored,heard,turns,malformed,unsub,stopped:end===reads};
 });
 assert.equal(result.unrelatedIgnored,true);assert.equal(result.heard,'Teszt kérdés');
 assert.equal(result.turns.length,1);assert.equal(result.turns[0].reply,'Teszt válasz');
 assert.equal(result.malformed.heard,'');assert.match(result.malformed.error,/aborted/);
 assert.equal(result.unsub,1);assert.equal(result.stopped,true);
 console.log('PASS: satellite-triggered debug history, partial/completed run, deduplication, malformed/aborted events, disposal (mock HA API, real browser module).');
} finally {await browser.close();}

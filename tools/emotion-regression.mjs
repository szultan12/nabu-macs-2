import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {comparePng,decodePng} from './pngMetrics.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
const errors=[],screenshots=path.resolve('docs/screenshots');
await fs.mkdir(screenshots,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{if(new URL(route.request().url()).origin!=='http://127.0.0.1:8130'){errors.push('External request blocked');return route.abort();}return route.continue();});
 await page.goto('http://127.0.0.1:8130/nabu_macs/preview.html');
 await page.evaluate(async()=>{
   await import('/nabu_macs/macs.js?v=2.0.0-dev.17');
   const Card=customElements.get('nabu-macs-card'),editor=Card.getConfigElement(),card=document.createElement('nabu-macs-card');
   const config={type:'custom:nabu-macs-card',emotion:'happy',emotion_debug:true,emotion_enabled:true,emotion_intensity:100,emotion_mix:{idle:100},transition_ms:0,reduced_motion:false,natural_motion_enabled:false,diagnostics_enabled:true,speech_enabled:true,speech_style:'auto',speech_speed:1,speech_media_player:'media_player.test_speech',assist_pipeline_enabled:false,assist_satellite_enabled:false};
   const hass={states:{'select.nabu_macs_mood':{state:'idle'},'switch.nabu_macs_animations_enabled':{state:'on'}},connection:{subscribeEvents:async()=>()=>{}},callWS:async()=>({pipelines:[]})};
   card.setConfig(config);card.style.cssText='display:block;width:540px;height:600px;';
   const editorHost=document.createElement('section');editorHost.style.cssText='box-sizing:border-box;width:540px;max-width:100%;padding:12px;border:1px solid #777;';
   editor.hass=hass;editor.setConfig(config);editorHost.append(editor);document.body.replaceChildren(card,editorHost);card.hass=hass;
   editor.addEventListener('config-changed',event=>card.setConfig(event.detail.config));
   window.nabuLovelaceEmotionTest={card,editor,hass,config};
 });
 await page.waitForFunction(()=>window.nabuLovelaceEmotionTest?.card?._iframeBootstrapped===true,{},{timeout:60000});
 const frame=page.frames().find(candidate=>candidate.url().includes('/macs.html'));
 assert.ok(frame,'real Lovelace card iframe is present');
 await frame.waitForFunction(()=>document.getElementById('avatar3d')?.dataset.rig==='calibrated',null,{timeout:60000});
 await frame.waitForFunction(()=>window.nabuEmotionSnapshot?.().rig.meshes.some(m=>m.smile>.7));
 const snapshot=await frame.evaluate(()=>window.nabuEmotionSnapshot());
 assert.equal(snapshot.controller.mood,'happy');
 assert.equal(Object.keys(snapshot.rig.meshes[0]).length,19);
 assert.ok(!JSON.stringify(snapshot).includes('media_player'));
 const moods=['surprised','happy','angry','laughing','sleeping'],images={},morphs={};
 for(const mood of moods){
   await page.evaluate(value=>{const control=window.nabuLovelaceEmotionTest.editor.shadowRoot.querySelector('#setting-emotion');control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}));},mood);
   await page.waitForFunction(value=>document.querySelector('nabu-macs-card')?._lastMood===value,mood,{timeout:10000});
   await frame.waitForFunction(value=>document.documentElement.dataset.emotion===value,mood,{timeout:10000});
   await frame.waitForFunction(()=>{const host=document.getElementById('avatar3d');return host?.dataset.applied&&Object.keys(JSON.parse(host.dataset.applied)).length===19;},null,{timeout:10000});
   morphs[mood]=await frame.locator('#avatar3d').evaluate(host=>JSON.parse(host.dataset.applied));
   images[mood]=await frame.locator('#avatar3d').screenshot({path:path.join(screenshots,`lovelace-emotion-${mood}.png`)});
 }
 const distinct={};
 for(let i=0;i<moods.length;i++)for(let j=i+1;j<moods.length;j++){
   const a=moods[i],b=moods[j],diff=comparePng(decodePng(images[a]),decodePng(images[b]));
   assert.ok(diff.changedFraction>.001&&diff.meanRgbDelta>.08,`${a} and ${b} produce visibly distinct 3D renders: ${JSON.stringify(diff)}`);
   assert.ok(Object.keys(morphs[a]).some(key=>Math.abs(morphs[a][key]-morphs[b][key])>.05),`${a} and ${b} differ in applied GLB morph targets`);
   distinct[`${a}:${b}`]=diff;
 }
 const cardConfig=await page.evaluate(()=>window.nabuLovelaceEmotionTest.card._config);
 assert.equal(cardConfig.emotion,'sleeping');assert.deepEqual(cardConfig.emotion_mix,{});
 const legacyState=await page.evaluate(async()=>{const {card,hass}=window.nabuLovelaceEmotionTest;hass.states['select.nabu_macs_mood']={state:'furious'};card.hass=hass;return {selected:card._lastMood,configured:card._config.emotion};});
 assert.equal(legacyState.selected,'sleeping','HA mood select does not override the explicit manual Lovelace emotion');
 await page.evaluate(()=>{const editor=window.nabuLovelaceEmotionTest.editor,emotion=editor.shadowRoot.querySelector('#setting-emotion');emotion.value='idle';emotion.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.waitForFunction(()=>window.nabuLovelaceEmotionTest.card._lastMood==='idle');
 const readApplied=()=>frame.locator('#avatar3d').evaluate(host=>JSON.parse(host.dataset.applied));
 await page.locator('nabu-macs-card-editor-v2').locator('details.nabu-personality-settings').evaluate(el=>el.open=true);
 const speechTests=[];
 for(const style of ['auto','normal']){
   await page.evaluate(value=>{const editor=window.nabuLovelaceEmotionTest.editor,select=editor.shadowRoot.querySelector('#setting-speech_style');select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));},style);
   await page.waitForFunction(value=>window.nabuLovelaceEmotionTest.card._config.speech_style===value,style);
   const configBefore=await page.evaluate(()=>JSON.stringify(window.nabuLovelaceEmotionTest.card._config));
   await page.locator('nabu-macs-card-editor-v2').locator('#nabu-speech-test').click();
   await page.locator('nabu-macs-card-editor-v2').locator('#nabu-speech-test-status').filter({hasText:'aktív'}).waitFor({timeout:5000});
   assert.equal(await page.evaluate(()=>JSON.stringify(window.nabuLovelaceEmotionTest.card._config)),configBefore,'speech test button does not persist a config change');
   const samples=[];
   for(let i=0;i<10;i++){await page.waitForTimeout(100);samples.push((await readApplied()).jawOpen);}
   assert.ok(Math.max(...samples)>.15,`${style} test produces real GLB jawOpen morph values: ${samples}`);
   assert.ok(new Set(samples.map(value=>value.toFixed(2))).size>2,`${style} test has changing speech cadence`);
   await page.locator('nabu-macs-card-editor-v2').locator('#nabu-speech-test-status').filter({hasText:'befejezve'}).waitFor({timeout:9500});
   await page.waitForTimeout(100);const returned=await readApplied();assert.ok(returned.jawOpen<.04,`${style} test returns GLB jaw to the idle pose: ${returned.jawOpen}`);
   speechTests.push({style,maximumJawOpen:Math.max(...samples),afterTestJawOpen:returned.jawOpen,durationMs:8000});
 }
 await page.evaluate(()=>{const {card,hass}=window.nabuLovelaceEmotionTest;hass.states['media_player.test_speech']={state:'playing'};card.hass=hass;});
 await frame.waitForFunction(()=>Number(JSON.parse(document.getElementById('avatar3d').dataset.applied||'{}').jawOpen)>.15,null,{timeout:5000});
 const mediaPlayingJaw=(await readApplied()).jawOpen;
 await page.evaluate(()=>{const {card,hass}=window.nabuLovelaceEmotionTest;hass.states['media_player.test_speech']={state:'paused'};card.hass=hass;});
 await frame.waitForFunction(()=>Number(JSON.parse(document.getElementById('avatar3d').dataset.applied||'{}').jawOpen)<.04,null,{timeout:5000});
 assert.ok(mediaPlayingJaw>.15,'real HA media_player playing snapshot starts mouth movement');
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(screenshots,'lovelace-emotion-qa.json'),JSON.stringify({moods,renderedThrough:'registered editor config-changed → MacsCard.setConfig → authenticated iframe postMessage → emotionController → GLB morph influences',distinct,manualMoodWinsOverHaSelect:true,speechTests,mediaPlayingJaw,mediaPausedJaw:(await readApplied()).jawOpen,errors},null,2));
 const gallery=`<!doctype html><html lang="hu"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nabu Lovelace érzelem-útvonal teszt</title><style>body{margin:24px;background:#0b1118;color:#e6f1fa;font:16px system-ui}main{max-width:1200px;margin:auto}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}figure{margin:0;background:#131c25;border-radius:12px;padding:12px}img{display:block;width:100%;border-radius:8px}figcaption{padding:8px 2px;font-weight:600}</style><main><h1>Lovelace editor → kártya → iframe → 3D-avatar</h1><p>Az alábbi renderképeket a tényleges regisztrált Nabu kártyaszerkesztőből kiválasztott érzelmekkel rögzítette az offline Playwright-teszt.</p><section>${moods.map(mood=>`<figure><img src="screenshots/lovelace-emotion-${mood}.png" alt="${mood}"><figcaption>${mood}</figcaption></figure>`).join('')}</section><p><a href="screenshots/lovelace-emotion-qa.json">Teljes automatizált mérési jelentés</a></p></main></html>`;
 await fs.writeFile(path.resolve('docs/lovelace-emotion-gallery.html'),gallery);
 console.log(`PASS: editor → real Lovelace card → iframe → 3D avatar; ${moods.length} selected emotions produced distinct render and morph-target values.`);
}finally{await browser.close();}

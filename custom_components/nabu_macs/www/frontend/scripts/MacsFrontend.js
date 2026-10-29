import { importWithVersion } from "./importHandler.js";
const { MessagePoster } = await importWithVersion("../../shared/messagePoster.js");
const { MessageListener } = await importWithVersion("../../shared/messageListener.js");
await importWithVersion("./assist-bridge.js");
const { createEmotionController } = await importWithVersion("./emotionController.js");
const { createAnimationCoordinator } = await importWithVersion("./animationCoordinator.js");
const { createNotificationFx } = await importWithVersion("./notificationFx.js");
const { createAvatar3D } = await importWithVersion("./avatar3d.js");
const { createMoodFx } = await importWithVersion("./moodFx.js");
const { createDebugger, setDebugOverride } = await importWithVersion("../../shared/debugger.js");
const debug = createDebugger(import.meta.url);
const { MOODS } = await importWithVersion("../../shared/emotions.js");

let emotionDebug=false, lastEmotionTrace=-Infinity;
let paused = false, disposed = false, readySent = false;
const poster = new MessagePoster({sender:"frontend", recipient:"backend", getRecipientWindow:()=>window.parent, getTargetOrigin:()=>window.location.origin});
const avatar = createAvatar3D();
const notification = createNotificationFx();
let coordinator = createAnimationCoordinator({onReaction:item=>notification.reaction(item),onSpeechTestState:active=>poster.post({type:"nabu_macs:speech_test_state",recipient:"backend",active})});
const emotion = createEmotionController({onPose:(p,o,m)=>{avatar.sample(p,o,m);if(emotionDebug && performance.now()-lastEmotionTrace>=1000){lastEmotionTrace=performance.now();console.info('[Nabu emotion] rendered',emotionSnapshot());}},onDiagnostics:stats=>poster.post({type:"nabu_macs:diagnostics",recipient:"backend",...stats,...coordinator?.getState()})});
emotion.setLayer?.((time,pose,mood)=>coordinator.sample(time,pose,mood));
const moodFx = createMoodFx({onMoodChange:mood=>{emotion.setMood(mood);coordinator.setBaseMood(mood);}});

function emotionSnapshot() {
    const state=emotion.getState();
    return {controller:state,rig:avatar.getEmotionSnapshot(),reactionMood:MOODS.includes(coordinator.getState().reactions?.active?.mood)?coordinator.getState().reactions.active.mood:null};
}
function applyConfig(config={}) {
    if (!config || typeof config !== "object") return;
    emotionDebug=config.emotion_debug===true;
    if(emotionDebug) window.nabuEmotionSnapshot=emotionSnapshot;
    else delete window.nabuEmotionSnapshot;
    emotion.configure(config); coordinator.configure(config); notification.configure(config); avatar.configure(config);
    if (typeof config.emotion === "string") moodFx.setBaseMood(config.emotion);
    if (typeof config.assist_satellite_enabled !== "undefined") moodFx.setIdleSequenceEnabled(!!config.assist_satellite_enabled && !config.idle_enabled);
    if (typeof config.debug_mode !== "undefined") setDebugOverride(config.debug_mode, debug);
}
function handleMessage(payload) {
    if (!payload || typeof payload !== "object") return;
    const c=payload.config || payload;
    if((emotionDebug || c.emotion_debug===true) && ['nabu_macs:init','nabu_macs:config','nabu_macs:mood'].includes(payload.type)) {
        // Only canonical mood/config flags: never log payloads or Assist text.
        console.info('[Nabu emotion] iframe', {type:payload.type,
            mood:MOODS.includes(payload.mood)?payload.mood:null,
            emotion:MOODS.includes(c.emotion)?c.emotion:null,
            enabled:c.emotion_enabled!==false,intensity:Number.isFinite(Number(c.emotion_intensity))?Number(c.emotion_intensity):null,
            mixPresent:!!c.emotion_mix && Object.keys(c.emotion_mix).length>0,
            personality:c.personality_enabled===true,animations:payload.animations_enabled});
    }
    switch(payload.type) {
      case "nabu_macs:init":
        applyConfig(payload.config); coordinator.media(payload.media);
        if (payload.mood) moodFx.setBaseMood(payload.mood);
        if (typeof payload.animations_enabled === "boolean") { paused=!payload.animations_enabled; emotion.setPaused(paused); }
        poster.post({type:"nabu_macs:init_ack",recipient:"backend"}); return;
      case "nabu_macs:config": applyConfig(payload); return;
      case "nabu_macs:media": coordinator.media(payload); return;
      case "nabu_macs:speech_test": coordinator.testSpeech(8000); return;
      case "nabu_macs:activity": coordinator.activity(); return;
      case "nabu_macs:reaction": coordinator.event(payload); return;
      case "nabu_macs:subtitle": notification.subtitle(payload.text); return;
      case "nabu_macs:mood": moodFx.setBaseMood(payload.mood||"idle"); if(payload.reset_sleep) coordinator.activity(); return;
      case "nabu_macs:turns": coordinator.activity(); return;
      case "nabu_macs:animations_enabled": paused=!payload.enabled; emotion.setPaused(paused); return;
      default: return;
    }
}
const listener = new MessageListener({recipient:"frontend",getExpectedSource:()=>window.parent,getExpectedOrigin:()=>window.location.origin,allowNullOrigin:true,onMessage:handleMessage});
document.addEventListener?.("visibilitychange",()=>emotion.setPaused(paused||document.hidden));
window.addEventListener("pagehide",event=>{if(event.persisted)return;disposed=true;listener.stop();emotion.dispose();coordinator.dispose();notification.dispose();avatar.dispose();moodFx.dispose?.();});
window.addEventListener("pointermove",event=>coordinator.pointer((event.clientX/window.innerWidth-.5)*2,(event.clientY/window.innerHeight-.5)*2),{passive:true});
window.addEventListener("pointerdown",()=>coordinator.activity(),{passive:true});
document.querySelector(".stage")?.addEventListener("pointerup",()=>coordinator.touch(),{passive:true});
emotion.configure({}); moodFx.setBaseMoodFromQuery?.(); listener.start();
if(!readySent){readySent=true;setTimeout(()=>{if(!disposed)poster.post({type:"nabu_macs:ready",recipient:"backend"});},50);}
debug("Nabu MACS 3D Frontend Ready");

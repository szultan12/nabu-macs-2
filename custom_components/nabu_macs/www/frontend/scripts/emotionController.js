import { normalizeEmotionConfig, normalizeMood } from '../../shared/emotions.js';
import { mixEmotion, interpolatePose, expressionAt } from './emotionMixer.js';
import { normalizeMotionConfig } from '../../shared/motionConfig.js';

export function createEmotionController({ doc = document, request = globalThis.requestAnimationFrame, cancel = globalThis.cancelAnimationFrame, now = () => performance.now(), onDiagnostics=()=>{}, onPose=()=>{} } = {}) {
    if (!request) return { configure(){}, setMood(){}, setPaused(){}, dispose(){} };
    let config = normalizeEmotionConfig(), mood = 'idle', paused=false, disposed=false, frame=null;
    let target=mixEmotion(mood,config), current={...target}, from={...target}, started=now(), last=null, elapsed=0;
    let layer = () => ({}), motion=normalizeMotionConfig();
    let measuredAt=now(),draws=0,cpu=0;
    const reset = () => {
        doc.documentElement?.removeAttribute?.('data-emotion');
    };
    function render(time) {
        let p = paused || motion.reduced_motion ? current : expressionAt(current,elapsed*motion.animation_speed/1000);
        const overlay = layer(elapsed,p,mood) || {};
        p=overlay.pose || p;
        onPose(p,overlay,motion);
        doc.documentElement.setAttribute('data-emotion',mood);
        doc.documentElement.setAttribute('data-speaking',String(!!overlay.speaking));
        doc.documentElement.setAttribute('data-idle',overlay.idle || 'idle');
    }
    function tick(time) {
        frame=null;
        if(disposed || paused || !config.emotion_enabled) return;
        const dt=last!==null ? Math.max(0,time-last) : 0;
        if(last===null || dt+0.1>=1000/motion.animation_fps) {
            elapsed+=dt; last=time;
            current=interpolatePose(from,target,config.transition_ms ? (time-started)/config.transition_ms : 1);
            const before=now();
            render(time);
            draws++;cpu+=now()-before;
            if(time-measuredAt>=1000){
                if(motion.diagnostics_enabled)onDiagnostics({fps:Math.round(draws*1000/(time-measuredAt)),target_fps:motion.animation_fps,render_ms:Math.round(cpu/draws*100)/100,mood,paused,quality:motion.quality});
                measuredAt=time;draws=0;cpu=0;
            }
        }
        frame=request(tick);
    }
    function start() { if(frame===null && !paused && !disposed && config.emotion_enabled) frame=request(tick); }
    function retarget() { from={...current}; target=mixEmotion(mood,config); started=now(); if(paused) {current=target;render(started);} start(); }
    return {
        configure(c) {
            motion=normalizeMotionConfig({...motion,...c});
            const next=normalizeEmotionConfig({...config,...c});
            if(JSON.stringify(next)===JSON.stringify(config)){start();return;}
            config=next;
            mood=next.emotion;
            if(!config.emotion_enabled) { if(frame!==null) cancel(frame);frame=null;reset();return; }
            retarget();
        },
        setMood(value) { const next=normalizeMood(value); if(next===mood)return; mood=next;retarget(); },
        setPaused(value) { paused=!!value;last=null; if(paused && frame!==null){cancel(frame);frame=null;} else start(); },
        setLayer(fn) { layer=fn; },
        getState: () => ({ mood, paused, enabled:config.emotion_enabled, framePending:frame!==null, pose:{...current} }),
        dispose() { disposed=true;if(frame!==null)cancel(frame);frame=null;reset(); },
    };
}

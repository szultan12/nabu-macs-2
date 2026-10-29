import { normalizeMotionConfig } from '../../shared/motionConfig.js';
import { mixEmotion, expressionAt, interpolatePose } from './emotionMixer.js';
import { createReactionEngine } from './reactionEngine.js';
import { normalizePersonalityConfig } from '../../shared/personalityConfig.js';
import { createSpeechFx } from './speechFx.js';
import { createNaturalMotionFx } from './naturalMotionFx.js';
import { idleMood } from './idleController.js';
export function createAnimationCoordinator({random=Math.random,onReaction=()=>{},onSpeechTestState=()=>{},now=()=>Date.now(),setTimer=setTimeout,clearTimer=clearTimeout}={}){
    const speech=createSpeechFx(random),natural=createNaturalMotionFx(random);
    const reactions=createReactionEngine({now});
    let personality=normalizePersonalityConfig(),baseMood='idle',reactionPose=null,reactionSource=null,reactionFrom=null,reactionTarget=null,reactionStarted=0,reactionReturnMs=350;
    let config=normalizeMotionConfig(),time=0,activity=0,lastIdle='idle',mediaPlaying=false,speechTestActive=false,speechTestTimer=null;
    const updateSpeechPlaying=()=>speech.setPlaying(config.speech_enabled&&(mediaPlaying||speechTestActive));
    const endSpeechTest=()=>{if(speechTestTimer!==null)clearTimer(speechTestTimer);speechTestTimer=null;if(!speechTestActive)return;speechTestActive=false;updateSpeechPlaying();onSpeechTestState(false);};
    return {
        configure(c){config={...config,...normalizeMotionConfig({...config,...c})};personality=normalizePersonalityConfig({...personality,...c});reactions.configure(personality);if(!config.speech_enabled)endSpeechTest();updateSpeechPlaying();},
        event(event){const accepted=reactions.trigger(event,baseMood);if(accepted)activity=time;return accepted;},
        touch(){if(personality.touch_enabled){natural.wake(time);reactions.trigger({trigger:'touch'},baseMood);activity=time;}},
        setBaseMood(mood){if(baseMood!==mood){reactions.clear();reactionPose=reactionSource=reactionFrom=reactionTarget=null;}baseMood=mood;},
        media(payload){mediaPlaying=payload?.playing===true;updateSpeechPlaying();if(speech.playing)activity=time;},
        testSpeech(duration=8000){if(!config.speech_enabled)return false;endSpeechTest();speechTestActive=true;updateSpeechPlaying();onSpeechTestState(true);speechTestTimer=setTimer(()=>endSpeechTest(),Math.max(1,Math.min(8000,Number(duration)||8000)));return true;},
        activity(){activity=time;natural.wake(time);},
        pointer(x,y){natural.pointer(x,y,time);activity=time;},
        sample(t,base,mood){
            time=t;
            if(speech.playing)activity=time;
            const idle=config.idle_enabled&&mood==='idle'&&!speech.playing?idleMood(time-activity,config):'idle';
            if(lastIdle==='sleeping'&&idle==='idle')natural.wake(time);lastIdle=idle;
            let pose=idle==='idle'?base:expressionAt(mixEmotion(idle),time/1000);
            const reaction=reactions.sample();onReaction(reaction);
            if(reaction){
                if(reaction!==reactionSource){reactionFrom=reactionPose||pose;reactionStarted=time;reactionSource=reaction;reactionReturnMs=reaction.transition_ms;}
                reactionTarget=expressionAt(mixEmotion(reaction.mood),time/1000);
                reactionPose=interpolatePose(reactionFrom,reactionTarget,reactionReturnMs?(time-reactionStarted)/reactionReturnMs:1);pose=reactionPose;
            }else if(reactionPose){
                if(reactionSource){reactionFrom=reactionPose;reactionTarget=pose;reactionStarted=time;reactionSource=null;}
                reactionPose=interpolatePose(reactionFrom||pose,reactionTarget||pose,reactionReturnMs?(time-reactionStarted)/reactionReturnMs:1);pose=reactionPose;
                if(time-reactionStarted>=reactionReturnMs){reactionPose=reactionSource=reactionFrom=reactionTarget=null;}
            }
            const n=natural.sample(time,pose,config),s=speech.sample(time,mood,config,pose);
            // Apply only the speech-specific eye/brow overlay while retaining base
            // emotion, reaction, gaze, blinking, and head channels as independent layers.
            if(s.pose)pose=s.pose;
            return {...n,...s,headY:n.headY+s.headY,pose,idle,speaking:speech.playing};
        },
        getState:()=>({speaking:speech.playing,speechTestActive,idle:lastIdle,reactions:reactions.getState()}),
        dispose(){if(speechTestTimer!==null)clearTimer(speechTestTimer);speechTestTimer=null;speechTestActive=false;speech.dispose();reactions.dispose();},
    };
}

export const SPEECH_STYLES=Object.freeze({normal:{period:155,open:28,nod:1.8},excited:{period:95,open:42,nod:3},grumpy:{period:235,open:16,nod:.8}});
export function speechStyle(style,mood){return style!=='auto'?style:(['excited','happy','laughing','troll'].includes(mood)?'excited':['angry','furious','grumpy','annoyed'].includes(mood)?'grumpy':'normal');}
export function createSpeechFx(random=Math.random){
    let playing=false,next=0,opening=0,width=1;
    return {
        setPlaying(value){if(playing!==!!value){playing=!!value;next=0;opening=0;width=1;}},
        sample(time,mood,config,pose){
            if(!playing || !config.speech_enabled || config.reduced_motion)return {open:0,mouthWidth:1,headY:0};
            const p=SPEECH_STYLES[speechStyle(config.speech_style,mood)]||SPEECH_STYLES.normal;
            if(time>=next){opening=random()<.18?0:p.open*(.3+random()*.7);width=.82+random()*.35;next=time+(p.period*(.65+random()*.8))/config.speech_speed;}
            // Speech is an additive expression layer: preserve the selected emotion and
            // only let active syllables make small eye/brow adjustments.
            const face=pose&&opening>0?{...pose}:undefined;
            if(face){
                const beat=Math.sin(time/(p.period*1.7));
                const emphasis=opening/Math.max(1,p.open);
                const styleLift=p===SPEECH_STYLES.excited?1:p===SPEECH_STYLES.grumpy?-1:0;
                face.eyeL=Math.max(.025,face.eyeL+beat*.035*emphasis);
                face.eyeR=Math.max(.025,face.eyeR+Math.sin(time/(p.period*1.9)+.8)*.03*emphasis);
                face.browY+=(-1.3+styleLift*1.2)*emphasis;
                face.browL+=styleLift*1.1*emphasis;
                face.browR-=styleLift*1.1*emphasis;
            }
            return {open:opening,mouthWidth:width,headY:config.head_enabled?Math.sin(time/170)*p.nod*config.head_intensity:0,pose:face};
        },
        get playing(){return playing;},
        dispose(){playing=false;opening=0;next=0;},
    };
}

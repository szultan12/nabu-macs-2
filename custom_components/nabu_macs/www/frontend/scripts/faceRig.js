// Canonical morph interface for a calibrated derivative. Never invents missing targets.
export const FACE_TARGETS=Object.freeze(['jawOpen','blinkLeft','blinkRight','eyeWideLeft','eyeWideRight','browUpLeft','browUpRight','browDownLeft','browDownRight','smile','frown','smirkLeft','smirkRight','mouthWide','mouthNarrow','gazeLeft','gazeRight','gazeUp','gazeDown']);
const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
export function faceWeights(p,overlay={}){
    const gazeX=(p.gazeX||0)+(overlay.gazeX||0),gazeY=(p.gazeY||0)+(overlay.gazeY||0);
    return {jawOpen:clamp(((p.open||0)+(overlay.open||0))/60),blinkLeft:clamp(1-(p.eyeL??1)*(overlay.blink??1)),blinkRight:clamp(1-(p.eyeR??1)*(overlay.blink??1)),
        browUpLeft:clamp(-p.browL/30),browUpRight:clamp(p.browR/30),browDownLeft:clamp(p.browL/30),browDownRight:clamp(-p.browR/30),
        eyeWideLeft:clamp(((p.eyeL??1)-1)/.35)*(overlay.blink??1),eyeWideRight:clamp(((p.eyeR??1)-1)/.35)*(overlay.blink??1),
        smile:clamp(p.curve/44),frown:clamp(-p.curve/25),smirkLeft:clamp(-(p.asym||0)/24),smirkRight:clamp((p.asym||0)/24),
        mouthWide:clamp(((p.width||100)*(overlay.mouthWidth||1)-100)/40),mouthNarrow:clamp((100-(p.width||100)*(overlay.mouthWidth||1))/45),
        gazeLeft:clamp(-gazeX/25),gazeRight:clamp(gazeX/25),gazeUp:clamp(-gazeY/25),gazeDown:clamp(gazeY/25)};
}
export function bindFaceRig(root){
    const meshes=[];root.traverse(n=>{if(n.morphTargetDictionary&&n.morphTargetInfluences)meshes.push(n);});
    const supported=new Set(meshes.flatMap(n=>Object.keys(n.morphTargetDictionary)));
    let previous='';
    return {missing:FACE_TARGETS.filter(k=>!supported.has(k)),supported:[...supported],apply(p,o,readback=false){const weights=faceWeights(p,o),signature=JSON.stringify(weights);const changed=signature!==previous;previous=signature;const applied=readback?{}:null;for(const n of meshes)for(const [key,v] of Object.entries(weights)){const i=n.morphTargetDictionary[key];if(i!==undefined){n.morphTargetInfluences[i]=v;if(applied)applied[key]=n.morphTargetInfluences[i];}}return {changed,weights,applied};}};
}

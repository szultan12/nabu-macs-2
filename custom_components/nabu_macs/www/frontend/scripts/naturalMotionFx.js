export function createNaturalMotionFx(random=Math.random){
    let blinkAt=1800,blinkStart=-1000,double=false,forced=false,gazeAt=0,x=0,y=0,tx=0,ty=0,pointerUntil=0,lastSample=0;
    return {
        wake(time){blinkAt=time;forced=true;},
        pointer(nx,ny,time){tx=nx*18;ty=ny*10;pointerUntil=time+3000;},
        sample(time,pose,c){
            if(!c.natural_motion_enabled || c.reduced_motion)return {blink:1,gazeX:0,gazeY:0,headTilt:0,headY:0};
            if(time>=blinkAt){blinkStart=time;double=forced||random()<.28;forced=false;const moodRate=Math.max(.65,Math.min(1.8,(pose.blink||5)/5));blinkAt=time+(c.blink_interval*1000)*(.6+random()*.8)*moodRate;}
            const age=time-blinkStart;
            const closure=a=>a>=0&&a<150?1-.94*Math.sin(Math.PI*a/150):1;
            const blink=c.blink_enabled?Math.min(closure(age),double?closure(age-240):1):1;
            if(time>=gazeAt && time>pointerUntil){tx=(random()-.5)*28;ty=(random()-.5)*18;gazeAt=time+1000+random()*3500;}
            // Time-based easing keeps gaze speed stable at low and high render rates.
            const dt=lastSample?Math.max(0,Math.min(250,time-lastSample)):32;lastSample=time;
            const ease=1-Math.exp(-dt/180);x+=(tx-x)*ease;y+=(ty-y)*ease;
            return {blink,gazeX:c.gaze_enabled?x*c.gaze_intensity:0,gazeY:c.gaze_enabled?y*c.gaze_intensity:0,
                headTilt:c.head_enabled?Math.sin(time/1700)*1.5*c.head_intensity:0,
                headY:c.head_enabled?Math.sin(time/1250)*1.6*c.head_intensity:0};
        },
    };
}

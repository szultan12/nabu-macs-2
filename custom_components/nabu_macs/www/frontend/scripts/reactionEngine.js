import { normalizePersonalityConfig,normalizeRule,BUILTIN_REACTIONS } from '../../shared/personalityConfig.js';
export function createReactionEngine({now=()=>Date.now()}={}) {
    let config=normalizePersonalityConfig(),active=null,queue=[],failed=0,lastFailureAt=0;const cooldown=new Map();
    const expire=()=>{
        const t=now();queue=queue.filter(x=>x.expires>t);
        if(active?.expires<=t)active=null;
        queue.sort((a,b)=>b.priority-a.priority||a.notBefore-b.notBefore);
        const ready=queue.findIndex(x=>x.notBefore<=t);
        if(ready>=0&&(!active||queue[ready].priority>active.priority)){
            if(active)queue.push(active);
            active=queue.splice(ready,1)[0];
        }
        return active;
    };
    return {
        configure(c){config=normalizePersonalityConfig({...config,...c});if(!config.personality_enabled){active=null;queue=[];cooldown.clear();failed=0;lastFailureAt=0;}},
        trigger(event,base='idle'){
            if(!config.personality_enabled)return false;
            const name=event?.trigger;
            let r=event?.rule || config.reaction_rules.find(r=>r.event_type===name) || (BUILTIN_REACTIONS[name]?{...BUILTIN_REACTIONS[name],event_type:name}:null);
            r=normalizeRule(r);if(!r)return false;
            if(!config.reaction_override_manual&&!['idle','listening','thinking'].includes(base)&&r.priority<90)return false;
            const t=now(),key=JSON.stringify([r.event_type,r.match]);if(t<(cooldown.get(key)||0))return false;
            if(name==='assist_failure'){failed=t-lastFailureAt<=120000?Math.min(2,failed+1):1;lastFailureAt=t;if(failed>=2)r={...r,mood:'annoyed'};}else if(name==='assist_success'){failed=0;lastFailureAt=0;}
            cooldown.set(key,t+r.cooldown*1000);if(cooldown.size>64)cooldown.delete(cooldown.keys().next().value);
            const item={...r,notBefore:t+r.delay*1000,expires:t+(r.delay+r.duration)*1000};expire();
            if(item.notBefore<=t&&(!active||item.priority>active.priority)) {if(active)queue.push(active);active=item;} else queue.push(item);
            queue.sort((a,b)=>b.priority-a.priority||a.notBefore-b.notBefore);queue=queue.slice(0,8);return true;
        },
        sample:expire,
        clear(){active=null;queue=[];},
        getState:()=>({active:expire(),queued:queue.length,cooldowns:cooldown.size}),
        dispose(){active=null;queue=[];cooldown.clear();failed=0;lastFailureAt=0;},
    };
}

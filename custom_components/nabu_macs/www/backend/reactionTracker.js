import { normalizePersonalityConfig } from '../shared/personalityConfig.js';
const unsubscribe=fn=>{try{Promise.resolve(fn?.()).catch(()=>{});}catch{}};
export class ReactionTracker {
    constructor(emit){this.emit=emit;this.generation=0;this.unsubs=[];this.signature='';this.connection=null;}
    update(hass,config){
        const c=normalizePersonalityConfig(config),rules=c.personality_enabled?c.reaction_rules:[],signature=JSON.stringify(rules),connection=hass?.connection;
        if(this.signature===signature&&this.connection===connection)return;
        this.dispose();this.signature=signature;this.connection=connection;
        if(!connection?.subscribeEvents||!rules.length)return;
        const generation=this.generation;
        for(const type of new Set(rules.map(r=>r.event_type))){
            Promise.resolve().then(()=>connection.subscribeEvents(event=>{
                if(generation!==this.generation)return;
                for(const rule of rules.filter(r=>r.event_type===type)) {
                    const data=event?.data||{};
                    if(Object.entries(rule.match).every(([k,v])=>data[k]===v)
                        &&(!rule.from_state||data.old_state?.state===rule.from_state)
                        &&(!rule.to_state||data.new_state?.state===rule.to_state))this.emit({trigger:type,rule});
                }
            },type)).then(fn=>{if(generation!==this.generation)unsubscribe(fn);else this.unsubs.push(fn);}).catch(()=>{if(generation===this.generation)this.signature='';});
        }
    }
    dispose(){this.generation++;this.unsubs.forEach(unsubscribe);this.unsubs=[];this.connection=null;this.signature='';}
}

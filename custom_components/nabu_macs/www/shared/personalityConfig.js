import { bounded,normalizeMood } from './emotions.js';
export function normalizeRule(r={}) {
    if(!r || typeof r!=='object' || typeof r.event_type!=='string' || !/^[a-z0-9_]{1,80}$/.test(r.event_type))return null;
    const match={};
    for(const [k,v] of Object.entries(r.match||{}).slice(0,8))if(/^[a-z0-9_]{1,60}$/.test(k)&&['string','number','boolean'].includes(typeof v))match[k]=typeof v==='string'?v.slice(0,160):v;
    if(r.event_type==='state_changed' && !/^\w+\.\w+$/.test(match.entity_id||''))return null;
    if(r.event_type==='automation_triggered'&&!/^\w+\.\w+$/.test(match.entity_id||''))return null;
    if(r.event_type==='call_service'&&(!match.domain||!match.service))return null;
    return {event_type:r.event_type,match,from_state:typeof r.from_state==='string'?r.from_state.slice(0,160):'',to_state:typeof r.to_state==='string'?r.to_state.slice(0,160):'',mood:normalizeMood(r.mood),text:typeof r.text==='string'?r.text.slice(0,240):'',priority:bounded(r.priority,40,0,100),delay:bounded(r.delay,0,0,10),duration:bounded(r.duration,4,.5,30),transition_ms:bounded(r.transition_ms,350,0,3000),cooldown:bounded(r.cooldown,3,0,300)};
}
export function normalizePersonalityConfig(c={}) {
    return {personality_enabled:c.personality_enabled===true,notifications_enabled:c.notifications_enabled===true,
        reaction_override_manual:c.reaction_override_manual===true,touch_enabled:c.touch_enabled===true,
        subtitles_enabled:c.subtitles_enabled===true,subtitle_seconds:bounded(c.subtitle_seconds,8,1,30),
        reaction_rules:Array.isArray(c.reaction_rules)?c.reaction_rules.slice(0,32).map(normalizeRule).filter(Boolean):[]};
}
export const BUILTIN_REACTIONS=Object.freeze({
    assist_listening:{mood:'listening',priority:70,duration:30},assist_processing:{mood:'thinking',priority:70,duration:30},assist_responding:{mood:'happy',priority:70,duration:30},
    assist_success:{mood:'happy',priority:60,text:'A kérés sikerült.'},assist_failure:{mood:'confused',priority:65,text:'Nem sikerült a kérés.'},
    alarm:{mood:'shocked',text:'Riasztás',priority:100,duration:12},washer_done:{mood:'happy',text:'A mosógép elkészült.',priority:55},
    dryer_done:{mood:'proud',text:'A szárítógép elkészült.',priority:55},automation_success:{mood:'happy',text:'Az automatizálás lefutott.',priority:50},
    device_error:{mood:'worried',text:'Eszközhiba történt.',priority:85},doorbell:{mood:'curious',text:'Csengettek.',priority:60},
    notification:{mood:'curious',text:'Új értesítés',priority:45},touch:{mood:'curious',priority:40},
});

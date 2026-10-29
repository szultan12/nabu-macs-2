import { EMOTIONS } from '../shared/emotions.js';
import { normalizedSettings,exportConfig,importConfig } from '../shared/configCodec.js';
const definitions=[
 ['light_intensity','3D világítás',.2,3],
 ['emotion_enabled','Új érzelmi motor','check'],['emotion','Alapérzelem',Object.entries(EMOTIONS).map(([id,p])=>[id,p.label])],
 ['emotion_intensity','Érzelmi intenzitás',0,100],['transition_ms','Átmenet (ms)',0,3000],
 ['speech_enabled','Beszédanimáció','check'],['speech_media_player','Médialejátszó entitás','text'],['speech_style','Beszédstílus',['auto','normal','excited','grumpy'].map(x=>[x,x])],['speech_speed','Beszédsebesség',.4,2],
 ['natural_motion_enabled','Természetes mozgás','check'],['blink_enabled','Pislogás','check'],['gaze_enabled','Szemmozgás','check'],['head_enabled','Fejmozgás','check'],
 ['blink_interval','Pislogási időköz (mp)',2,15],['gaze_intensity','Szemmozgás intenzitása',0,2],['head_intensity','Fejmozgás intenzitása',0,2],['animation_speed','Animációsebesség',.25,2],
 ['idle_enabled','Automatikus tétlenség','check'],['idle_bored_seconds','Unatkozás (mp)',5,3600],['idle_sleepy_seconds','Álmosság (mp)',10,7200],['idle_sleep_seconds','Alvás (mp)',15,10800],
 ['personality_enabled','Automatikus reakciók','check'],['reaction_override_manual','Kézi hangulat felülírható','check'],['notifications_enabled','Értesítések','check'],['subtitles_enabled','Beszédfeliratok','check'],['subtitle_seconds','Felirat időtartama',1,30],['touch_enabled','Érintési reakciók','check'],
 ['animation_fps','Animációs FPS',[[30,'30 FPS – energiatakarékos'],[60,'60 FPS – folyamatosabb']]],['quality','Animációminőség',[['low','Takarékos'],['balanced','Kiegyensúlyozott'],['high','Magas']]],['reduced_motion','Csökkentett mozgás','check'],['diagnostics_enabled','Teljesítménydiagnosztika','check'],
];
const EVENT_TYPES=[['assist_listening','Assist: ébresztőszó / figyelés'],['assist_processing','Assist: feldolgozás'],['assist_responding','Assist: beszéd'],['assist_success','Assist: siker'],['assist_failure','Assist: hiba'],['automation_triggered','Home Assistant: automatizálás lefutott'],['state_changed','Home Assistant: entitás állapotot váltott'],['call_service','Home Assistant: szolgáltatás futott']];
const EVENT_MOODS={assist_listening:'listening',assist_processing:'thinking',assist_responding:'happy',assist_success:'happy',assist_failure:'confused',automation_triggered:'happy',state_changed:'curious'};
const rangeStep=(min,max)=>max<=3?.05:max<=20?.5:max<=100?1:max<=1000?10:100;
const fieldHtml=([id,label,kind,max])=>{
    if(kind==='check')return `<label class="nabu-setting nabu-setting-toggle"><span>${label}</span><input id="setting-${id}" type="checkbox"></label>`;
    if(Array.isArray(kind))return `<label class="nabu-setting"><span>${label}</span><select id="setting-${id}">${kind.map(([value,name])=>`<option value="${value}">${name}</option>`).join('')}</select></label>`;
    if(kind==='text')return `<label class="nabu-setting"><span>${label}</span><input id="setting-${id}" type="text"></label>`;
    return `<label class="nabu-setting nabu-setting-range"><span>${label}</span><input id="setting-${id}" type="range" min="${kind}" max="${max}" step="${rangeStep(kind,max)}"><output id="setting-${id}-value" for="setting-${id}"></output></label>`;
};
export const personalityEditorHtml=`<details class="nabu-settings-editor nabu-personality-settings"><summary>Személyiség, beszéd és mozgás</summary><div class="nabu-settings-grid">${definitions.map(fieldHtml).join('')}</div><div class="nabu-speech-test"><button id="nabu-speech-test" type="button">Beszéd tesztelése</button><output id="nabu-speech-test-status" role="status" aria-live="polite">A teszt 8 másodpercig mozgatja a szájat.</output></div>
<section class="nabu-reaction-editor" aria-label="Automatikus eseményreakciók"><h3>Események és érzelmi reakciók</h3><p>Válassz Home Assistant-eseményt, majd állítsd be a szűrőt, a hangulatot és az időzítést. Az entitásesemények csak a megadott entitásra figyelnek.</p>
<div class="nabu-reaction-add"><label>Új esemény<select id="reaction-new-type">${EVENT_TYPES.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label><label>Entitásazonosító (állapot- vagy automatizálási eseménynél)<input id="reaction-new-entity" type="text" placeholder="alarm_control_panel.home"></label><label>Szolgáltatás tartomány (call_service)<input id="reaction-new-domain" type="text" placeholder="light"></label><label>Szolgáltatás neve (call_service)<input id="reaction-new-service" type="text" placeholder="turn_on"></label><label>Új állapot<input id="reaction-new-to" type="text" placeholder="triggered / unavailable / finished"></label><button id="reaction-add" type="button">Reakció hozzáadása</button></div><div id="reaction-rule-list" role="list"></div><p id="nabu-personality-status" role="status"></p></section>
<details class="nabu-advanced-rules"><summary>Haladó: eseményszabályok JSON</summary><label>Eseményszabályok<textarea id="setting-reaction_rules" rows="5"></textarea></label></details>
<small>Az entitások és szabályok kizárólag olvasást és vizuális reakciót vezérelnek.</small></details>
<details class="nabu-settings-editor"><summary>Konfiguráció mentése / betöltése</summary><textarea id="nabu-config-json" rows="8" aria-label="Verziózott konfiguráció JSON"></textarea><button id="nabu-export" type="button">Exportálás a mezőbe</button><button id="nabu-import" type="button">Importálás a mezőből</button><p id="nabu-config-status" role="status"></p></details>`;
export function syncPersonalityEditor(root,c){
    const values=normalizedSettings(c);
    for(const [id,,kind] of definitions){const input=root.querySelector(`#setting-${id}`);if(!input)continue;if(kind==='check')input.checked=values[id];else input.value=values[id];const output=root.querySelector(`#setting-${id}-value`);if(output)output.value=String(values[id]);}
    const rules=root.querySelector('#setting-reaction_rules');if(rules)rules.value=JSON.stringify(values.reaction_rules,null,2);
    renderReactionRules(root,values.reaction_rules);
}
function renderReactionRules(root,rules){
    const host=root.querySelector('#reaction-rule-list');if(!host)return;host.replaceChildren();const doc=root.ownerDocument;
    for(const [index,rule] of rules.entries()){
        const row=doc.createElement('div');row.className='nabu-reaction-rule';row.setAttribute('role','listitem');
        const eventOptions=[...EVENT_TYPES];if(!eventOptions.some(([value])=>value===rule.event_type))eventOptions.push([rule.event_type,`Egyedi: ${rule.event_type}`]);
        const addField=(label,key,type='text',options)=>{const wrap=doc.createElement('label');wrap.textContent=label;const input=doc.createElement(type==='select'?'select':'input');input.dataset.field=key;if(type!=='select')input.type=type;
            if(type==='select')for(const [value,name] of options){const option=doc.createElement('option');option.value=value;option.textContent=name;input.append(option);}
            input.value=type==='select'?(rule[key]||'idle'):String(['entity_id','domain','service'].includes(key)?(rule.match?.[key]||''):(rule[key]??''));wrap.append(input);row.append(wrap);};
        addField('Esemény','event_type','select',eventOptions);addField('Entitásazonosító','entity_id');addField('HA szolgáltatás tartománya','domain');addField('HA szolgáltatás neve','service');addField('Erről az állapotról','from_state');addField('Erre az állapotra','to_state');
        addField('Érzelem','mood','select',Object.entries(EMOTIONS).map(([id,p])=>[id,p.label]));
        addField('Prioritás (0–100)','priority','number');addField('Késleltetés (mp)','delay','number');addField('Reakció (mp)','duration','number');addField('Átmenet (ms)','transition_ms','number');addField('Cooldown (mp)','cooldown','number');addField('Vizuális felirat','text','text');
        const save=doc.createElement('button');save.type='button';save.textContent='Szabály mentése';save.dataset.save=String(index);row.append(save);
        const remove=doc.createElement('button');remove.type='button';remove.textContent='Eltávolítás';remove.dataset.remove=String(index);row.append(remove);host.append(row);
    }
}
export function wirePersonalityEditor(root,getConfig,emit){
    const status=text=>{for(const id of ['nabu-config-status','nabu-personality-status']){const el=root.querySelector(`#${id}`);if(el)el.textContent=text;}};
    for(const [id,,kind] of definitions){const input=root.querySelector(`#setting-${id}`);if(!input)continue;const update=()=>{if(input.checkValidity&&!input.checkValidity()){input.reportValidity();return;}const c=getConfig(),value=kind==='check'?input.checked:kind==='text'?input.value:Array.isArray(kind)?input.value:Number(input.value),patch={[id]:value};if(id==='emotion')patch.emotion_mix={};const next=normalizedSettings({...c,...patch});const output=root.querySelector(`#setting-${id}-value`);if(output)output.value=String(next[id]);emit({...c,...next});};input.addEventListener(kind==='range'||typeof kind==='number'?'input':'change',update);}
    root.querySelector('#setting-reaction_rules')?.addEventListener('change',()=>{try{const value=JSON.parse(root.querySelector('#setting-reaction_rules').value);const c=getConfig();emit({...c,...normalizedSettings({...c,reaction_rules:value})});status('Beállítás mentve.');}catch{status('Hibás JSON; a korábbi beállítás maradt érvényben.');}});
    const saveRules=rules=>{const c=getConfig(),next=normalizedSettings({...c,reaction_rules:rules});emit({...c,...next});root.querySelector('#setting-reaction_rules').value=JSON.stringify(next.reaction_rules,null,2);renderReactionRules(root,next.reaction_rules);status('Eseményreakciók mentve.');};
    root.querySelector('#reaction-add')?.addEventListener('click',()=>{const type=root.querySelector('#reaction-new-type').value,entity=root.querySelector('#reaction-new-entity').value.trim(),domain=root.querySelector('#reaction-new-domain').value.trim(),service=root.querySelector('#reaction-new-service').value.trim(),to=root.querySelector('#reaction-new-to').value.trim();if(['state_changed','automation_triggered'].includes(type)&&!/^\w+\.\w+$/.test(entity)){status('Ehhez az eseményhez adj meg pontos entity_id azonosítót.');return;}if(type==='call_service'&&(!domain||!service)){status('Szolgáltatásfigyeléshez a tartományt és a szolgáltatás nevét is add meg.');return;}
        const match={...(entity?{entity_id:entity}:{}),...(domain?{domain}:{}),...(service?{service}:{})};const rule={event_type:type,match,to_state:to,mood:EVENT_MOODS[type]||'curious',priority:type==='state_changed'?60:55,duration:6,cooldown:3,transition_ms:350};saveRules([...normalizedSettings(getConfig()).reaction_rules,rule]);for(const id of ['reaction-new-entity','reaction-new-domain','reaction-new-service','reaction-new-to'])root.querySelector(`#${id}`).value='';});
    root.querySelector('#reaction-rule-list')?.addEventListener('click',event=>{const save=event.target.closest('[data-save]');if(save){const row=save.closest('[role="listitem"]'),index=Number(save.dataset.save),rules=normalizedSettings(getConfig()).reaction_rules.slice(),next={...rules[index],match:{...rules[index].match}};
            for(const input of row.querySelectorAll('[data-field]')){const key=input.dataset.field,value=input.type==='number'?Number(input.value):input.value;if(['entity_id','domain','service'].includes(key)){if(value)next.match[key]=value;else delete next.match[key];}else next[key]=value;}
            if(['state_changed','automation_triggered'].includes(next.event_type)&&!/^\w+\.\w+$/.test(next.match.entity_id||'')){status('Ehhez az eseményhez pontos entity_id szükséges.');return;}
            if(next.event_type==='call_service'&&(!next.match.domain||!next.match.service)){status('A call_service szabályhoz tartomány és szolgáltatásnév is szükséges.');return;}
            rules[index]=next;saveRules(rules);return;}
        const button=event.target.closest('[data-remove]');if(!button)return;saveRules(normalizedSettings(getConfig()).reaction_rules.filter((_,index)=>index!==Number(button.dataset.remove)));});
    root.querySelector('#nabu-export')?.addEventListener('click',()=>{root.querySelector('#nabu-config-json').value=exportConfig(getConfig());status('A JSON kimásolható és fájlba menthető.');});
    root.querySelector('#nabu-import')?.addEventListener('click',()=>{try{emit(importConfig(root.querySelector('#nabu-config-json').value));status('Konfiguráció importálva.');}catch(e){status(e.message);}});
}

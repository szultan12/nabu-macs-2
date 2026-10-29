// Text-only overlays, deliberately separate from Assist history.
export function createNotificationFx(doc=document){
    const notice=doc.getElementById('nabu-notification'),subtitle=doc.getElementById('nabu-subtitle');
    let timer=null,last='',config={};
    return {
        configure(c){config={...config,...c};if(!config.notifications_enabled&&notice)notice.hidden=true;if(!config.subtitles_enabled&&subtitle)subtitle.hidden=true;},
        reaction(item){if(!notice)return;const text=config.notifications_enabled?(item?.text||''):'';if(text!==last){notice.textContent=text;last=text;}notice.hidden=!text;},
        subtitle(text){if(timer!==null)clearTimeout(timer);timer=null;if(!subtitle||!config.subtitles_enabled)return;subtitle.textContent=typeof text==='string'?text.slice(0,1000):'';subtitle.hidden=!subtitle.textContent;timer=setTimeout(()=>{subtitle.hidden=true;timer=null;},(config.subtitle_seconds||8)*1000);},
        dispose(){if(timer!==null)clearTimeout(timer);timer=null;if(notice)notice.hidden=true;if(subtitle)subtitle.hidden=true;},
    };
}

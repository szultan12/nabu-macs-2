import { normalizeVisualConfig } from './visualConfig.js';
import { normalizeEmotionConfig } from './emotions.js';
import { normalizeMotionConfig } from './motionConfig.js';
import { normalizePersonalityConfig } from './personalityConfig.js';
import { normalizeAvatarConfig } from './avatarConfig.js';
const forbidden=/^(?:__proto__|prototype|constructor|.*(?:token|password|secret).*)$/i;
function clean(value,depth=0){
    if(depth>12)throw Error('Túl mély konfiguráció.');
    if(Array.isArray(value))return value.slice(0,100).map(v=>clean(v,depth+1));
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!forbidden.test(key)).map(([key,v])=>[key,clean(v,depth+1)]));
    return value;
}
export function normalizedSettings(config={}){
    return {...normalizeVisualConfig(config),...normalizeEmotionConfig(config),...normalizeMotionConfig(config),...normalizePersonalityConfig(config),...normalizeAvatarConfig(config)};
}
const removedKeys=new Set(['theme','avatar','head_color','display_color','eye_color','mouth_color','position_x','position_y','camera_yaw','camera_pitch','camera_zoom','temperature_sensor_enabled','temperature_sensor_entity','temperature_sensor_custom','temperature_sensor_unit','temperature_sensor_min','temperature_sensor_max','wind_sensor_enabled','wind_sensor_entity','wind_sensor_custom','wind_sensor_unit','wind_sensor_min','wind_sensor_max','precipitation_sensor_enabled','precipitation_sensor_entity','precipitation_sensor_custom','precipitation_sensor_unit','precipitation_sensor_min','precipitation_sensor_max','weather_conditions_enabled','weather_conditions_entity','weather_conditions_custom','battery_charge_sensor_enabled','battery_charge_sensor_entity','battery_charge_sensor_custom','battery_charge_sensor_unit','battery_charge_sensor_min','battery_charge_sensor_max','battery_state_sensor_enabled','battery_state_sensor_entity','battery_state_sensor_custom','auto_brightness_enabled','auto_brightness_timeout_minutes','auto_brightness_min','auto_brightness_max','auto_brightness_pause_animations']);
function cleanCardConfig(config){const value=clean(config);for(const key of removedKeys)delete value[key];return value;}
export function exportConfig(config){return JSON.stringify({schema:'nabu-macs',version:1,config:{...cleanCardConfig(config),...normalizedSettings(config),type:'custom:nabu-macs-card'}},null,2);}
export function importConfig(text){
    if(typeof text!=='string'||text.length>65536)throw Error('Legfeljebb 64 KiB JSON importálható.');
    const value=JSON.parse(text);
    if(value?.schema!=='nabu-macs'||value.version!==1||!value.config||typeof value.config!=='object'||Array.isArray(value.config))throw Error('Nem támogatott Nabu-konfiguráció.');
    if(value.config.type && value.config.type!=='custom:nabu-macs-card')throw Error('Más kártyatípus nem importálható.');
    return {...cleanCardConfig(value.config),...normalizedSettings(value.config),type:'custom:nabu-macs-card'};
}

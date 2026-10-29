export function idleMood(elapsed,c){
    const bored=c.idle_bored_seconds*1000, sleepy=Math.max(bored+1000,c.idle_sleepy_seconds*1000), sleep=Math.max(sleepy+1000,c.idle_sleep_seconds*1000);
    return elapsed>=sleep?'sleeping':elapsed>=sleepy?'sleepy':elapsed>=bored?'bored':'idle';
}

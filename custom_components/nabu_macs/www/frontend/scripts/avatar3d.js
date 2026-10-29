import { normalizeAvatarConfig } from '../../shared/avatarConfig.js';
import { bindFaceRig } from './faceRig.js';
import { EMOTIONS } from '../../shared/emotions.js';

export function qualityPixelRatio(devicePixelRatio, quality) {
    const dpr=Number.isFinite(Number(devicePixelRatio))?Math.max(.5,Number(devicePixelRatio)):1;
    const profile=['low','balanced','high'].includes(quality)?quality:'balanced';
    const factor=profile==='low'?.75:profile==='high'?1.5:1;
    const ceiling=profile==='low'?1.25:profile==='balanced'?1.5:2;
    return Math.min(dpr*factor,ceiling);
}

// Shares the emotion renderer's clock. No second animation loop or HA connection.
export function createAvatar3D({doc=document}={}) {
    const host=doc.getElementById('avatar3d');
    if(!host)return {configure(){},sample(){},dispose(){}};
    let config=normalizeAvatarConfig(), renderer, scene, camera, model, pivot, THREE, observer;
    let disposed=false, loading=false, failed=false, generation=0, dirty=true, quality='balanced', reduced=false, emotionEnabled=true;
    let size=1,center,lights=[],environment,rig,head,headRest;
    function label(){}
    function release(root) {
        const textures=new Set(),materials=new Set(),geometries=new Set();
        root?.traverse(n=>{if(n.geometry)geometries.add(n.geometry);for(const m of n.material?(Array.isArray(n.material)?n.material:[n.material]):[])materials.add(m);});
        for(const m of materials){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose();}
        for(const t of textures){t.source?.data?.close?.();t.dispose();}for(const g of geometries)g.dispose();
    }
    function fallback(){failed=true;host.hidden=true;}
    function resize(){if(!renderer)return;const w=host.clientWidth||1,h=host.clientHeight||1,pixelRatio=qualityPixelRatio(globalThis.devicePixelRatio||1,quality);renderer.setPixelRatio(pixelRatio);renderer.setSize(w,h,false);host.dataset.pixelRatio=String(pixelRatio);host.dataset.quality=quality;camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;draw();}
    function positionCamera(){if(!camera||!center)return;
        const distance=size*1.65/Math.min(1,camera.aspect)/(config.character_size/100);
        camera.position.set(center.x,center.y,center.z+distance);
        camera.lookAt(center);lights.forEach((l,i)=>l.intensity=[2,3,1.5][i]*config.light_intensity);dirty=true;}
    function draw(){if(!renderer||!model||disposed||failed||doc.hidden)return;positionCamera();renderer.render(scene,camera);host.dataset.triangles=String(renderer.info.render.triangles);host.dataset.draws=String(Number(host.dataset.draws||0)+1);dirty=false;}
    async function load(){
        if(loading||renderer||failed||disposed)return;loading=true;const token=++generation;label('3D modell betöltése…');
        try{
            const [three,{GLTFLoader},{MeshoptDecoder},{RoomEnvironment}]=await Promise.all([import('../../vendor/three.module.js'),import('../../vendor/GLTFLoader.js'),import('../../vendor/meshopt_decoder.module.js'),import('../../vendor/RoomEnvironment.js')]);
            if(disposed||token!==generation)return;THREE=three;
            renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
            renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
            host.replaceChildren(renderer.domElement);
            renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback();});
            scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,1,.001,100);
            const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);
            environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
            lights=[new THREE.HemisphereLight(0xe3f5ff,0x38404b,2),new THREE.DirectionalLight(0xffffff,3),new THREE.DirectionalLight(0x8fdcff,1.5)];
            lights[1].position.set(2,3,4);lights[2].position.set(-3,1,-2);scene.add(...lights);
            const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
            const gltf=await loader.loadAsync(new URL('../../models/nabu-animated.glb',import.meta.url).href);
            if(disposed||token!==generation){release(gltf.scene);return;}
            model=gltf.scene;model.rotation.y=-Math.PI/2;pivot=new THREE.Group();scene.add(pivot);pivot.add(model);
            head=model.getObjectByName('NabuHead');headRest=head?.quaternion.clone();
            const bounds=new THREE.Box3().setFromObject(model);center=bounds.getCenter(new THREE.Vector3());
            size=Math.max(...bounds.getSize(new THREE.Vector3()).toArray())*1.1;
            model.position.sub(center);center=new THREE.Vector3(0,size*.12,0);
            rig=bindFaceRig(model);host.dataset.rig=rig.missing.length?'missing':'calibrated';host.dataset.rigMissing=JSON.stringify(rig.missing);host.dataset.rigTargets=JSON.stringify(rig.supported);host.dataset.loaded='true';host.dataset.clips=String(gltf.animations.length);
            observer=new ResizeObserver(resize);observer.observe(host);
            configure(config);resize();
        }catch(error){if(!disposed){fallback();release(model);environment?.dispose();renderer?.dispose();renderer?.forceContextLoss();renderer=undefined;}}
        finally{loading=false;}
    }
    function configure(c={}){
        config={...normalizeAvatarConfig({...config,...c}),glow:Math.max(0,Math.min(100,Number(c.glow??config.glow??70))),character_size:Math.max(60,Math.min(120,Number(c.character_size??config.character_size??100)))};quality=c.quality??quality;reduced=c.reduced_motion??reduced;
        emotionEnabled=c.emotion_enabled??emotionEnabled;
        doc.documentElement.style.setProperty('--nabu-glow-strength',String(config.glow));
        doc.documentElement.style.setProperty('--nabu-glow-blur',`${(config.glow*.16).toFixed(2)}px`);
        doc.documentElement.style.setProperty('--nabu-glow-opacity',String((config.glow*.0078).toFixed(3)));
        doc.documentElement.style.setProperty('--nabu-glow-falloff',String((config.glow*.004368).toFixed(3)));
        host.dataset.characterSize=String(config.character_size);host.dataset.glow=String(config.glow/100);
        if(model&&!emotionEnabled){const result=rig.apply(EMOTIONS.idle,{});host.dataset.weights=JSON.stringify(result.weights);if(head)head.quaternion.copy(headRest);dirty=true;}
        host.hidden=failed;
        if(model&&!failed){label('3D arcrig · 26 érzelem · stilizált szemmozgás');resize();}else if(!failed)void load();
    }
    return {configure, getEmotionSnapshot:()=>({loaded:!!model,failed,missing:rig?.missing ?? [],meshes:rig?.snapshot() ?? []}),
        sample(p,overlay={},motion={}){
            if(!model||failed)return;
            if(!rig.missing.length){const result=rig.apply(p,overlay,motion.diagnostics_enabled===true);dirty||=result.changed;host.dataset.weights=JSON.stringify(result.weights);if(result.applied)host.dataset.applied=JSON.stringify(result.applied);}
            const tilt=!reduced&&motion.head_enabled!==false?(p.tilt+(overlay.headTilt||0))*.003:0;
            if(head){
                const nod=!reduced&&motion.head_enabled!==false?(overlay.headY||0)*.008:0;
                // Convert camera/world-space nod and tilt to the bone parent's basis.
                const parentBasis=head.parent.getWorldQuaternion(new THREE.Quaternion());
                const q=parentBasis.clone().invert().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(nod,0,tilt))).multiply(parentBasis).multiply(headRest);
                if(1-Math.abs(head.quaternion.dot(q))>1e-10){head.quaternion.copy(q);dirty=true;}
                host.dataset.head=JSON.stringify(head.quaternion.toArray());
            }else if(pivot.rotation.z!==tilt){pivot.rotation.z=tilt;dirty=true;}
            if(dirty)draw();
        },
        dispose(){disposed=true;generation++;observer?.disconnect();release(model);environment?.dispose();renderer?.dispose();renderer?.forceContextLoss();host.replaceChildren();}
    };
}

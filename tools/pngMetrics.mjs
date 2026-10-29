import {inflateSync} from 'node:zlib';

export function decodePng(buffer){
    const signature=Buffer.from([137,80,78,71,13,10,26,10]);
    if(!buffer.subarray(0,8).equals(signature))throw Error('Invalid PNG signature');
    let offset=8,width=0,height=0,depth=0,colorType=0;const chunks=[];
    while(offset<buffer.length){const length=buffer.readUInt32BE(offset);offset+=4;const type=buffer.toString('ascii',offset,offset+4);offset+=4;const data=buffer.subarray(offset,offset+length);offset+=length+4;
        if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);depth=data[8];colorType=data[9];}
        if(type==='IDAT')chunks.push(data);if(type==='IEND')break;
    }
    const bpp=colorType===6?4:colorType===2?3:0;if(depth!==8||!bpp)throw Error(`Unsupported PNG: depth=${depth}, color=${colorType}`);
    const stride=width*bpp,raw=inflateSync(Buffer.concat(chunks));if(raw.length!==(stride+1)*height)throw Error('Unexpected PNG data length');
    const pixels=Buffer.alloc(stride*height);let source=0;
    for(let y=0;y<height;y++){const filter=raw[source++],row=y*stride;
        for(let x=0;x<stride;x++){const value=raw[source++],left=x>=bpp?pixels[row+x-bpp]:0,up=y?pixels[row-stride+x]:0,upperLeft=y&&x>=bpp?pixels[row-stride+x-bpp]:0;
            let predictor=0;if(filter===1)predictor=left;else if(filter===2)predictor=up;else if(filter===3)predictor=Math.floor((left+up)/2);else if(filter===4){const p=left+up-upperLeft,pa=Math.abs(p-left),pb=Math.abs(p-up),pc=Math.abs(p-upperLeft);predictor=pa<=pb&&pa<=pc?left:pb<=pc?up:upperLeft;}else if(filter!==0)throw Error(`Unsupported PNG filter ${filter}`);
            pixels[row+x]=(value+predictor)&255;
        }
    }
    return {width,height,bpp,pixels};
}

export function comparePng(a,b,threshold=12){
    if(a.width!==b.width||a.height!==b.height||a.bpp!==b.bpp)throw Error('PNG dimensions differ');
    let changed=0,totalDelta=0,maxDelta=0,samples=0;
    for(let i=0;i<a.pixels.length;i+=a.bpp){let pixelDelta=0;for(let c=0;c<3;c++){const delta=Math.abs(a.pixels[i+c]-b.pixels[i+c]);pixelDelta+=delta;totalDelta+=delta;maxDelta=Math.max(maxDelta,delta);samples++;}if(pixelDelta>=threshold)changed++;}
    return {width:a.width,height:a.height,changedPixels:changed,changedFraction:changed/(a.width*a.height),meanRgbDelta:totalDelta/samples,maxChannelDelta:maxDelta};
}

import fs from 'node:fs/promises';import path from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import sharp from 'sharp';import archiver from 'archiver';import {createWriteStream} from 'node:fs';import {finished} from 'node:stream/promises';import type {Config} from '../../../server/core/config';
export async function generateSamples(config:Config){
 const dir=path.join(config.dataRoot,'tmp');await fs.mkdir(dir,{recursive:true});
 await sharp({create:{width:64,height:48,channels:3,background:'#386950'}}).jpeg().toFile(path.join(dir,'sample.jpg'));
 await sharp({create:{width:8,height:8,channels:3,background:'#ffffff'}}).withExif({IFD0:{Artist:'SYNTHETIC'}}).jpeg().toFile(path.join(dir,'metadata.jpg'));
 await fs.writeFile(path.join(dir,'sample.txt'),'明确标记的合成测试资源\n');await fs.writeFile(path.join(dir,'invalid.txt'),Buffer.from([0xff,0xfe,0x00]));
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Contents 4 0 R /Resources << >> >>','<< /Length 0 >>\nstream\n\nendstream'];let pdf='%PDF-1.4\n';const offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}const xref=Buffer.byteLength(pdf);pdf+='xref\n0 5\n0000000000 65535 f \n'+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;await fs.writeFile(path.join(dir,'sample.pdf'),pdf);await fs.writeFile(path.join(dir,'broken.pdf'),'%PDF-1.4\nbroken\n%%EOF');
 const output=createWriteStream(path.join(dir,'sample.zip'));const zip=archiver('zip');zip.pipe(output);zip.append('SYNTHETIC',{name:'readme.txt'});await zip.finalize();await finished(output);
 const ffmpeg=path.join(path.dirname(config.ffprobePath),'ffmpeg.exe');await promisify(execFile)(ffmpeg,['-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=green:s=64x48:r=10','-t','0.3','-c:v','libx264','-pix_fmt','yuv420p','-y',path.join(dir,'sample.mp4')],{windowsHide:true,timeout:30000});
 return dir;
}

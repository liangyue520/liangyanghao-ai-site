import fs from 'node:fs/promises';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
try{
 const file=process.argv[2];const bytes=new Uint8Array(await fs.readFile(file));
 const start=Buffer.from(bytes.subarray(0,1024)).toString('latin1');const tail=Buffer.from(bytes.subarray(Math.max(0,bytes.length-2048))).toString('latin1');
 if(!start.startsWith('%PDF-')||!tail.includes('%%EOF'))throw Error('Header or trailer missing');
 const task=getDocument({data:bytes,stopAtErrors:true,useSystemFonts:false,useWorkerFetch:false});
 const doc=await task.promise;for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i);await page.getOperatorList();page.cleanup();}await task.destroy();process.stdout.write('PDF structure checked');
}catch{process.stderr.write('PDF structure rejected');process.exitCode=1;}

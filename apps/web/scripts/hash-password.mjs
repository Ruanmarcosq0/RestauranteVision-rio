import readline from 'node:readline';
import { hash } from 'bcryptjs';
if(!process.stdin.isTTY)throw new Error('Execute em terminal interativo local.');
process.stdout.write('Senha do administrador (entrada oculta): ');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
let password='';
process.stdin.on('keypress',async(str,key)=>{if(key?.ctrl&&key.name==='c'){process.exit(1)}if(key?.name==='return'){process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n'+await hash(password,12)+'\n');process.exit(0)}else if(key?.name==='backspace'){password=password.slice(0,-1)}else if(str&&!key?.ctrl){password+=str}});

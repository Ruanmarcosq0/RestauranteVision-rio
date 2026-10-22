import {z} from 'zod';
import {hash} from 'bcryptjs';
import {cookies} from 'next/headers';
import {db} from '@/lib/db';
import {equal,sameOrigin,token,productionReady} from '@/lib/auth';
import {initializeSchema} from '@/lib/bootstrap';
import {restaurantId} from '@/lib/store';
export const maxDuration=60;
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});
 if(!process.env.SETUP_TOKEN||!equal(req.headers.get('x-setup-token')??'',process.env.SETUP_TOKEN))return Response.json({error:'Convite de ativação inválido'},{status:401});
 if(!productionReady())return Response.json({error:'O banco e as chaves da unidade ainda não foram conectados'},{status:503});
 const p=z.object({name:z.string().trim().min(2).max(80),email:z.string().email().max(200),password:z.string().min(12).max(200),tables:z.number().int().min(1).max(100)}).safeParse(await req.json().catch(()=>null));
 if(!p.success)return Response.json({error:'Informe nome, e-mail, senha com ao menos 12 caracteres e quantidade de mesas.'},{status:400});
 try{await initializeSchema();const id=restaurantId();const passwordHash=await hash(p.data.password,12);
 await db.$transaction(async tx=>{await tx.owner.create({data:{restaurantId:id,email:p.data.email.toLowerCase(),passwordHash}});await tx.restaurant.create({data:{id,name:p.data.name}});await tx.diningTable.createMany({data:Array.from({length:p.data.tables},(_,i)=>({id:`${id}-table-${i+1}`,restaurantId:id,name:`Mesa ${String(i+1).padStart(2,'0')}`,zone:'Salão principal',capacity:4}))});});
 (await cookies()).set('vision_session',await token(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:28800});return Response.json({ok:true});
 }catch{return Response.json({error:'A unidade já foi ativada ou o banco está indisponível. Se já criou seu acesso, faça login.'},{status:409});}
}

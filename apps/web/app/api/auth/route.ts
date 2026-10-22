import {compare} from 'bcryptjs';
import {equal,sameOrigin,token,productionReady} from '@/lib/auth';
import {db} from '@/lib/db';
import {restaurantId} from '@/lib/store';
import {cookies} from 'next/headers';
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});
 const b=await req.json().catch(()=>null);if(!b||typeof b.email!=='string'||typeof b.password!=='string'||b.password.length>200)return Response.json({error:'Dados inválidos'},{status:400});
 if(!productionReady())return Response.json({error:'A unidade ainda precisa ser ativada'},{status:503});
 try{const owner=await db.owner.findUnique({where:{restaurantId:restaurantId()}});
 if(!owner)return Response.json({error:'Crie o primeiro acesso pelo convite de ativação'},{status:403});
 if(owner.lockedUntil&&owner.lockedUntil.getTime()>Date.now())return Response.json({error:'Muitas tentativas. Aguarde 15 minutos.'},{status:429});
 const correct=await compare(b.password,owner.passwordHash);
 if(!correct||!equal(b.email.toLowerCase(),owner.email.toLowerCase())){const updated=await db.owner.update({where:{restaurantId:owner.restaurantId},data:{failedAttempts:{increment:1}}});if(updated.failedAttempts>=5)await db.owner.update({where:{restaurantId:owner.restaurantId},data:{lockedUntil:new Date(Date.now()+15*60000),failedAttempts:0}});return Response.json({error:'Credenciais inválidas'},{status:401});}
 await db.owner.update({where:{restaurantId:owner.restaurantId},data:{failedAttempts:0,lockedUntil:null}});
 (await cookies()).set('vision_session',await token(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:28800});return Response.json({ok:true});
 }catch{return Response.json({error:'Acesso indisponível. Ative a unidade antes de entrar.'},{status:503});}
}
export async function DELETE(req:Request){if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});(await cookies()).delete('vision_session');return Response.json({ok:true});}

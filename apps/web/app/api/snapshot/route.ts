import { authorized,productionReady,demo } from '@/lib/auth';
import { snapshot } from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(){if((demo()||productionReady())&&!await authorized())return Response.json({error:'Faça login'},{status:401});try{return Response.json(await snapshot(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Banco indisponível ou unidade não configurada'},{status:503});}}

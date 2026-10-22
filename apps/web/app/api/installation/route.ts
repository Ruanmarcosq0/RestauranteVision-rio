import {authorized,demo,productionReady} from '@/lib/auth';
import {snapshot} from '@/lib/store';
import {summarizeVisits} from '@/lib/analytics';
export const dynamic='force-dynamic';
export async function GET(){if(productionReady()&&await authorized()&&!demo())try{return Response.json(await snapshot(),{headers:{'Cache-Control':'no-store'}});}catch{}return Response.json({mode:'installation',name:'Sua operação',threshold:300,tables:[],events:[],cameras:[],analytics:summarizeVisits([]),installation:{database:!!process.env.DATABASE_URL,access:false,camera:false}},{headers:{'Cache-Control':'no-store'}});}

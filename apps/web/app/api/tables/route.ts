import {randomUUID} from 'node:crypto';
import {authorized,demo,sameOrigin} from '@/lib/auth';
import {db} from '@/lib/db';
import {restaurantId} from '@/lib/store';
import {z} from 'zod';
export async function POST(req:Request){if(!await authorized()||!sameOrigin(req))return Response.json({error:'Faça login para cadastrar mesas'},{status:401});if(demo())return Response.json({error:'Operação real necessária'},{status:409});const p=z.object({name:z.string().trim().min(2).max(50),zone:z.string().trim().min(2).max(60),capacity:z.number().int().min(1).max(30)}).safeParse(await req.json().catch(()=>null));if(!p.success)return Response.json({error:'Informe nome, área e capacidade entre 1 e 30'},{status:400});const table=await db.diningTable.create({data:{id:randomUUID(),restaurantId:restaurantId(),...p.data}});return Response.json(table);}

import { authorized, demo, sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';
import { restaurantId } from '@/lib/store';
import { z } from 'zod';
export async function PATCH(req:Request){if(!await authorized()||!sameOrigin(req))return Response.json({error:'Não autorizado'},{status:401});if(demo())return Response.json({error:'Configurações demo ficam neste navegador'},{status:409});const p=z.object({name:z.string().min(2).max(80),threshold:z.number().int().min(60).max(3600)}).safeParse(await req.json());if(!p.success)return Response.json({error:'Configuração inválida'},{status:400});await db.restaurant.update({where:{id:restaurantId()},data:p.data});return Response.json({ok:true});}

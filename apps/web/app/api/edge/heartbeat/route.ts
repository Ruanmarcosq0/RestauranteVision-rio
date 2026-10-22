import {demo,equal} from '@/lib/auth';
import {db} from '@/lib/db';
import {restaurantId} from '@/lib/store';
import {z} from 'zod';
export async function POST(req:Request){if(demo()||!process.env.EDGE_API_KEY||!equal(req.headers.get('authorization')??'',`Bearer ${process.env.EDGE_API_KEY}`))return Response.json({error:'Não autorizado'},{status:401});const p=z.object({cameraId:z.string().min(1)}).safeParse(await req.json().catch(()=>null));if(!p.success)return Response.json({error:'cameraId obrigatório'},{status:400});const result=await db.camera.updateMany({where:{id:p.data.cameraId,restaurantId:restaurantId()},data:{lastSeen:new Date()}});return Response.json({ok:result.count===1});}

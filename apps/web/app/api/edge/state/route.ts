import { demo,equal } from '@/lib/auth';
import { db } from '@/lib/db';
import { restaurantId } from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(req:Request){if(demo())return Response.json({error:'Demo não permite conexão de Edge real'},{status:409});if(!process.env.EDGE_API_KEY||!equal(req.headers.get('authorization')??'',`Bearer ${process.env.EDGE_API_KEY}`))return Response.json({error:'Não autorizado'},{status:401});const tables=await db.diningTable.findMany({where:{restaurantId:restaurantId()},select:{id:true,state:true,occupiedAt:true,updatedAt:true}});return Response.json({tables},{headers:{'Cache-Control':'no-store'}});}

import { demo, equal } from '@/lib/auth';
import { enqueueAlerts, deliver } from '@/lib/store';
export async function GET(req:Request){if(!process.env.CRON_SECRET||!equal(req.headers.get('authorization')??'',`Bearer ${process.env.CRON_SECRET}`))return Response.json({error:'Não autorizado'},{status:401});if(demo())return Response.json({mode:'demo',sent:0});await enqueueAlerts();return Response.json(await deliver());}

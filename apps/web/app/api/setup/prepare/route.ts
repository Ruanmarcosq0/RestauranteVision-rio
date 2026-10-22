import {equal,sameOrigin,productionReady} from '@/lib/auth';
import {initializeSchema} from '@/lib/bootstrap';
import {db} from '@/lib/db';
import {restaurantId} from '@/lib/store';
export const maxDuration=60;
export async function POST(req:Request){if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});if(!process.env.SETUP_TOKEN||!equal(req.headers.get('x-setup-token')??'',process.env.SETUP_TOKEN))return Response.json({error:'Convite inválido'},{status:401});if(!productionReady())return Response.json({error:'Banco ainda não conectado'},{status:503});try{await initializeSchema();return Response.json({ready:true,activated:!!await db.owner.findUnique({where:{restaurantId:restaurantId()}})});}catch{return Response.json({error:'Não foi possível preparar o banco; nenhuma métrica foi criada'},{status:503});}}

import { PrismaClient } from '@prisma/client';
const db=new PrismaClient();
async function main(){const id=process.env.RESTAURANT_ID;if(!id)throw new Error('Defina RESTAURANT_ID. Nenhuma métrica simulada será inserida.');await db.restaurant.upsert({where:{id},create:{id,name:process.env.RESTAURANT_NAME??'Minha unidade'},update:{}});for(let i=1;i<=12;i++){const tableId=`${id}-table-${i}`;await db.diningTable.upsert({where:{id:tableId},create:{id:tableId,restaurantId:id,name:`Mesa ${String(i).padStart(2,'0')}`,zone:i<=8?'Salão principal':'Varanda',capacity:4},update:{}})}console.log('Unidade e 12 mesas livres criadas. Nenhum evento ou indicador simulado.');}
main().finally(()=>db.$disconnect());

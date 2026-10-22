import Console from '@/components/console';
import { notFound } from 'next/navigation';
export default async function Page({params}:{params:Promise<{section:string}>}) { const {section}=await params; if(!['dashboard','mesas','cameras','alertas','analytics','relatorios','agente','configuracoes','instalacao','login'].includes(section)) notFound(); return <Console section={section}/>; }

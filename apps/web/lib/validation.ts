import { z } from 'zod';
export const eventSchema=z.object({id:z.string().min(8).max(160),tableId:z.string().min(1).max(80),type:z.enum(['occupied','served','vacated','cleaned','heartbeat']),people:z.number().int().min(0).max(30),occurredAt:z.number().int().positive(),source:z.enum(['edge','manual'])}).strict();

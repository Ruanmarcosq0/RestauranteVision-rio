import {db} from './db';
import {schemaSQL} from './schema-sql';
export async function initializeSchema(){await db.$transaction(async tx=>{
 await tx.$executeRaw`SELECT pg_advisory_xact_lock(71948431)`;
 await tx.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "VisionMigration" ("id" TEXT PRIMARY KEY, "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)');
 const applied=await tx.$queryRaw<{id:string}[]>`SELECT id FROM "VisionMigration" WHERE id='initial-operations-v1'`;
 if(applied.length)return;
 const existing=await tx.$queryRaw<{name:string|null}[]>`SELECT to_regclass('public."Restaurant"')::text AS name`;
 if(existing[0]?.name)throw new Error('Existing schema requires explicit migration; automatic bootstrap refused');
 for(const statement of schemaSQL.split(';').map(s=>s.trim()).filter(Boolean))await tx.$executeRawUnsafe(statement);
 await tx.$executeRaw`INSERT INTO "VisionMigration" (id) VALUES ('initial-operations-v1')`;
 },{timeout:30000});}

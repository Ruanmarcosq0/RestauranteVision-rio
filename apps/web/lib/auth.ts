import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'node:crypto';
export const demo=()=>process.env.APP_MODE!=='production';
export function equal(a:string,b:string) { const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y); }
function key(){const secret=process.env.SESSION_SECRET;if(!secret||secret.length<32) throw new Error('SESSION_SECRET precisa ter 32 caracteres');return new TextEncoder().encode(secret);}
export async function session(){try {const token=(await cookies()).get('vision_session')?.value;if(!token)return null; const {payload}=await jwtVerify(token,key(),{issuer:'vision',audience:'console'});return payload.sub===process.env.RESTAURANT_ID?payload:null;}catch{return null;}}
export async function token(){return new SignJWT({}).setProtectedHeader({alg:'HS256'}).setSubject(process.env.RESTAURANT_ID!).setIssuer('vision').setAudience('console').setIssuedAt().setExpirationTime('8h').sign(key());}
export async function authorized(){return demo()||!!await session();}
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}

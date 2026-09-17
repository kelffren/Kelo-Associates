import assert from 'node:assert/strict';

const values=new Map();
globalThis.sessionStorage={
  getItem:key=>values.has(key)?values.get(key):null,
  setItem:(key,value)=>values.set(key,String(value)),
  removeItem:key=>values.delete(key)
};

const calls=[];
globalThis.fetch=async(url,options={})=>{
  calls.push({url:String(url),options});
  if(String(url).includes('/token?grant_type=password')){
    return new Response(JSON.stringify({access_token:'secure-jwt',refresh_token:'refresh-1',expires_in:3600,token_type:'bearer',user:{id:'user-1',email:'admin@example.test'}}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  if(String(url).endsWith('/logout'))return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});
  return new Response(JSON.stringify({message:'unexpected request'}),{status:500,headers:{'Content-Type':'application/json'}});
};

const {signInSecure,signOutSecure,getSecureAccessToken,secureAuthStatus,SUPABASE_PUBLISHABLE_KEY}=await import('../supabase-auth.js');
assert.ok(SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_'));
const session=await signInSecure('Admin@Example.Test','strong-password');
assert.equal(session.user.email,'admin@example.test');
assert.equal(await getSecureAccessToken(),'secure-jwt');
assert.equal(secureAuthStatus().signedIn,true);
assert.equal(JSON.parse(calls[0].options.body).email,'admin@example.test');
assert.equal(calls[0].options.headers.apikey,SUPABASE_PUBLISHABLE_KEY);
await signOutSecure();
assert.equal(secureAuthStatus().signedIn,false);
assert.ok(calls.some(call=>call.url.endsWith('/logout')));
console.log('secure-auth-smoke: ok');

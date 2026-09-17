import assert from 'node:assert/strict';

const store=()=>{
  const data=new Map();
  return {
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>data.set(key,String(value)),
    removeItem:key=>data.delete(key)
  };
};

globalThis.localStorage=store();
globalThis.sessionStorage=store();

const {backendApi,configureBackend,DEFAULT_ENDPOINT}=await import('../backend-client.js');
configureBackend({workspace:'retail_test',token:'secret-session-token'});

const calls=[];
globalThis.fetch=async(url,options={})=>{
  calls.push({url:String(url),options});
  return new Response(JSON.stringify({items:[],count:0}),{status:200,headers:{'Content-Type':'application/json'}});
};

await backendApi.getCatalog({vertical:'watches',sku:'WATCH-CORE'});
assert.equal(calls[0].url,`${DEFAULT_ENDPOINT}/catalog?vertical=watches&sku=WATCH-CORE`);
assert.equal(calls[0].options.headers.Authorization,'Bearer secret-session-token');
assert.equal(calls[0].options.headers['X-Kelo-Workspace'],'retail_test');

await backendApi.setCatalogItem({
  vertical:'moissanite',
  sku:'MOISS-EARRINGS',
  name:'Aretes de moissanita',
  pricing:{currency:'USD',unit_price:120},
  attributes:{stone_size:'1ct'}
});
assert.equal(calls[1].url,`${DEFAULT_ENDPOINT}/catalog`);
assert.equal(calls[1].options.method,'PUT');
const body=JSON.parse(calls[1].options.body);
assert.equal(body.vertical,'moissanite');
assert.equal(body.pricing.unit_price,120);

console.log('backend-catalog-smoke: ok');

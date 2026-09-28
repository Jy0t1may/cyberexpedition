export const FEEDS = [
  {id:'tldrsec', url:'https://rss.beehiiv.com/feeds/xgTKUmMmUm.xml'},
  {id:'risky', url:'https://risky.biz/feeds/risky-business-news/'},
  {id:'sans', url:'https://isc.sans.edu/rssfeed.xml'},
  {id:'krebs', url:'https://krebsonsecurity.com/feed/'}
];
const text=(node,tag)=>node.getElementsByTagName(tag)[0]?.textContent?.trim()||'';
const safeLink=raw=>{try {const u=new URL(raw);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
const plain=html=>{const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,style').forEach(n=>n.remove());return doc.body.textContent.replace(/\s+/g,' ').trim().slice(0,220)};
export function parseFeed(xml,source){
 const doc=new DOMParser().parseFromString(String(xml),'application/xml');
 if(doc.querySelector('parsererror'))throw Error('Invalid XML');
 if(!['rss','feed','RDF'].includes(doc.documentElement.localName))throw Error('Not an RSS or Atom feed');
 const entries=[...doc.getElementsByTagName('item'),...doc.getElementsByTagName('entry')];
 return entries.map(item=>{
   const linkNode=[...item.getElementsByTagName('link')].find(n=>n.getAttribute('rel')==='alternate')||item.getElementsByTagName('link')[0];
   const url=safeLink(linkNode?.getAttribute('href')||linkNode?.textContent?.trim()||'');
   const title=text(item,'title').replace(/\s+/g,' ').trim();
   const desc=text(item,'description')||text(item,'summary')||text(item,'content');
   const date=text(item,'pubDate')||text(item,'published')||text(item,'updated');
   const ms=Date.parse(date);
   return {id:source.id+'-'+url,source:source.id,sourceName:source.name,title,url,
     extract:plain(desc),published:Number.isFinite(ms)?new Date(ms).toISOString():'1970-01-01T00:00:00.000Z',tags:[]};
 }).filter(a=>a.title&&a.url).slice(0,40);
}
export function mergeNews(old,updates,when){
 const current=Array.isArray(old?.articles)?old.articles:[];
 const ids=Object.keys(updates);
 const newer=ids.flatMap(id=>updates[id]||[]);
 const unique=new Map();
 for(const row of [...newer,...current])if(row?.url&&!unique.has(row.url))unique.set(row.url,row);
 const articles=[...unique.values()].sort((a,b)=>Date.parse(b.published||0)-Date.parse(a.published||0)).slice(0,180);
 return {...old,articles,fetchedAt:when,sourcesOk:ids.length};
}
export async function refreshFeeds({baseline,feeds,request,parse=parseFeed,now=()=>new Date().toISOString()}){
 const updates={},failed=[];
 await Promise.all(feeds.map(async feed=>{
   try{
     const source=baseline.sources.find(s=>s.id===feed.id);
     if(!source)throw Error('Unknown source');
     const response=await request(feed.url);
     if(response.status<200||response.status>=300)throw Error('HTTP '+response.status);
     updates[feed.id]=parse(response.data,source);
   }catch(error){failed.push(feed.id)}
 }));
 if(!Object.keys(updates).length)throw Error('All feeds failed. Saved stories are unchanged.');
 return {news:mergeNews(baseline,updates,now()),failed,updated:Object.keys(updates)};
}

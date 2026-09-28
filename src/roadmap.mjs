const asState=state=>Array.isArray(state)?{ids:state,done:[]}:{ids:state.ids||[],done:state.done||[]};
export function toggle(state,id){const s=asState(state),ids=s.ids.includes(id)?s.ids.filter(x=>x!==id):[...s.ids,id];return {ids,done:s.done.filter(x=>ids.includes(x))}}
export function move(state,id,step){const s=asState(state),ids=[...s.ids],from=ids.indexOf(id),to=from+step;if(from>=0&&to>=0&&to<ids.length)[ids[from],ids[to]]=[ids[to],ids[from]];return {ids,done:[...s.done]}}
export function complete(state,id){const s=asState(state);if(!s.ids.includes(id))return s;return {ids:[...s.ids],done:s.done.includes(id)?s.done.filter(x=>x!==id):[...s.done,id]}}
export function decodeRoute(saved,legacy,validIds){let parsed;try{parsed=JSON.parse(saved||legacy||'[]')}catch{parsed=[]}const s=asState(Array.isArray(parsed)?parsed:parsed&&typeof parsed==='object'?parsed:[]),ids=[...new Set(s.ids.filter(id=>validIds.has(id)))];return {ids,done:[...new Set(s.done.filter(id=>ids.includes(id)))]}}

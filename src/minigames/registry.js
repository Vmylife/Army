// Mini-games register their own metadata and score handling here.
export const miniGames=new Map();
export function registerMiniGame(key,definition){if(miniGames.has(key))throw new Error(`重複註冊關卡：${key}`);miniGames.set(key,definition);}
export function getMiniGame(key){return miniGames.get(key);}

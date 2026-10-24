// Reserve the minigame interface now; separate implementations can be added here later.
export const minigames=new Map();
export function registerMinigame(id,entry){minigames.set(id,entry)}

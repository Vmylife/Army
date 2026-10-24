// Core rule: traits are permanent for the *current run*, both positive and negative.
export function addPermanentTrait(state,trait){if(!state.traits.includes(trait))state.traits.push(trait);return state;}
export function applyTrainingResult(state,score,{positiveTrait,negativeTrait,stat='defense'}={}){
 const s=Math.max(1,Math.min(100,Math.round(score)));const gain=s<20?-8:s<40?-4:s<60?0:s<80?4:s<95?7:10;
 state.stats[stat]=(state.stats[stat]||0)+gain;
 if(s<=19&&negativeTrait)addPermanentTrait(state,negativeTrait);
 if(s>=95&&positiveTrait)addPermanentTrait(state,positiveTrait);
 state.history.push({score:s,stat,delta:gain});return state;
}

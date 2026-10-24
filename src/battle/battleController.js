// Battlefield logic stays here. First animation-lab batch does not start a battle.
export class BattleController{constructor(config={}){this.config=config;this.running=false;this.kills=0;}start(){this.running=true;}stop(){this.running=false;}}

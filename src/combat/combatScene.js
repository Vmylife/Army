import { RigAnimator } from '../characters/rigAnimator.js';
import { RifleRenderer } from '../battle/rifleRenderer.js';

export class CombatScene {
  constructor(renderer, loadGlbFn) {
    this.renderer = renderer;
    this.loadGlbFn = loadGlbFn;
    this.gl = renderer.gl || renderer.ctx || renderer;
    this.isGameOver = false;

    // 戰鬥參數
    this.MAX_HP = 100;
    this.DAMAGE_PER_SHOT = 20;
    this.STOP_RANGE = 3.5;
    this.MOVE_SPEED = 2.2;

    this.fighters = [];
    this.rifles = [];
  }

  async _fetchGlb(path) {
    if (typeof this.loadGlbFn === 'function') {
      try {
        return await new this.loadGlbFn().load(path);
      } catch (e) {
        return await this.loadGlbFn(path);
      }
    }
    return await this.loadGlbFn.load(path);
  }

  async init(uiCallbacks = {}) {
    this.uiCallbacks = uiCallbacks;

    // 1. 載入士兵模型
    this.cadetGlb = await this._fetchGlb('assets/characters/cadet/cadet-green.glb');

    // 2. 註冊綠軍與紅軍到 ArmyRenderer
    if (this.renderer.addModel) {
      this.renderer.addModel('cadet_green', this.cadetGlb);
      try {
        // 淺複製/JSON結構拷貝避免 bufferView 衝突
        const redGlb = JSON.parse(JSON.stringify(this.cadetGlb));
        if (this.cadetGlb.binaryChunk) redGlb.binaryChunk = this.cadetGlb.binaryChunk;
        this.renderer.addModel('cadet_red', redGlb, {
          textureUrl: 'assets/characters/cadet/cadet-red-texture.jpg'
        });
      } catch (e) {
        console.warn('紅軍獨立模型註冊失敗，共用 green 貼圖');
      }
    }

    // 3. 嘗試載入步槍
    try {
      this.rifleGlb = await this._fetchGlb('assets/weapons/rifle.glb');
      if (this.renderer.addModel && this.rifleGlb) {
        this.renderer.addModel('rifle', this.rifleGlb);
      }
    } catch (e) {
      console.warn('步槍載入略過:', e);
    }

    // 4. 對應真實的 16 個動畫
    this.animMapping = {
      idle: 'Idle',
      run: 'Running',
      attack: 'Punch_Combo_1',
      die: 'Knock_Down'
    };

    this.reset();
  }

  reset() {
    this.isGameOver = false;

    const redKey = (this.renderer.models && this.renderer.models.has && this.renderer.models.has('cadet_red'))
      ? 'cadet_red'
      : 'cadet_green';

    this.fighters = [
      this.createFighter('green', 'cadet_green', [-4, 0, 0], 1),
      this.createFighter('red', redKey, [4, 0, 0], -1)
    ];

    try {
      if (this.rifleGlb && typeof RifleRenderer === 'function') {
        this.rifles = this.fighters.map(f => new RifleRenderer(this.gl, this.rifleGlb));
      }
    } catch (e) {
      this.rifles = [];
    }

    if (this.uiCallbacks.onUpdateHP) this.uiCallbacks.onUpdateHP(100, 100);
    if (this.uiCallbacks.onGameOver) this.uiCallbacks.onGameOver(false, null);
  }

  createFighter(team, modelKey, pos, lookDir) {
    const animator = new RigAnimator(this.cadetGlb);
    animator.setClip(this.animMapping.idle);

    return {
      team,
      modelKey,
      hp: this.MAX_HP,
      pos: [...pos],
      rotY: lookDir > 0 ? Math.PI / 2 : -Math.PI / 2,
      animator,
      state: 'MOVE',
      fireCooldown: 0.8 + Math.random() * 0.4,
      lastFireTime: 0
    };
  }

  update(deltaTime, totalTime) {
    if (this.fighters.length < 2) return;

    const [green, red] = this.fighters;

    if (!this.isGameOver) {
      this.updateAI(green, red, deltaTime, totalTime);
      this.updateAI(red, green, deltaTime, totalTime);

      if (green.hp <= 0 || red.hp <= 0) {
        this.isGameOver = true;
        const winner = green.hp > 0 ? '綠軍勝利！' : '紅軍勝利！';
        if (this.uiCallbacks.onGameOver) {
          this.uiCallbacks.onGameOver(true, winner);
        }
      }

      if (this.uiCallbacks.onUpdateHP) {
        this.uiCallbacks.onUpdateHP(green.hp, red.hp);
      }
    }

    this.fighters.forEach((f, idx) => {
      f.animator.evaluate(totalTime);
      if (this.rifles[idx] && typeof this.rifles[idx].update === 'function') {
        this.rifles[idx].update(f.pos, f.rotY, f.state === 'ATTACK');
      }
    });
  }

  updateAI(self, target, dt, now) {
    if (self.state === 'DEAD') return;

    if (self.hp <= 0) {
      self.state = 'DEAD';
      self.animator.setClip(this.animMapping.die);
      return;
    }

    const dx = target.pos[0] - self.pos[0];
    const dz = target.pos[2] - self.pos[2];
    const dist = Math.hypot(dx, dz);

    self.rotY = Math.atan2(dx, dz);

    if (dist > this.STOP_RANGE) {
      if (self.state !== 'MOVE') {
        self.state = 'MOVE';
        self.animator.setClip(this.animMapping.run);
      }
      const vx = (dx / dist) * this.MOVE_SPEED * dt;
      const vz = (dz / dist) * this.MOVE_SPEED * dt;
      self.pos[0] += vx;
      self.pos[2] += vz;
    } else {
      if (self.state !== 'ATTACK') {
        self.state = 'ATTACK';
        self.animator.setClip(this.animMapping.attack);
      }

      if (now - self.lastFireTime > self.fireCooldown) {
        self.lastFireTime = now;
        self.fireCooldown = 0.9 + Math.random() * 0.4;
        if (Math.random() < 0.85) {
          target.hp = Math.max(0, target.hp - this.DAMAGE_PER_SHOT);
        }
      }
    }
  }

  render() {
    this.fighters.forEach(f => {
      const bones = f.animator.boneMatrices || f.animator.matrices || (f.animator.getMatrices && f.animator.getMatrices());

      if (this.renderer.drawCharacter) {
        this.renderer.drawCharacter(f.modelKey, f.pos, f.rotY, bones);
      } else if (this.renderer.renderCharacter) {
        this.renderer.renderCharacter({
          modelKey: f.modelKey,
          position: f.pos,
          rotationY: f.rotY,
          skeleton: bones
        });
      } else if (this.renderer.drawModel) {
        this.renderer.drawModel(f.modelKey, f.pos, f.rotY);
      }
    });

    this.rifles.forEach(r => {
      if (r && typeof r.render === 'function') r.render();
    });
  }
}

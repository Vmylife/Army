import { RigAnimator } from '../characters/rigAnimator.js';
import { RifleRenderer } from '../battle/rifleRenderer.js';

export class CombatScene {
  constructor(renderer, loadGlbFn) {
    this.renderer = renderer;
    this.loadGlbFn = loadGlbFn;
    this.gl = renderer.gl || renderer.ctx;
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

    // 1. 載入士兵 GLB
    this.cadetGlb = await this._fetchGlb('assets/characters/cadet/cadet-green.glb');
    console.log('[Combat] 載入的 cadetGlb 物件結構:', this.cadetGlb);

    // 2. 註冊綠軍與紅軍到 ArmyRenderer
    // 解決 gltf.read is not a function: 確保傳入擁有 read 方法的物件
    if (this.renderer.addModel) {
      try {
        // 如果 cadetGlb 本身沒有 read，但有 gltf / model / raw 屬性
        const modelTarget = this.cadetGlb.read ? this.cadetGlb : (this.cadetGlb.gltf || this.cadetGlb);
        
        await this.renderer.addModel('cadet_green', modelTarget);
        
        // 紅軍註冊
        try {
          await this.renderer.addModel('cadet_red', modelTarget, {
            textureUrl: 'assets/characters/cadet/cadet-red-texture.jpg'
          });
        } catch (e) {
          console.warn('[Combat] 紅軍註冊退回共用綠軍:', e);
        }
      } catch (err) {
        console.error('[Combat] addModel 失敗:', err);
      }
    }

    // 3. 嘗試載入步槍
    try {
      this.rifleGlb = await this._fetchGlb('assets/weapons/rifle.glb');
    } catch (e) {
      console.warn('[Combat] 步槍載入略過:', e);
    }

    // 4. 動畫映射
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

    // 取得可用的模型 key
    this.fighters = [
      this.createFighter('green', 'cadet_green', [-4, 0, 0], 1),
      this.createFighter('red', 'cadet_red', [4, 0, 0], -1)
    ];

    try {
      if (this.rifleGlb && typeof RifleRenderer === 'function') {
        const glCtx = this.gl || this.renderer.gl;
        if (glCtx) {
          this.rifles = this.fighters.map(f => new RifleRenderer(glCtx, this.rifleGlb));
        }
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

      // 根據 Console 真實方法清單：使用 drawActor
      if (this.renderer.drawActor) {
        try {
          this.renderer.drawActor(f.modelKey, f.pos, f.rotY, bones);
        } catch (e) {
          // 若 drawActor 參數為物件型式
          try {
            this.renderer.drawActor({
              model: f.modelKey,
              position: f.pos,
              rotation: f.rotY,
              bones: bones
            });
          } catch (e2) {}
        }
      }
    });

    this.rifles.forEach(r => {
      if (r && typeof r.render === 'function') r.render();
    });
  }
}

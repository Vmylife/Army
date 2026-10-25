import { RigAnimator } from '../characters/rigAnimator.js';
import { RifleRenderer } from '../battle/rifleRenderer.js';

export class CombatScene {
  constructor(renderer, glbLoaderOrFn) {
    this.renderer = renderer;
    this.glbLoaderOrFn = glbLoaderOrFn;
    this.isGameOver = false;

    // 基礎數值
    this.MAX_HP = 100;
    this.DAMAGE_PER_SHOT = 20;
    this.ATTACK_RANGE = 7.0;
    this.STOP_RANGE = 4.0;
    this.MOVE_SPEED = 2.0;

    this.fighters = [];
    this.rifles = [];
  }

  async _fetchGlb(path) {
    if (typeof this.glbLoaderOrFn === 'function') {
      try {
        return await new this.glbLoaderOrFn().load(path);
      } catch (e) {
        return await this.glbLoaderOrFn(path);
      }
    } else if (this.glbLoaderOrFn && typeof this.glbLoaderOrFn.load === 'function') {
      return await this.glbLoaderOrFn.load(path);
    }
    throw new Error('無法載入 GLB');
  }

  // 安全呼叫動畫控制器的切換動畫方法
  _safePlay(animator, clipName) {
    if (!animator || !clipName) return;
    if (typeof animator.play === 'function') {
      animator.play(clipName);
    } else if (typeof animator.setAnimation === 'function') {
      animator.setAnimation(clipName);
    } else if (typeof animator.playAnimation === 'function') {
      animator.playAnimation(clipName);
    } else if (typeof animator.fadeTo === 'function') {
      animator.fadeTo(clipName);
    } else if ('currentAnimation' in animator) {
      animator.currentAnimation = clipName;
    } else if ('clip' in animator) {
      animator.clip = clipName;
    }
  }

  async init(uiCallbacks = {}) {
    this.uiCallbacks = uiCallbacks;

    console.log('[Combat] 開始載入角色與步槍模型...');
    const cadetGlb = await this._fetchGlb('assets/characters/cadet/cadet-green.glb');
    
    let rifleGlb = null;
    try {
      rifleGlb = await this._fetchGlb('assets/weapons/rifle.glb');
    } catch (e) {
      console.warn('[Combat] 步槍載入略過或失敗:', e);
    }

    // 檢查 RigAnimator 的方法
    const sampleAnimator = new RigAnimator(cadetGlb);
    console.log('[Combat] RigAnimator 實例結構與方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(sampleAnimator)));

    const availableClips = Object.keys(sampleAnimator.clips || {});
    console.log('[Combat] 讀取到可用動畫列表:', availableClips);

    const pickClip = (preferred, fallback) =>
      availableClips.includes(preferred) ? preferred : fallback;

    this.animMapping = {
      idle: pickClip('Idle', availableClips[0] || 'Idle'),
      run: pickClip('RunFast', pickClip('Running', pickClip('Walking', 'Idle'))),
      shoot: pickClip('Shoot', pickClip('Aim', pickClip('Idle', availableClips[0]))),
      die: pickClip('Die', pickClip('Death', null))
    };

    // 安全註冊模型到 ArmyRenderer
    // 避免重複註冊同一個 GLB 實例導致 bufferView 衝突
    try {
      if (this.renderer.addModel) {
        this.renderer.addModel('cadet_green', cadetGlb);
        // 如果紅軍註冊失敗，fallback 使用同一個 cadet_green
        try {
          this.renderer.addModel('cadet_red', cadetGlb, {
            textureUrl: 'assets/characters/cadet/cadet-red-texture.jpg'
          });
        } catch (texErr) {
          console.warn('[Combat] 紅軍獨立貼圖註冊失敗，改共用 green:', texErr);
        }

        if (rifleGlb) {
          try {
            this.renderer.addModel('rifle', rifleGlb);
          } catch (rErr) {
            console.warn('[Combat] rifle 註冊失敗:', rErr);
          }
        }
      }
    } catch (renderErr) {
      console.warn('[Combat] addModel 過程出現警告:', renderErr);
    }

    this.cadetGlb = cadetGlb;
    this.rifleGlb = rifleGlb;

    this.reset();
  }

  reset() {
    this.isGameOver = false;

    // 判斷紅軍模型 key
    const hasRedModel = this.renderer.models && this.renderer.models.has && this.renderer.models.has('cadet_red');
    const redKey = hasRedModel ? 'cadet_red' : 'cadet_green';

    this.fighters = [
      this.createFighter('green', 'cadet_green', [-5, 0, 0], 1),
      this.createFighter('red', redKey, [5, 0, 0], -1)
    ];

    // 初始化步槍
    try {
      if (this.rifleGlb && typeof RifleRenderer === 'function') {
        this.rifles = this.fighters.map(f => new RifleRenderer(this.renderer, this.rifleGlb));
      } else {
        this.rifles = [];
      }
    } catch (e) {
      console.warn('[Combat] RifleRenderer 初始化略過:', e);
      this.rifles = [];
    }

    if (this.uiCallbacks.onUpdateHP) {
      this.uiCallbacks.onUpdateHP(100, 100);
    }
    if (this.uiCallbacks.onGameOver) {
      this.uiCallbacks.onGameOver(false, null);
    }
  }

  createFighter(team, modelKey, pos, lookDir) {
    const animator = new RigAnimator(this.cadetGlb);
    this._safePlay(animator, this.animMapping.idle);

    return {
      team,
      modelKey,
      hp: this.MAX_HP,
      pos: [...pos],
      rotY: lookDir > 0 ? Math.PI / 2 : -Math.PI / 2,
      animator,
      state: 'MOVE',
      fireCooldown: 0.8 + Math.random() * 0.4,
      lastFireTime: 0,
      pitchOffset: 0
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
      if (f.animator && typeof f.animator.update === 'function') {
        f.animator.update(deltaTime);
      }
      if (this.rifles[idx] && typeof this.rifles[idx].update === 'function') {
        this.rifles[idx].update(f.pos, f.rotY, f.state === 'ATTACK');
      }
    });
  }

  updateAI(self, target, dt, now) {
    if (self.state === 'DEAD') return;

    if (self.hp <= 0) {
      self.state = 'DEAD';
      if (this.animMapping.die) {
        this._safePlay(self.animator, this.animMapping.die);
      } else {
        self.pitchOffset = -Math.PI / 2;
      }
      return;
    }

    const dx = target.pos[0] - self.pos[0];
    const dz = target.pos[2] - self.pos[2];
    const dist = Math.hypot(dx, dz);

    self.rotY = Math.atan2(dx, dz);

    if (dist > this.STOP_RANGE) {
      self.state = 'MOVE';
      this._safePlay(self.animator, this.animMapping.run);

      const vx = (dx / dist) * this.MOVE_SPEED * dt;
      const vz = (dz / dist) * this.MOVE_SPEED * dt;
      self.pos[0] += vx;
      self.pos[2] += vz;
    } else {
      self.state = 'ATTACK';
      this._safePlay(self.animator, this.animMapping.shoot);

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
      if (this.renderer.renderCharacter) {
        const bones = f.animator && typeof f.animator.getBoneMatrices === 'function'
          ? f.animator.getBoneMatrices()
          : (f.animator ? f.animator.matrices : null);

        this.renderer.renderCharacter({
          modelKey: f.modelKey,
          position: f.pos,
          rotationY: f.rotY,
          pitch: f.pitchOffset,
          skeleton: bones
        });
      }
    });

    this.rifles.forEach(r => {
      if (r && typeof r.render === 'function') r.render();
    });
  }
}

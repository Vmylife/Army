import { RigAnimator } from '../characters/rigAnimator.js';
import { RifleRenderer } from '../battle/rifleRenderer.js';

export class CombatScene {
  constructor(renderer, glbLoaderOrFn) {
    this.renderer = renderer;
    this.glbLoaderOrFn = glbLoaderOrFn;
    this.isGameOver = false;

    // 基礎戰鬥數值
    this.MAX_HP = 100;
    this.DAMAGE_PER_SHOT = 20;
    this.ATTACK_RANGE = 7.0;
    this.STOP_RANGE = 4.0;
    this.MOVE_SPEED = 2.0;

    this.fighters = [];
    this.rifles = [];
  }

  // 統一 GLB 載入適配器
  async _fetchGlb(path) {
    if (typeof this.glbLoaderOrFn === 'function') {
      try {
        // 若為建構式
        return await new this.glbLoaderOrFn().load(path);
      } catch (e) {
        // 若為一般非同步載入函式 loadGLB(path)
        return await this.glbLoaderOrFn(path);
      }
    } else if (this.glbLoaderOrFn && typeof this.glbLoaderOrFn.load === 'function') {
      return await this.glbLoaderOrFn.load(path);
    }
    throw new Error('無法識別的 GLB 載入器接口');
  }

  async init(uiCallbacks = {}) {
    this.uiCallbacks = uiCallbacks;

    // 1. 載入模型資源
    const cadetGlb = await this._fetchGlb('assets/characters/cadet/cadet-green.glb');
    const rifleGlb = await this._fetchGlb('assets/weapons/rifle.glb');

    // 2. 註冊渲染模型
    if (this.renderer.addModel) {
      this.renderer.addModel('cadet_green', cadetGlb);
      this.renderer.addModel('cadet_red', cadetGlb, {
        textureUrl: 'assets/characters/cadet/cadet-red-texture.jpg'
      });
      this.renderer.addModel('rifle', rifleGlb);
    }

    // 3. 動態判定可用動畫並設定 fallback
    const sampleAnimator = new RigAnimator(cadetGlb);
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

    this.cadetGlb = cadetGlb;
    this.rifleGlb = rifleGlb;

    this.reset();
  }

  reset() {
    this.isGameOver = false;

    this.fighters = [
      this.createFighter('green', 'cadet_green', [-6, 0, 0], 1),
      this.createFighter('red', 'cadet_red', [6, 0, 0], -1)
    ];

    this.rifles = this.fighters.map(f => new RifleRenderer(this.renderer, this.rifleGlb));

    if (this.uiCallbacks.onUpdateHP) {
      this.uiCallbacks.onUpdateHP(100, 100);
    }
    if (this.uiCallbacks.onGameOver) {
      this.uiCallbacks.onGameOver(false, null);
    }
  }

  createFighter(team, modelKey, pos, lookDir) {
    const animator = new RigAnimator(this.cadetGlb);
    animator.play(this.animMapping.idle);

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
      f.animator.update(deltaTime);
      if (this.rifles[idx]) {
        this.rifles[idx].update(f.pos, f.rotY, f.state === 'ATTACK');
      }
    });
  }

  updateAI(self, target, dt, now) {
    if (self.state === 'DEAD') return;

    if (self.hp <= 0) {
      self.state = 'DEAD';
      if (this.animMapping.die) {
        self.animator.play(this.animMapping.die, false);
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
      self.animator.play(this.animMapping.run);

      const vx = (dx / dist) * this.MOVE_SPEED * dt;
      const vz = (dz / dist) * this.MOVE_SPEED * dt;
      self.pos[0] += vx;
      self.pos[2] += vz;
    } else {
      self.state = 'ATTACK';
      self.animator.play(this.animMapping.shoot);

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
        this.renderer.renderCharacter({
          modelKey: f.modelKey,
          position: f.pos,
          rotationY: f.rotY,
          pitch: f.pitchOffset,
          skeleton: f.animator.getBoneMatrices()
        });
      }
    });

    this.rifles.forEach(r => {
      if (r.render) r.render();
    });
  }
}

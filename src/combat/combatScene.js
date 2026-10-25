import { RigAnimator } from '../characters/rigAnimator.js';
import { RifleRenderer } from '../battle/rifleRenderer.js';

export class CombatScene {
  constructor(renderer, glbLoader) {
    this.renderer = renderer;
    this.glbLoader = glbLoader;
    this.isGameOver = false;

    // 基礎數值設定
    this.MAX_HP = 100;
    this.DAMAGE_PER_SHOT = 20;
    this.ATTACK_RANGE = 7.0;
    this.STOP_RANGE = 4.0;
    this.MOVE_SPEED = 2.0;

    this.fighters = [];
    this.rifles = [];
  }

  async init(uiCallbacks = {}) {
    this.uiCallbacks = uiCallbacks;

    // 1. 載入模型資源 (直接沿用現有路徑)
    const cadetGlb = await this.glbLoader.load('assets/characters/cadet/cadet-green.glb');
    const rifleGlb = await this.glbLoader.load('assets/weapons/rifle.glb');

    // 2. 註冊渲染模型 (紅軍套用紅色貼圖)
    this.renderer.addModel('cadet_green', cadetGlb);
    this.renderer.addModel('cadet_red', cadetGlb, {
      textureUrl: 'assets/characters/cadet/cadet-red-texture.jpg'
    });
    this.renderer.addModel('rifle', rifleGlb);

    // 3. 檢查可用動畫列表並做 fallback
    const sampleAnimator = new RigAnimator(cadetGlb);
    const availableClips = Object.keys(sampleAnimator.clips || {});
    console.log('[Combat] 讀取到可用動畫列表:', availableClips);

    const pickClip = (preferred, fallback) =>
      availableClips.includes(preferred) ? preferred : fallback;

    this.animMapping = {
      idle: pickClip('Idle', availableClips[0] || 'Idle'),
      run: pickClip('RunFast', pickClip('Running', pickClip('Walking', 'Idle'))),
      shoot: pickClip('Shoot', pickClip('Aim', pickClip('Idle', availableClips[0]))),
      die: pickClip('Die', pickClip('Death', null)) // 無死亡動畫時用翻轉趴地替代
    };

    this.cadetGlb = cadetGlb;
    this.rifleGlb = rifleGlb;

    this.reset();
  }

  reset() {
    this.isGameOver = false;

    // 重設綠軍與紅軍位置
    this.fighters = [
      this.createFighter('green', 'cadet_green', [-6, 0, 0], 1),
      this.createFighter('red', 'cadet_red', [6, 0, 0], -1)
    ];

    // 為雙方掛載步槍 (沿用 RifleRenderer 固定相對矩陣)
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
      state: 'MOVE', // MOVE, ATTACK, DEAD
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

      // 判定勝負
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

    // 更新角色動作與步槍
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
        self.pitchOffset = -Math.PI / 2; // 趴地替代
      }
      return;
    }

    const dx = target.pos[0] - self.pos[0];
    const dz = target.pos[2] - self.pos[2];
    const dist = Math.hypot(dx, dz);

    // 面向敵軍
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

        // 85% 機率命中扣血
        if (Math.random() < 0.85) {
          target.hp = Math.max(0, target.hp - this.DAMAGE_PER_SHOT);
        }
      }
    }
  }

  render() {
    this.fighters.forEach(f => {
      this.renderer.renderCharacter({
        modelKey: f.modelKey,
        position: f.pos,
        rotationY: f.rotY,
        pitch: f.pitchOffset,
        skeleton: f.animator.getBoneMatrices()
      });
    });

    this.rifles.forEach(r => r.render());
  }
}

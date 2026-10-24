# 報告班長！我想放假｜第一批動畫 + 模組化基底

## 這一包是什麼
- ✅ 使用你提供的 Meshy 阿兵哥模型和上一版 17 骨骼，沒有重做人物模型或刪除貼圖
- ✅ 同一個 `recruit-batch1.glb` 現在含 9 組動作：原有 Idle / Walk / LookAround，加上 Salute / RifleIdle / RifleWalk / Run / Hit / Death
- ✅ `animation-lab.html`：獨立手機網頁試玩頁，可用虛擬搖桿、拖曳旋轉視角、按鈕切換動畫
- ✅ 持槍演示有額外的**簡易訓練槍道具**，槍與士兵模型分開，未來可改為正式武器 GLB
- ✅ 將人物、地圖、戰鬥、小遊戲、數值特質、UI、核心工具分開
- ⚠️ 第一批是**程序設計的測試動作**，不是精修動作捕捉。肩膀、手臂、膝蓋、倒地和槍位還要實機調整。
- ⚠️ 目前模組化的是**新展示版／未來程式基底**；舊版 `index.html` 並沒有被全面重構，因此尚不能把舊遊戲視為完全模組化。

## 安裝（GitHub Pages）
1. 解壓 ZIP。
2. 把 **`animation-lab.html`、`src/`、`assets/`** 及可選的 README，一起上傳到 `Vmylife/Army` 儲存庫根目錄，保留資料夾內的檔名及層級。
3. **不要覆蓋 `index.html`。** `animation-lab.html` 是獨立入口，不會改動正式首頁。
4. 網址：`https://vmylife.github.io/Army/animation-lab.html`。
5. 若畫面顯示「找不到 GLB」，請檢查這個相對路徑是否存在：`assets/characters/recruit/recruit-batch1.glb`。
6. GitHub 上傳 **ZIP 本身不會自動解壓**。建議用電腦版 GitHub 的 Upload files 拖曳整個已解壓的檔案樹，或使用 GitHub Desktop / Git 用資料夾推送。手機網頁 GitHub 不方便大量建立巢狀資料夾。

## 專案層級與後續分工
```text
Army/
├─ index.html                         # 現有主遊戲：這次不動
├─ animation-lab.html                 # 新動畫測試入口
├─ assets/
│  ├─ characters/
│  │  └─ recruit/recruit-batch1.glb   # 角色模型（網格＋貼圖＋骨架＋9 動畫）
│  └─ weapons/                        # 未來放獨立 GLB 武器
├─ src/
│  ├─ animation-lab.js                # 只做測試畫面初始化
│  ├─ core/
│  │  ├─ math.js                      # 矩陣 / 3D 數學
│  │  ├─ glb.js                       # 模型載入
│  │  ├─ renderer.js                  # WebGL2 畫面
│  │  └─ clock.js                     # 訓練倒數
│  ├─ characters/
│  │  └─ animationPlayer.js           # 播放角色動畫
│  ├─ battle/
│  │  ├─ battleController.js          # 戰場基底，待正式實作
│  │  └─ weapon.js                    # 測試用簡化步槍
│  ├─ map/
│  │  └─ trainingGround.js            # 軍營區域 / 碰撞邊界資料
│  ├─ minigames/
│  │  └─ registry.js                  # 關卡註冊表
│  ├─ systems/
│  │  ├─ stats.js                     # 新局初始數值
│  │  └─ traits.js                    # 1~100 分 / 永久特質規則
│  └─ ui/
│     ├─ controls.js                  # 虛擬搖桿 / 動作操作
│     └─ styles.css                   # 橫直向 UI
└─ tools/
   └─ build_animations.py            # 重建六個動畫用腳本
```

## 動畫名稱（未來戰鬥、地圖模組使用）
| Animation Clip | 中文 | 觸發建議 |
|---|---|---|
| Idle | 待機 | 停止移動 |
| Walk | 走路 | 營區移動 |
| LookAround | 轉頭 | 巡查周圍 |
| Salute | 敬禮 | 遇到長官 |
| RifleIdle | 持槍待機 | 戰場 / 巡邏 |
| RifleWalk | 持槍行走 | 戰場移動 |
| Run | 跑步 | 體能 / 撤離 |
| Hit | 受擊 | 遭受傷害 |
| Death | 倒地 | 生命值歸零 |

## 獨立與擴充原則
- **移動系統**呼叫角色動作 `AnimationPlayer.setClip(...)`，不直接操作角色骨骼節點。
- **小遊戲**只回傳 1~100 分和獎勵規則，不直接改戰場 AI。
- **特質**取得後本局不可移除，正負特質可共存，每局開始重置（`src/systems/traits.js`）。
- **戰場**只讀士兵最終能力／特質，不必知道玩家在哪個軍營地點玩了哪些關卡。
- **武器**以單獨資產和裝備掛點設計，之後更換槍械不需重做角色。
- 未來正式整合主遊戲時，應將 `index.html` 的主邏輯逐步遷移到上述模組，而不是再次直接加入更多巨型內嵌程式。

## 技術與限制
- 此版本基於原 Meshy GLB 自動骨架，保留原模型 95,322 三角面與原貼圖。
- 使用 WebGL2、ES Modules，不依賴外部 CDN。GitHub Pages 以 HTTPS 提供最方便。
- 所有 6 個新動畫均已寫入 GLB 並完成結構檢查，但環境中的 Chromium 拒絕本地頁面存取，因此**沒有宣稱已完成 iPhone Safari 實機驗證**。
- `RifleIdle` 與 `RifleWalk` 內的示意槍械由網頁動態加上，不在角色 GLB 裡；等正式武器完成會改為可替換的模型掛點。
- 想用 `tools/build_animations.py` 自行重產，需 `numpy` + `scipy`，可執行：
  `python tools/build_animations.py <原始已綁骨架GLB> assets/characters/recruit/recruit-batch1.glb`

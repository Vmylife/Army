# Army v0.7.7 新主角正式整合

## 已完成
- 以原本 v0.7.6 最新地圖及操控版為底，替換為 Meshy 5,205 面新主角（36 骨骼、15 段原始動畫）
- 讓敵軍使用同一份 GLB 的骨架與動畫，另外載入紅軍帽／紅制服的專用貼圖（皮膚、眼睛、鞋子不染色）
- 不載入舊主角、舊敵人、3K/5K/10K 減面測試士兵；剔除 LOD 展示程式
- 角色停止會進入由走路片段合成的待機姿勢，移動時依原搖桿幅度切換走路、跑步、衝刺
- 地圖與搖桿、鏡頭縮放、建築、碰撞、畫面尺寸維持 v0.7.6 版本
- 打開 `?debug=1` 可看到動畫選單，測試匯出的所有動作。遊戲正常模式不會出現。

## 兩種部署方式
1. **全新整理**：在 GitHub 儲存庫主分支刪除舊的檔案／資料夾，再把完整版 ZIP 解壓後全部上傳到儲存庫根目錄（index.html 必須在根目錄）。
2. **最小更新**：解壓「更新檔」ZIP，依原本路徑覆蓋 6 個檔案，然後手動刪除底下的 6 個舊檔案。

## 應刪除的舊檔案
- `assets/characters/player/recruit-mixamo.glb`
- `assets/characters/enemy/enemy-red-mixamo.glb`
- `assets/characters/lod/soldier_3k.glb`
- `assets/characters/lod/soldier_5k.glb`
- `assets/characters/lod/soldier_10k.glb`
- `src/ui/lodShowcase.js`

## 注意
- 新主角來源：使用者上傳的 `Meshy_AI_Little_Green_Cadet_All_Animations.glb`。沒有重新減面或重新綁骨架。
- `assets/characters/cadet/cadet-red-texture.jpg` 是衍生紅隊貼圖，不是第二個人物 GLB。
- `index.html` 使用 `?v=077` 繞開舊的 iPhone Safari JS 快取。
- 目前已進行 GLB 結構、16 個可播放動畫矩陣、JS 語法以及相依路徑檢查，但瀏覽器本機測試被環境網路政策攔截，無法宣稱已在 iPhone Safari 實機驗證。

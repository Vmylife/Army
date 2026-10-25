國軍模擬器 Army — 戰鬥實驗場 v0.11.0（獨立原型）

安裝：
1. ZIP 解壓縮後，把 battle.html 上傳到 GitHub Vmylife/Army 的最外層。
2. 把 src/combat/ 裡五個檔案放進儲存庫的 src/combat/ 資料夾（沒有資料夾就新增）。
3. GitHub Pages 部署後，開啟 https://vmylife.github.io/Army/battle.html
4. 本版不修改 index.html、src/main.js、軍營配置或現有模型，不會更動軍營入口。
5. 須保留 GitHub 上原本的 src/core、src/characters/rigAnimator.js、src/battle/rifleRenderer.js、
   assets/characters/cadet/cadet-green.glb、cadet-red-texture.jpg、assets/weapons/rifle.glb。

目前可玩：
- 3D Low-Poly 開闊戰場與十組簡單掩體；綠色主角 / 紅色敵軍；共用現有 GLB。
- 自動戰鬥，敵軍分波從戰場周圍進入；自動移動、換目標、射擊、換彈、受傷、死亡。
- 金色主角彈道、紅色敵軍彈道與命中特效，掩體可阻擋射擊。
- 基本躲避與繞行，主角低血量時優先尋找較近的掩體。
- 普通士兵 / 超強士兵兩套數值，150 秒生存挑戰。
- HP、擊殺、波次、存活時間、戰報、重新開始、1x/2x、調整鏡頭和音效開關。

本版尚未加入：
- 軍營 6 分鐘訓練、技能／特質、手榴彈、武器升級、Boss、正式戰鬥換場。
- AI 戰術目前為簡化版，並非完整尋路網格（NavMesh）；部分障礙附近仍可能繞行不漂亮。
- 不保證每台手機都能同時流暢處理 30 多個完整骨架士兵；請優先實機測試。

備註：已執行 JS 語法檢查、戰鬥邏輯模擬和網頁操作模擬測試；
尚未在你的實際 GitHub Pages 環境測試全部 3D 模型與 FPS。

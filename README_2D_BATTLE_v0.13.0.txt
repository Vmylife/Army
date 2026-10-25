國軍模擬器 | Army 2D 戰鬥實驗場 v0.13.0

用途：手機優先的獨立 2D 戰鬥測試。不修改正式軍營，也不取代文字戰場人生。

安裝：
1. 將 battle2d.html 放在 GitHub Vmylife/Army 儲存庫的最外層。
2. 將 src/battle2d/game.js 及 src/battle2d/game.css 放在對應資料夾。
3. GitHub Pages 部署完成後訪問 https://vmylife.github.io/Army/battle2d.html

玩法：
- 選擇「普通士兵」或「超級士兵」開始作戰。
- iPhone / Android：左下方虛擬搖桿移動；右下閃避；射擊自動鎖定最近敵人。
- 電腦：WASD / 方向鍵移動、空白鍵閃避、Esc 暫停。
- 撐過最多 150 秒、累計擊退敵軍；每 25 秒提升一波敵軍。
- 有基本步槍子彈、敵方遠程子彈、移動障礙、沙包／木箱、急救包、手榴彈；超級士兵額外掃射。
- 本版本沒有連接軍營的真實訓練分數，所有能力為測試預設值。

注意：
- 這是以 Canvas 2D 程式繪製的角色與場景，並非把既有 3D GLB 模型直接轉換。
- 目前是原型，不含完整故事、排行榜、正式平衡、軍營地圖與 NPC 日常。
- 不依賴 CDN、圖片素材或遠端 API，可離線載入，但在 file:// 環境下瀏覽器可能限制 module script；請經由網頁伺服器或 GitHub Pages 開啟。
- 不會動到 index.html、war-story.html 或原有 3D 軍營任何檔案。

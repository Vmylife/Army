國軍模擬器 v0.10.10｜iPhone 軍營載入修復、讀取效能優化

安裝基礎：目前 v0.10.9（30 人 NPC、道路導航及碰撞系統）。

僅上傳本 ZIP 內檔案至 GitHub Vmylife/Army 同一目錄結構，覆蓋 index.html；其餘路徑都是新增。
不要刪掉原始 assets/characters/cadet/cadet-green.glb、cadet-life.glb，或原本的 main109.js、npcLife109.js。新版會使用新程式與精簡 NPC GLB。

更新檔案：
index.html                                     覆蓋，改用 bootstrap110，預先下載原主角模型
src/bootstrap110.js                           新增，真實下載百分比與單調進度顯示
src/main110.js                                新增，同時取得主角與輕量 NPC，其他模型限流載入
src/core/glb110.js                            新增，分塊下載顯示大小、下載逾時、無 BIN 重複複製
assets/characters/cadet/cadet-life-lite.glb  新增，NPC 的 11 種實用動畫＋原本膚色/衣服貼圖

精簡資料：
原本 cadet-life.glb 約 11.82 MB
新版 cadet-life-lite.glb 約 3.86 MB（減少約 67.3%）
刪除的是目前生活系統不會用的 7 組動畫、僅供其他光照通道使用的貼圖資料；原始 glb 仍保留在專案。
保留 Walking、Running、RunFast、Chair_Sit_Idle_M、Sit_and_Doze_Off、Sit_Cross_Legged_on_Floor、Stand_and_Chat、Pull_Radish、Victory_Cheer、push_up、situps。
主角 cadet-green.glb 不變，30 名 NPC 和 22 種行為不變；道路導航、碰撞亦沿用 v0.10.9。

載入流程：
1. 首頁載入時預先取得主角模型（沿用現有網址及瀏覽器快取）
2. 玩家按「開始遊戲」後並行下載原主角及輕量版 NPC 模型
3. 真實串流下載百分比與 MB 顯示，不再到載入完成才跳進度
4. 建築／道具模型最多同時處理 3 項，降低 iOS Safari 下載及 GPU 貼圖解碼的瞬間壓力
5. 網路或資源逾時會顯示錯誤及重新載入按鈕，而不是無限卡住

效能範圍提醒：
原本 GitHub 已部署的建築／道具／武器 GLB 合計仍約 91 MB。首次載入仍需要下載相當多檔案。
本版並沒有壓縮那些既有 GLB，不能保證首次進場只要幾秒或 30 NPC 的 FPS 改善多少；要大幅減少首次下載量，需要下一階段重新壓縮建築和道具模型（但需先確認其原始資產）。

檢查：
- 新 GLB 解析及所有動畫 sampler/accessor 讀取通過
- Javascript Node --check 通過
- ZIP 結構、檔案完整性通過
- 尚未在 iPhone 真正連線 GitHub Pages 進場完成測試

若部署後仍出現 0%：
先等待真實下載 MB 變化，若顯示錯誤可截圖回報。GitHub Pages 發布可能有短暫延遲，也可以強制重新整理。

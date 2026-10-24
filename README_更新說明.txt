Army v0.7.6 - 大地圖固定／小地圖地點標籤／流暢更新

僅需覆蓋以下 6 個檔案：
index.html
src/main.js
src/map/mapDrawing.js
src/ui/minimap.js
src/ui/worldMap.js
src/ui/playtest.css

操作方式：先解壓縮 ZIP，把同名檔案上傳到 Vmylife/Army 的 main 根目錄對應位置。
不可直接將 ZIP 檔本身上傳當網頁；不需要重新上傳任何 GLB。

更動：
1. 大地圖固定到使用者截圖相同方位（營舍右、餐廳左、大門下），不再跟鏡頭旋轉。
2. 刪除大地圖下方完整地點清單及圖例；保留地圖上的文字標籤和關閉按鈕。
3. 小地圖直接疊上可見範圍內的建築名稱；名稱不跟地圖一起倒轉。
4. 小地圖更新由每 100ms（10 FPS）改成約每 16ms（最高 60 FPS）。
5. 地圖藍色方向箭頭仍綁定士兵的 angle，原地旋轉相機不影響藍箭頭。

不改士兵 GLB、3K/5K/10K NPC、骨架、移動速度、地圖座標和碰撞系統。
Safari 的 WebGL 最終畫面需要線上部署後驗證。

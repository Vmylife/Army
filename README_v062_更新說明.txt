# Army v0.6.2 — 相機縮放 + 軍營大地圖（僅更新檔）

## 更新方式
1. 保留 GitHub 倉庫 Vmylife/Army 中既有的 assets、地圖、模型、動畫等檔案。
2. 解壓本 ZIP，把 index.html、src/main.js、src/ui/input.js、src/ui/playtest.css 覆蓋相同路徑，並新增 src/ui/worldMap.js。
3. 不要在 GitHub 只上傳 ZIP，請解壓後維持資料夾結構。
4. 等 GitHub Pages 部署後開啟 https://vmylife.github.io/Army/?v=062 。

## 操作
- iPhone/Android：畫面上以雙指捏合縮放；手指靠近 = 鏡頭拉遠，手指拉開 = 鏡頭拉近。範圍為原有鏡頭距離 1x～2x。
- 電腦：滑鼠滾輪拉近／拉遠。
- 中下方：原本隱藏式搖桿（走路／跑步／衝刺），功能保留。上方拖曳：旋轉鏡頭。
- 左上小地圖：點擊開啟完整營區地圖；按右上「×」或 Escape 關閉。
- 大地圖固定北方朝上，藍色箭頭顯示自己面向、紅點代表紅隊。下方列出 14 個軍營地點。

## 變更範圍與測試
- 修改：index.html, src/main.js, src/ui/input.js, src/ui/playtest.css
- 新增：src/ui/worldMap.js
- 未修改：GLB、Renderer、動畫、碰撞、大地圖幾何、角色移動速度及 src/ui/minimap.js。
- 已做 node --check 與 HTML/JS 引用存在性檢查；使用 Playwright 的觸控事件替身實測地圖開關、縮放手勢、搖桿取消、滾輪縮放；尚未在 iPhone Safari 真機 3D WebGL 實測。

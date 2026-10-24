Army v0.6.1｜固定小地圖、清除廣場線條、iPhone 防選取
==================================================

這是給已經正常執行 Army v0.6 的【增量更新檔】，不是完整遊戲包。
保留你原本 GitHub Army 倉庫裡的其他檔案、模型、地圖及資料夾。

更新方式：
1. 解壓縮這個 ZIP。
2. 將 index.html 與 src/ 裡的更新檔案依原本路徑上傳 GitHub（main 分支）。
3. 覆蓋同名檔案；其餘檔案保留，不用刪除或重傳 GLB。
4. 在 GitHub Pages 部署完成後開啟：https://vmylife.github.io/Army/?v=061

修改清單：
- index.html：更新 JS/CSS 載入版本避免用到舊快取
- src/main.js：僅更新必要模組的快取版本
- src/core/renderer.js：僅更新軍營地形模組的快取版本
- src/map/campGeometry.js：移除集合場灰色交叉地磚線與白色排隊線
- src/ui/minimap.js：固定地圖方向、角色居中，用藍色圓點／箭頭／視野扇形顯示角色面向
- src/ui/playtest.css：iOS 禁止長按選字、拖拉、呼出選取選單
- src/ui/input.js：攔截選取／右鍵選單／拖曳事件，保留浮動搖桿與鏡頭控制

這一版不修改 GLB、骨架、主角動畫、移動速度或地圖碰撞。
驗證：JavaScript 語法、依賴路徑、2D 雷達旋轉對比、瀏覽器 selectstart/contextmenu 阻擋通過。
限制：無法在此環境完成 iPhone Safari WebGL2 的完整實機測試。

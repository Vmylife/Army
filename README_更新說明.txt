Army v0.7.5｜三種低面數士兵 + 小地圖、大地圖方向統一

【這是「只含新增與修改」的更新包，非完整遊戲】
先保留 GitHub 上其他既有檔案，包括主角和紅隊敵人的 GLB。
將壓縮檔內 index.html、src、assets 資料夾內檔案依照原始路徑上傳覆蓋。

新增：
- assets/characters/lod/soldier_3k.glb（3,000 triangles）
- assets/characters/lod/soldier_5k.glb（5,000 triangles）
- assets/characters/lod/soldier_10k.glb（9,999 triangles）
- src/ui/lodShowcase.js（獨立品質比較模組）

更新：
- index.html
- src/main.js
- src/ui/minimap.js
- src/ui/worldMap.js
- src/map/mapDrawing.js

如何測試：
1. 打開 https://vmylife.github.io/Army/?v=075
2. 在軍營大門附近，看到並排站立、上方有「3,000 面」「5,000 面」「10,000 面」標籤的三個士兵。
3. 畫面下方會有「動作對比：站立」，點擊可以切換成走路、跑步、再回站立。三隻 NPC 不會真的位移。
4. 玩家主角維持原始高品質模型、原本動作和移動方式；三隻品質比較兵背景依序載入，失敗不應阻止遊戲運作。
5. 原地拖動上方畫面旋轉鏡頭，地圖藍箭頭不應轉動；實際走路轉身後，箭頭才跟著士兵實際面向轉。
6. 左上小地圖維持角色置中；打開全圖後，地圖與小地圖使用同一投影方向，避免左右鏡像；上方的 N 羅盤顯示實際地理北向。

注意：
* 此版是模型 LOD 視覺比較／效能測試用，尚未自動依距離切換 LOD。
* GLB 是以低面數版本再做「骨骼／UV 分群」式網格減面，關節變形和臉部貼圖仍需在手機實際觀看確認；尚非正式模型資產。
* 地圖已改為兩張使用同一個鏡頭對齊投影；此版的全圖不再固定北方在螢幕正上方，請看 N 羅盤。
* 整合程式與模型資料已測，Safari 實機 WebGL 的顯示效果仍須部署後驗證。

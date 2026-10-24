# Army v0.5.1｜沉浸式浮動搖桿

## 需要上傳到 GitHub 的檔案（6 個）
- `army-playtest.html`
- `src/main.js`
- `src/ui/input.js`
- `src/ui/playtest.css`
- `src/ui/minimap.js`
- `src/systems/settings.js`

保留原本 `assets/`、`src/map/`、`src/core/`、`src/characters/` 等資料夾，不需重新上傳模型或地圖。

## 修改
- 移除左上角遊戲標題、右上角 FPS、動作測試面板、固定搖桿與小字提示。
- 觸控從螢幕中下方（高度 40% 以下）開始拖曳，搖桿就會在起始位置出現；放開即隱藏。
- 推動很小為慢走、推動中等為跑步、推動到外圈為衝刺，速度連續調整；無操作時使用固定待機。
- 螢幕上方拖曳仍可轉動鏡頭；小地圖預設收起，需要時可展開。
- 電腦支援 WASD／方向鍵、Shift 衝刺、Alt 慢走、拖曳螢幕上半部旋轉鏡頭。

## 測試網址
`https://vmylife.github.io/Army/army-playtest.html?v=051`

> 這版沒有修改既有角色模型及其骨架，不覆蓋 `index.html`。

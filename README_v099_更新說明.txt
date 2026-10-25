Army v0.9.9 更新內容

1. 直接覆蓋 src/props/propRenderer.js，修正 v0.9.8 自訂道具（籃框、手榴彈箱）沒有顯示的問題。
2. 路燈重新擺位：全部再往草皮內推，避免底座壓在道路上。
3. 路燈方向再調整，讓燈臂更偏向道路／步道。
4. 保留籃框 GLB 與手榴彈箱 GLB。
5. 保留中山室與營舍後退調整。

覆蓋檔案：
- index.html
- src/bootstrap99.js
- src/lighting96.js
- src/map/layout95.js
- src/map/layout99.js
- src/map/drawMap95.js
- src/map/ground94.js
- src/map/ground99.js
- src/props/propRenderer.js
- src/props/propRenderer98.js
- assets/props/basketball-hoop.glb
- assets/props/grenade-crate.glb

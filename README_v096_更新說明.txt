國軍模擬器 Army v0.9.6 — 輕量光影／天空／地面細節（僅更新檔）

直接依 ZIP 相同路徑上傳 GitHub Vmylife/Army 覆蓋即可。
此 ZIP 包含 v0.9.4 地面美化與 v0.9.5 單戰場、籃球場、椅子調整，
可直接從目前 GitHub v0.9.3 安裝；不需再單獨上傳前兩版。

v0.9.6 新增內容：
1. 斜向早晨日光與上下雙色環境補光（草地、建築、人物、道具）。
2. 天空從地平線暖灰到上方淡藍的漸層背景；遠距淡霧。
3. 建築、樹木、桶子、箱子、沙包等固定低對比接地陰影。
4. 路面交界加入細而微微凸起的路緣石（僅長直段）。
5. 程序化低多邊形小草束與碎石，固定亂數位置，不擋路、不參與碰撞。
6. 延續前版草地／土壤微噪點與道路接縫。

技術原則：不使用 Three.js、不使用陰影貼圖、不進行逐幀的陰影計算、
不增加外部圖片／GLB 模型。天空每幀僅 1 次簡單三角形繪製，
固定細節在啟動時合併到原本的地面網格。

覆蓋清單：
index.html
src/bootstrap95.js
src/bootstrap96.js
src/lighting96.js
src/map/layout95.js
src/map/ground94.js
src/map/ground95.js
src/map/ground96.js
src/map/drawMap95.js

注意：已完成語法與資料 smoke tests；尚未實際透過完整 GLB 資源跑 FPS 實測。

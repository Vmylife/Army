# 國軍模擬器 Army｜乾淨完整版 v0.6

這是完整 GitHub Pages 網頁遊戲，而不是修正包。**不需要另外下載 GLB 或依賴舊遊戲檔案**。

## 最簡單部署方式

1. 建立或保留名為 `Army` 的 **公開** GitHub repository（擁有者 `Vmylife`）。
2. 刪除舊測試檔案／用全新空的儲存庫。**ZIP 解壓縮後，上傳 ZIP 裡面的檔案與資料夾到 repository 的 `main` 根目錄**，不要把外層資料夾整個當成一個子資料夾。
3. GitHub → Settings → Pages → Build and deployment → Source 選 **Deploy from a branch**，Branch 選 **main**、資料夾選 **/(root)**，按 Save。
4. 等 GitHub 顯示發布成功後，直接開 https://vmylife.github.io/Army/ 即可。GitHub Pages 會自動讀根目錄 `index.html`。

**請勿刪除整個 GitHub 帳號。** 如果只是清空倉庫也能保留原網址；如要重新建庫，名稱仍需是 `Army` 才能保持相同網址。

## 操作

- 手指在畫面下方 59% 的區域按住滑動：出現虛擬搖桿。輕推走路、中推跑步、推到底衝刺；放開即停下且搖桿隱藏。
- 手指從上方 41% 的畫面開始拖曳：旋轉鏡頭。
- 電腦 WASD／方向鍵移動；Shift 衝刺、Alt 慢走。
- 左上角小地圖以角色為中心，會隨角色朝向旋轉。
- `?debug=1` 開啟移動座標、動畫模式的簡易診斷資訊；正常網址不顯示這些內容。

## 正式需要的檔案結構

```
index.html
.nojekyll
assets/characters/player/recruit-mixamo.glb
assets/characters/enemy/enemy-red-mixamo.glb
src/main.js
src/core/glb.js
src/core/math.js
src/core/renderer.js
src/characters/rigAnimator.js
src/map/camp.js
src/map/campGeometry.js
src/ui/input.js
src/ui/minimap.js
src/ui/playtest.css
src/systems/settings.js
```

`src/battle/`、`src/minigames/` 保留作未來擴充。沒有其他舊展示檔案。

## 技術備註

這版以清理介面以前能正常工作的 v0.5 大地圖與角色渲染流程重組，沒有使用後續版本的不穩定 WebGL 像素偵測與模型載入切換。角色原始骨架與動畫保持不變。GitHub Pages 必須等部署成功才會開啟；如果遇到手機 Safari 快取，改用新的無痕分頁確認。

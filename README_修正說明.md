# Army v0.5.3｜士兵消失修正（已讀取 GitHub 現況）

## 確認原因
GitHub `src/main.js` 會引用 `options.walkThreshold`、`options.runThreshold`、`options.sprintThreshold`，但 GitHub `src/systems/settings.js` 中沒有這三個欄位。移動強度 0 時被誤判成 RunFast，速度成為 NaN，骨骼動畫時間及矩陣變成 NaN，導致角色不顯示。

另外 GitHub 的 `army-playtest.html` 還保留舊版 `地圖/展開` HTML，所以地圖顯示混雜。

## 更新方式
將下列三個檔案上傳至 GitHub `Vmylife/Army`，**保持資料夾路徑並覆蓋舊檔**：

- `army-playtest.html`
- `src/main.js`
- `src/systems/settings.js`

不需要重新上傳 GLB 模型，不要覆蓋 `index.html`。

部署後開啟 `https://vmylife.github.io/Army/army-playtest.html?v=053`，建議在 Safari 重新載入。應看到角色正常站在集合場，左上小地圖只有圓形雷達且隨面向旋轉。搖桿仍是中下方按下才顯示，輕推走路、中推跑步、推到底衝刺。

## 修正內容
- 寫回浮動搖桿三個檔位門檻 0.09 / 0.42 / 0.75
- 額外保護無效搖桿輸入，避免 NaN 進入骨架播放時間
- 移除舊地圖展開按鈕和提示，左上角常駐旋轉雷達
- 主入口與設定檔使用新版查詢參數避免 Safari 舊快取

## 目前驗證界線
已讀取 GitHub 的實際版本並核對根因；模型原本已存在且主檔下載路徑正確。修正後是否能在 iPhone Safari 呈現仍需實機測試，這不保證所有裝置 WebGL 一定能正常播放。

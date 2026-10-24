Army v0.5.5 — Safari 載入失敗修復

這次請把 ZIP 內 5 個檔案按原路徑上傳到 Vmylife/Army 倉庫：

(覆蓋) army-playtest.html
(覆蓋) src/main.js
(覆蓋) src/core/renderer.js
(覆蓋) src/core/glb.js
(新增) assets/characters/player/recruit-mobile.glb

請勿只上傳 HTML！手機輕量版 GLB 一定要一起上傳。
請勿刪除原始 assets/characters/player/recruit-mixamo.glb。
地圖、浮動搖桿、小地圖、原始角色、敵軍模型不需要改動。

修正重點：
1. iPhone 優先用 3.25MB 的輕量主角（44 骨骼、原九段動畫；三角面數較少、貼圖改 1024px），桌面沿用原始高畫質。
2. 主角檔讀取失敗自動重試並改試原模型。
3. 敵人模型載入失敗不阻止主角進入軍營。
4. 移除 v0.5.4 的高成本像素讀取偵測；還原 v0.5.2 的角色繪製方式。
5. 貼圖載入失敗不再直接崩潰，而會退回單色暫時顯示。
6. 錯誤畫面顯示失敗階段、模型路徑與重試按鈕。

網址： https://vmylife.github.io/Army/army-playtest.html?v=055

注意：已做靜態程式與模型資料驗證，尚未在使用者的 iPhone Safari 進行實機驗證。

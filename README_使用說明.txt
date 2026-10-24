報告班長！我想放假 —— Meshy 阿兵哥初版自動綁骨架（實驗性）

內含
1. Little_Green_Guardian_Rigged.glb
   由原始 Meshy_GLb 建立的帶骨架 3D 模型。保留原始外觀、UV 與貼圖。
   包含 17 個骨骼、Idle（站立）、Walk（走路）、LookAround（轉頭）三個短動畫。

2. rig-preview.html
   手機與電腦皆可開啟的模型動畫檢視頁，能切換三種動畫，並旋轉鏡頭。
   此頁不依賴外部 JS，但需要 WebGL2，且必須與上述 GLB 同時部署。

3. vtk_original.png / vtk_walk.png
   模型原始外觀及大致走路姿勢的靜態檢查圖。

使用方式（GitHub Pages）
- 在 GitHub 的 Vmylife/Army 倉庫根目錄上傳 rig-preview.html 及 Little_Green_Guardian_Rigged.glb。
- 兩個檔案必須放在同一層，名稱不能更改，別覆蓋原本 index.html。
- 部署完成後開啟： https://vmylife.github.io/Army/rig-preview.html
- 分別按下 站立 / 走路 / 轉頭；用手指左右拖曳旋轉模型。

注意事項
- 本版為「程式生成近似骨骼權重」，不是專業美術人員手工調整權重。
- 原始 Meshy 模型只有單一網格且手腳自然下垂，肩膀、膝蓋、腰部可能產生穿模或扭曲。
- 走路已經有手腳交替擺動，但還不是正式的完整步態 / 足底 IK / 根運動。
- 若希望把動作品質提升到正式遊戲等級，建議先確認模型能否接受簡單走路，再進行人工修權重、調整骨骼與地面接觸。
- GLB 可匯入 Blender、Three.js 等支援 glTF skin/animation 的工具；出於兼容性考量未使用外部材質網址。
- 本次沒有改動 GitHub 上的任何原始遊戲檔案。

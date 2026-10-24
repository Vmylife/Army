Army v0.7.8｜角色細線渲染修正

只要把 ZIP 裡面這三個檔案按照相同路徑上傳到 GitHub：
  index.html
  src/main.js
  src/core/renderer.js

沒有修改 GLB、貼圖、骨架、動畫或地圖。
這次提高角色貼圖取樣精度（highp），停止對密集 UV Atlas 自動生成 mipmap，改用原圖雙線性過濾與邊緣夾取。
此修正為針對「Meshy 正常、遊戲內有線」的優先排除方案；不同裝置仍須實機確認。

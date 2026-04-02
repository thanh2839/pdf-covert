const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true }
  });

  win.webContents.on('did-finish-load', async () => {
    try {
      const i = 0;
      const dims = await win.webContents.executeJavaScript(\
        (function() {
          const tables = document.querySelectorAll('table');
          tables.forEach(t => t.style.display = 'none');
          const target = tables[\];
          if (target) {
            target.style.display = 'block';
            document.body.style.margin = '0';
            return { w: Math.ceil(target.scrollWidth), h: Math.ceil(target.scrollHeight) };
          }
          return null;
        })();
      \);
      
      console.log('Dims:', dims);
      if (dims) {
        const w = Math.min(dims.w, 4000);
        const h = Math.min(dims.h, 4000);
        win.setContentSize(w, h);
        await new Promise(r => setTimeout(r, 500));
        const img = await win.webContents.capturePage({ x: 0, y: 0, width: w, height: h });
        fs.writeFileSync('C:/Users/toygu/AppData/Local/Temp/test_sheet1.png', img.toPNG());
        console.log('Saved capture!');
      }
    } catch(e) {
      console.error(e);
    } finally {
      app.quit();
    }
  });

  win.loadFile('C:/Users/toygu/AppData/Local/Temp/35 MO TA CONG VIEC CHI TIET THEO VI TRI_VIE_HVHR_2025_ver01.html');
});

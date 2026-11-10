import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('skinstock_steam_id', '76561198000000000');
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  // Click Inventar tab
  try {
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, div, span'));
      const inv = items.find(el => el.textContent && el.textContent.trim() === 'Inventar');
      if (inv) inv.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'assets/screenshot-inventory.png' });
    console.log('Saved assets/screenshot-inventory.png');
  } catch (e) {
    console.error('Inventory click error:', e);
  }

  // Click Analysen tab
  try {
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, div, span'));
      const a = items.find(el => el.textContent && el.textContent.trim() === 'Analysen');
      if (a) a.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'assets/screenshot-analytics.png' });
    console.log('Saved assets/screenshot-analytics.png');
  } catch (e) {
    console.error('Analytics click error:', e);
  }

  // Click Einstellungen tab
  try {
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, div, span'));
      const s = items.find(el => el.textContent && el.textContent.trim() === 'Einstellungen');
      if (s) s.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'assets/screenshot-settings.png' });
    console.log('Saved assets/screenshot-settings.png');
  } catch (e) {
    console.error('Settings click error:', e);
  }

  await browser.close();
  process.exit(0);
})();

import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Desktop 16:9 Showcase
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  
  // Set localStorage to load mock inventory
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('skinstock_steam_id', '76561198000000000');
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  await page.screenshot({ path: 'assets/screenshot-dashboard.png' });
  console.log('Saved assets/screenshot-dashboard.png');

  // Mobile 9:16 Showcase (iPhone 15 Pro)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  
  await mobilePage.evaluateOnNewDocument(() => {
    localStorage.setItem('skinstock_steam_id', '76561198000000000');
  });

  await mobilePage.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  await mobilePage.screenshot({ path: 'assets/screenshot-mobile.png' });
  console.log('Saved assets/screenshot-mobile.png');

  await browser.close();
  process.exit(0);
})();

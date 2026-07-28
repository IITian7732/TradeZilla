import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  
  // Login as mock user
  await page.type('input[type="email"]', 'shankarjaiswal713@gmail.com');
  await page.type('input[type="password"]', 'yash@843');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  // Now we are on dashboard, go to charts
  await page.goto('http://localhost:5173/charts', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Inject RSI into localStorage
  await page.evaluate(() => {
    localStorage.setItem('tradezilla_state', JSON.stringify({
      activeIndicators: ['RSI_1'],
      rsiSettings: {
        length: 14,
        plot: true,
        plotColor: '#4c1d95',
        upperLimit: true,
        upperLimitColor: '#3b82f6',
        upperLimitValue: 60,
        lowerLimit: true,
        lowerLimitColor: '#3b82f6',
        lowerLimitValue: 40,
        hlinesBackground: true,
        hlinesBackgroundColor: '#c4b5fd'
      }
    }));
  });
  
  // Reload to apply localStorage
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: 'chart_issue.png' });
  await browser.close();
})();

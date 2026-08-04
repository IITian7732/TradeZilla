import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log("Navigating to login...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'load' });
  await page.waitForSelector('input[type="email"]');
  
  // Login as mock user
  await page.type('input[type="email"]', 'shankarjaiswal713@gmail.com');
  await page.type('input[type="password"]', 'yash@843');
  await page.click('button[type="submit"]');
  
  console.log("Waiting for dashboard...");
  await new Promise(r => setTimeout(r, 2000));
  
  // Go to charts
  console.log("Navigating to charts...");
  await page.goto('http://localhost:5173/charts', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 4000));

  // Log all button text content
  const buttonsInfo = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, div, span, a')).map(el => {
      const text = el.textContent || '';
      if (text.length > 0 && text.length < 50) {
        return {
          tagName: el.tagName,
          text: text.trim().replace(/\s+/g, ' '),
          id: el.id,
          className: el.className
        };
      }
      return null;
    }).filter(Boolean);
  });

  console.log("Found text elements on page:");
  console.log(JSON.stringify(buttonsInfo, null, 2));

  await page.screenshot({ path: 'charts_debug.png' });
  await browser.close();
})();

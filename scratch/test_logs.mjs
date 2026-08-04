import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log("Navigating to login...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'load' });
  await page.waitForSelector('input[id="login-email"]');

  await page.type('input[id="login-email"]', 'shankarjaiswal713@gmail.com');
  await page.type('input[id="login-password"]', 'yash@843');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'login_result.png' });
  await browser.close();
})();

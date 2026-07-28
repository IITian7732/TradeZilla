import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  const filePath = `file://${path.resolve('test_bg.html')}`;
  await page.goto(filePath);
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();

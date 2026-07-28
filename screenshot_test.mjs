import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const filePath = `file://${path.resolve('test_bg.html')}`;
  await page.goto(filePath);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'test_bg.png' });
  await browser.close();
})();

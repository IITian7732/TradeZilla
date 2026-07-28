import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const filePath = `file://${path.resolve('test_bg2.html')}`;
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'test_bg2.png' });
  await browser.close();
})();

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

  await new Promise(r => setTimeout(r, 2000));

  console.log("Navigating to charts...");
  const navButtons = await page.$$('button, div, span, a');
  let chartsNavBtn = null;
  for (const btn of navButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.trim() === 'Charts') {
      chartsNavBtn = btn;
      break;
    }
  }

  if (chartsNavBtn) {
    await chartsNavBtn.click();
    await new Promise(r => setTimeout(r, 4000));
  } else {
    console.log("Charts nav button not found");
    await browser.close();
    return;
  }

  // Find the watermark element
  console.log("Locating tv-watermark-link...");
  const logoLink = await page.$('.tv-watermark-link');
  if (logoLink) {
    // 1. Take a screenshot of normal state (collapsed)
    console.log("Capturing normal collapsed state...");
    await page.screenshot({ path: 'watermark_normal.png' });

    // 2. Hover over the logo
    console.log("Hovering over tv-watermark-link...");
    const boundingBox = await logoLink.boundingBox();
    if (boundingBox) {
      await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
      await new Promise(r => setTimeout(r, 1000)); // wait for transition
      
      console.log("Capturing hovered expanded state...");
      await page.screenshot({ path: 'watermark_hovered.png' });
    }
  } else {
    console.log("tv-watermark-link element not found");
  }

  await browser.close();
})();

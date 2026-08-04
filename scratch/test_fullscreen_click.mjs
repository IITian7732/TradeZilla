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

  // Find the fullscreen button (it has title="Full Screen" or an svg with class/lucide-maximize)
  console.log("Clicking Full Screen button...");
  const fsBtn = await page.$('button[title="Full Screen"]');
  if (fsBtn) {
    await fsBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    
    // Check if document.fullscreenElement is set on the page
    const fsElementInfo = await page.evaluate(() => {
      return {
        hasFsElement: !!document.fullscreenElement,
        fsElementId: document.fullscreenElement ? document.fullscreenElement.id : null,
        fsElementTagName: document.fullscreenElement ? document.fullscreenElement.tagName : null
      };
    });
    console.log("Fullscreen Element Info:", fsElementInfo);
  } else {
    console.log("Fullscreen button not found");
  }

  await page.screenshot({ path: 'fullscreen_clicked.png' });
  await browser.close();
})();

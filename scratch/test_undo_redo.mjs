import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));

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

  const logHistoryState = async (label) => {
    const state = await page.evaluate(() => ({
      length: window._chartHistory ? window._chartHistory.length : 0,
      index: window._chartHistoryIndex,
      indexRef: window._chartHistoryIndexRef,
      drawingsCount: window._chartHistory && window._chartHistoryIndex >= 0 && window._chartHistory[window._chartHistoryIndex] ? window._chartHistory[window._chartHistoryIndex].drawings.length : 0
    }));
    console.log(`[${label}] History Length: ${state.length}, Index State: ${state.index}, Index Ref: ${state.indexRef}, Drawings Count: ${state.drawingsCount}`);
  };

  await logHistoryState("Initial");

  // Press Alt + H to draw horizontal line at current hover (which is none, so it activates tool).
  // Instead, move mouse to (600, 350) and press Alt + H to instantly place a line
  console.log("Placing a Horizontal Line via Alt+H...");
  await page.mouse.move(600, 350);
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.down('Alt');
  await page.keyboard.press('KeyH');
  await page.keyboard.up('Alt');
  await new Promise(r => setTimeout(r, 1000));

  await logHistoryState("After Placing 1st Drawing");

  // Place another horizontal line at (600, 450)
  console.log("Placing a second Horizontal Line via Alt+H...");
  await page.mouse.move(600, 450);
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.down('Alt');
  await page.keyboard.press('KeyH');
  await page.keyboard.up('Alt');
  await new Promise(r => setTimeout(r, 1000));

  await logHistoryState("After Placing 2nd Drawing");

  // Press Cmd + Z once
  console.log("Pressing Cmd + Z once...");
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyZ');
  await page.keyboard.up('Meta');
  await new Promise(r => setTimeout(r, 1000));

  await logHistoryState("After 1st Undo");

  // Press Cmd + Z second time
  console.log("Pressing Cmd + Z second time...");
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyZ');
  await page.keyboard.up('Meta');
  await new Promise(r => setTimeout(r, 1000));

  await logHistoryState("After 2nd Undo");

  await browser.close();
})();

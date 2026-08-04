import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log("Navigating to login...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'load' });
  await page.waitForSelector('input[id="login-email"]');
  
  // Login with correct mock credentials
  await page.type('input[id="login-email"]', 'shankarjaiswal713@gmail.com');
  await page.type('input[id="login-password"]', 'yash@843');
  await page.click('button[type="submit"]');
  
  console.log("Waiting for navigation to dashboard...");
  await new Promise(r => setTimeout(r, 2000));
  
  // Take screenshot of dashboard to confirm login
  await page.screenshot({ path: 'dashboard_confirmed.png' });

  // Click on "Charts" navigation button at the bottom
  console.log("Clicking on Charts nav button...");
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
    console.log("Clicked Charts nav button. Waiting for charts page...");
    await new Promise(r => setTimeout(r, 5000));
  } else {
    console.log("Charts nav button not found!");
    await browser.close();
    return;
  }

  // Take screenshot of charts page
  await page.screenshot({ path: 'charts_loaded.png' });

  // Let's print the buttons to make sure we can find Indicators button
  const textElements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, div, span, a')).map(el => {
      const text = el.textContent || '';
      if (text.length > 0 && text.length < 50) {
        return text.trim();
      }
      return null;
    }).filter(Boolean);
  });
  console.log("Found text elements on Charts page:", textElements);

  // Click on Indicators
  const buttons = await page.$$('button');
  let indicatorsBtn = null;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Indicators')) {
      indicatorsBtn = btn;
      break;
    }
  }

  if (indicatorsBtn) {
    console.log("Clicking Indicators...");
    await indicatorsBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    
    // Find RSI option
    const dropdownItems = await page.$$('div, button, span');
    let rsiOption = null;
    for (const item of dropdownItems) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text === 'RSI') {
        rsiOption = item;
        break;
      }
    }
    if (rsiOption) {
      console.log("Clicking RSI...");
      await rsiOption.click();
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const hasOscillator = await page.evaluate(() => {
    return document.querySelectorAll('.oscillator-pane').length > 0;
  });
  console.log("Has oscillator pane after clicking:", hasOscillator);

  // Let's get container heights and check layout
  const getLayout = async (stageName) => {
    return await page.evaluate((stage) => {
      const divs = Array.from(document.querySelectorAll('div'));
      const container = divs.find(d => {
        const style = d.getAttribute('style') || '';
        return style.includes('flex-direction: column') && style.includes('position: absolute') && d.querySelector('.oscillator-pane');
      });
      if (!container) return { stage, error: "Bottom container not found" };

      const rect = container.getBoundingClientRect();
      const children = Array.from(container.children).map((child, idx) => {
        const childRect = child.getBoundingClientRect();
        return {
          index: idx,
          tagName: child.tagName,
          className: child.className,
          style: child.getAttribute('style'),
          height: childRect.height,
          top: childRect.top,
          bottom: childRect.bottom
        };
      });

      return {
        stage,
        containerHeight: rect.height,
        children
      };
    }, stageName);
  };

  let layout1 = await getLayout("Initial");
  console.log("Initial Layout:", JSON.stringify(layout1, null, 2));

  // Find resizer
  const resizer = await page.$('div[style*="cursor: row-resize"]');
  if (resizer) {
    const box = await resizer.boundingBox();
    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      
      // Let's drag up (increase height)
      console.log("Dragging up (increasing height)...");
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, startY - 100);
      await page.mouse.up();
      await new Promise(r => setTimeout(r, 2000));
      
      let layout2 = await getLayout("After Drag Up");
      console.log("After Drag Up Layout:", JSON.stringify(layout2, null, 2));

      // Drag down (decreasing height)
      console.log("Dragging down (decreasing height)...");
      // Find the resizer again because it has moved!
      const resizer2 = await page.$('div[style*="cursor: row-resize"]');
      const box2 = await resizer2.boundingBox();
      const startX2 = box2.x + box2.width / 2;
      const startY2 = box2.y + box2.height / 2;
      
      await page.mouse.move(startX2, startY2);
      await page.mouse.down();
      await page.mouse.move(startX2, startY2 + 200); // Drag way down
      await page.mouse.up();
      await new Promise(r => setTimeout(r, 2000));
      
      let layout3 = await getLayout("After Drag Down");
      console.log("After Drag Down Layout:", JSON.stringify(layout3, null, 2));
      
      await page.screenshot({ path: 'test_after_drag_down.png' });
    }
  }

  await browser.close();
})();

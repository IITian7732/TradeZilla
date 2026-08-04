import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log("Navigating to login...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'load' });
  
  console.log("Waiting for email input...");
  await page.waitForSelector('input[type="email"]');
  
  // Login as mock user
  await page.type('input[type="email"]', 'shankarjaiswal713@gmail.com');
  await page.type('input[type="password"]', 'yash@843');
  await page.click('button[type="submit"]');
  
  console.log("Waiting for dashboard/navigation...");
  await new Promise(r => setTimeout(r, 2000));
  
  // Go to charts
  console.log("Navigating to charts...");
  await page.goto('http://localhost:5173/charts', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 4000));

  // Add RSI indicator using UI click
  // Find the button containing "Indicators"
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
    console.log("Clicking Indicators button...");
    await indicatorsBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    
    // Find the RSI option in the dropdown and click it
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
      console.log("Clicking RSI option...");
      await rsiOption.click();
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log("RSI option not found in dropdown");
    }
  } else {
    console.log("Indicators button not found");
  }

  // Let's check if the oscillator pane is rendered
  const hasOscillator = await page.evaluate(() => {
    return document.querySelectorAll('.oscillator-pane').length > 0;
  });
  console.log("Has oscillator pane:", hasOscillator);

  // Let's get layout information before dragging
  const getLayout = async (stage) => {
    return await page.evaluate((stage) => {
      // Find the absolute positioned bottom pane container
      const divs = Array.from(document.querySelectorAll('div'));
      // Find the div that has background: rgb(255, 255, 255) (or #ffffff) and display: flex and flexDirection: column
      // containing .oscillator-pane
      const container = divs.find(d => {
        const style = d.getAttribute('style') || '';
        return style.includes('flex-direction: column') && style.includes('position: absolute') && d.querySelector('.oscillator-pane');
      });
      
      if (!container) return { stage, error: "Container not found" };
      
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
          bottom: childRect.bottom,
          scrollHeight: child.scrollHeight
        };
      });

      return {
        stage,
        containerHeight: rect.height,
        containerTop: rect.top,
        containerBottom: rect.bottom,
        children
      };
    }, stage);
  };

  let layout1 = await getLayout("Initial");
  console.log("Initial Layout:", JSON.stringify(layout1, null, 2));

  // Find the resizer handle
  const resizer = await page.$('div[style*="cursor: row-resize"]');
  if (resizer) {
    console.log("Found resizer handle. Dragging down...");
    
    // Drag the resizer down
    const boundingBox = await resizer.boundingBox();
    if (boundingBox) {
      const startX = boundingBox.x + boundingBox.width / 2;
      const startY = boundingBox.y + boundingBox.height / 2;
      
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      // Drag down by 150px
      await page.mouse.move(startX, startY + 150);
      await page.mouse.up();
      
      await new Promise(r => setTimeout(r, 2000));
      
      let layout2 = await getLayout("After Drag Down");
      console.log("After Drag Down Layout:", JSON.stringify(layout2, null, 2));

      // Take a screenshot
      await page.screenshot({ path: 'test_drag_down.png' });
    }
  } else {
    console.log("Resizer handle not found");
  }

  await browser.close();
})();

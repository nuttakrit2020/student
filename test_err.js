const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('Error') || text.includes('Exception')) {
      console.log('BROWSER CONSOLE:', text);
    }
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  // Set localStorage to bypass login
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.setItem('adminKey', 'admin2569');
  });
  
  await page.goto('http://localhost:3000/admin');
  
  // wait up to 10 seconds for the button to appear
  let btnToClick = null;
  for (let i=0; i<100; i++) {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('ตารางรายสัปดาห์')) {
        btnToClick = btn;
        break;
      }
    }
    if (btnToClick) break;
    await new Promise(r => setTimeout(r, 100));
  }

  if (btnToClick) {
    console.log('Found button, clicking...');
    await btnToClick.click();
    await new Promise(r => setTimeout(r, 5000)); // wait for crash
  } else {
    console.log('BUTTON NOT FOUND');
    console.log(await page.content());
  }
  
  console.log('Done testing.');
  await browser.close();
})();

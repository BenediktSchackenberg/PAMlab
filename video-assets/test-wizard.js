const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // 1. Dashboard with new "Build Workflow" button
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'test-dashboard.png' });
  console.log('✓ Dashboard');

  // 2. Navigate to Workflow Builder via sidebar
  const navButtons = await page.$$('nav button');
  for (const btn of navButtons) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Workflow Builder')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'test-workflow-config.png' });
  console.log('✓ Workflow Config (Step 1)');

  // 3. Fill in config
  const inputs = await page.$$('input');
  if (inputs[0]) await inputs[0].type('Employee Onboarding');
  if (inputs[1]) await inputs[1].type('Matrix42 ticket triggers AD user creation, group assignment, and Fudo PAM access');
  // Select trigger
  const triggerSelect = await page.$('select');
  if (triggerSelect) await triggerSelect.select('matrix42-ticket');
  await page.screenshot({ path: 'test-workflow-config-filled.png' });
  console.log('✓ Config filled');

  // 4. Click "Next: Add Steps"
  const nextBtn = await page.$('button.bg-blue-600');
  if (nextBtn) await nextBtn.click();
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'test-workflow-steps-empty.png' });
  console.log('✓ Steps (empty)');

  // 5. Click "Add Step"
  const addBtns = await page.$$('button');
  for (const btn of addBtns) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Add Step')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'test-workflow-add-step.png' });
  console.log('✓ Add Step form');

  // 6. Select Active Directory connector
  const connectorBtns = await page.$$('.grid.grid-cols-3 button');
  if (connectorBtns[0]) await connectorBtns[0].click(); // AD is first
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: 'test-workflow-connector-selected.png' });
  console.log('✓ AD connector selected');

  // 7. Select "Create User" action
  const actionBtns = await page.$$('.grid.grid-cols-2 button');
  if (actionBtns[0]) await actionBtns[0].click(); // Create User is first
  await new Promise(r => setTimeout(r, 300));

  // 8. Fill parameters
  const paramInputs = await page.$$('.grid.grid-cols-2.gap-3 input');
  const paramValues = ['m.mueller', 'Max Mueller', 'Max', 'Mueller', 'Engineering', 'Software Engineer', 'OU=Engineering,OU=Users'];
  for (let i = 0; i < Math.min(paramInputs.length, paramValues.length); i++) {
    await paramInputs[i].type(paramValues[i]);
  }
  await page.screenshot({ path: 'test-workflow-params-filled.png' });
  console.log('✓ Parameters filled');

  // 9. Click "Add Step"
  const addStepBtns = await page.$$('button.bg-blue-600');
  for (const btn of addStepBtns) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Add Step')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'test-workflow-step-added.png' });
  console.log('✓ Step added');

  // 10. Add second step (AD Add to Group)
  const addBtns2 = await page.$$('button');
  for (const btn of addBtns2) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Add Step') && !text.includes('Update')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 300));

  // Select AD again
  const connBtns2 = await page.$$('.grid.grid-cols-3 button');
  if (connBtns2[0]) await connBtns2[0].click();
  await new Promise(r => setTimeout(r, 300));

  // Select "Add to Group" (second action)
  const actBtns2 = await page.$$('.grid.grid-cols-2 button');
  if (actBtns2[1]) await actBtns2[1].click();
  await new Promise(r => setTimeout(r, 300));

  // Fill params
  const params2 = await page.$$('.grid.grid-cols-2.gap-3 select, .grid.grid-cols-2.gap-3 input');
  for (const el of params2) {
    const tag = await el.evaluate(el => el.tagName);
    if (tag === 'SELECT') {
      await el.select('GRP-VPN-Users');
    } else {
      await el.type('m.mueller');
    }
  }

  // Add
  const addBtn3 = await page.$$('button.bg-blue-600');
  for (const btn of addBtn3) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Add Step')) { await btn.click(); break; }
  }
  await new Promise(r => setTimeout(r, 300));

  // 11. Add Fudo PAM step
  const addBtns4 = await page.$$('button');
  for (const btn of addBtns4) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Add Step') && !text.includes('Update')) { await btn.click(); break; }
  }
  await new Promise(r => setTimeout(r, 300));
  const connBtns3 = await page.$$('.grid.grid-cols-3 button');
  if (connBtns3[1]) await connBtns3[1].click(); // Fudo is second
  await new Promise(r => setTimeout(r, 300));
  const actBtns3 = await page.$$('.grid.grid-cols-2 button');
  if (actBtns3[0]) await actBtns3[0].click(); // Create PAM User
  await new Promise(r => setTimeout(r, 300));
  const params3 = await page.$$('.grid.grid-cols-2.gap-3 input, .grid.grid-cols-2.gap-3 select');
  const fudoVals = ['m.mueller', 'Max Mueller', 'm.mueller@corp.local'];
  let idx = 0;
  for (const el of params3) {
    const tag = await el.evaluate(el => el.tagName);
    if (tag === 'INPUT' && idx < fudoVals.length) {
      await el.type(fudoVals[idx++]);
    }
  }
  const addBtn5 = await page.$$('button.bg-blue-600');
  for (const btn of addBtn5) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Add Step')) { await btn.click(); break; }
  }
  await new Promise(r => setTimeout(r, 300));

  // 12. Add Fudo Access Request
  const addBtns5 = await page.$$('button');
  for (const btn of addBtns5) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Add Step') && !text.includes('Update')) { await btn.click(); break; }
  }
  await new Promise(r => setTimeout(r, 300));
  const connBtns4 = await page.$$('.grid.grid-cols-3 button');
  if (connBtns4[1]) await connBtns4[1].click(); // Fudo
  await new Promise(r => setTimeout(r, 300));
  const actBtns4 = await page.$$('.grid.grid-cols-2 button');
  if (actBtns4[1]) await actBtns4[1].click(); // Request Access
  await new Promise(r => setTimeout(r, 300));
  const params4 = await page.$$('.grid.grid-cols-2.gap-3 input');
  const accessVals = ['1', '1', 'New employee needs server access', '24'];
  for (let i = 0; i < Math.min(params4.length, accessVals.length); i++) {
    await params4[i].type(accessVals[i]);
  }
  const addBtn6 = await page.$$('button.bg-blue-600');
  for (const btn of addBtn6) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Add Step')) { await btn.click(); break; }
  }
  await new Promise(r => setTimeout(r, 300));

  // 13. Add Matrix42 ticket
  const addBtns6 = await page.$$('button');
  for (const btn of addBtns6) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Add Step') && !text.includes('Update')) { await btn.click(); break; }
  }
  await new Promise(r => setTimeout(r, 300));
  const connBtns5 = await page.$$('.grid.grid-cols-3 button');
  if (connBtns5[2]) await connBtns5[2].click(); // Matrix42
  await new Promise(r => setTimeout(r, 300));
  const actBtns5 = await page.$$('.grid.grid-cols-2 button');
  if (actBtns5[0]) await actBtns5[0].click(); // Create Ticket
  await new Promise(r => setTimeout(r, 300));
  const params5 = await page.$$('.grid.grid-cols-2.gap-3 input');
  const m42Vals = ['Onboarding: Max Mueller', 'Automated onboarding completed'];
  for (let i = 0; i < Math.min(params5.length, m42Vals.length); i++) {
    await params5[i].type(m42Vals[i]);
  }
  const addBtn7 = await page.$$('button.bg-blue-600');
  for (const btn of addBtn7) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Add Step')) { await btn.click(); break; }
  }
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'test-workflow-all-steps.png' });
  console.log('✓ All 5 steps added');

  // 14. Click "Review & Export"
  const reviewBtns = await page.$$('button.bg-blue-600');
  for (const btn of reviewBtns) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Review')) { await btn.click(); break; }
  }
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'test-workflow-review.png' });
  console.log('✓ Review page');

  // 15. Click "Test against Mock APIs"
  const testBtn = await page.$$('button.bg-green-600');
  if (testBtn[0]) await testBtn[0].click();
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'test-workflow-editor.png' });
  console.log('✓ Editor with generated script');

  // 16. Click Run
  const runBtns = await page.$$('button.bg-green-600');
  for (const btn of runBtns) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Run')) { await btn.click(); break; }
  }
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'test-workflow-results.png' });
  console.log('✓ Results');

  // 17. Navigate to Results page
  const navButtons2 = await page.$$('nav button');
  for (const btn of navButtons2) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Results')) { await btn.click(); break; }
  }
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'test-workflow-results-panel.png' });
  console.log('✓ Results panel');

  await browser.close();
  console.log('\n✅ All screenshots taken!');
})();

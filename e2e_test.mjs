import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

// Test 1: Landing page
console.log('=== TEST 1: Landing Page ===');
await page.goto('http://127.0.0.1:5173');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'screenshots/01-landing.png', fullPage: true });
console.log('Screenshot: screenshots/01-landing.png');

// Check landing elements
const title = await page.textContent('h1');
console.log('Title:', title);
const startBtn = page.getByText('Начать подбор');
console.log('Start button found:', await startBtn.isVisible());

// Test 2: Start quiz
console.log('\n=== TEST 2: Quiz - Budget ===');
await startBtn.click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/02-quiz-budget.png', fullPage: true });
const questionTitle = await page.textContent('h2');
console.log('Question:', questionTitle);

// Test 3: Move to next question (budget has defaults, should be valid)
console.log('\n=== TEST 3: Quiz - Purposes ===');
await page.getByText('Далее').click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/03-quiz-purposes.png', fullPage: true });
const q2Title = await page.textContent('h2');
console.log('Question:', q2Title);

// Select "city" and "family"
await page.getByText('Город каждый день').click();
await page.getByText('Семья с детьми').click();
await page.waitForTimeout(300);

// Test 4: Passengers
console.log('\n=== TEST 4: Quiz - Passengers ===');
await page.getByText('Далее').click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/04-quiz-passengers.png', fullPage: true });
const q3Title = await page.textContent('h2');
console.log('Question:', q3Title);
await page.getByText('3-4 человека').click();

// Test 5: Priorities
console.log('\n=== TEST 5: Quiz - Priorities ===');
await page.getByText('Далее').click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/05-quiz-priorities.png', fullPage: true });
const q4Title = await page.textContent('h2');
console.log('Question:', q4Title);
// Select 3 priorities
await page.getByText('Надёжность').click();
await page.getByText('Комфорт').click();
await page.getByText('Безопасность').click();

// Test 6: Experience
console.log('\n=== TEST 6: Quiz - Experience ===');
await page.getByText('Далее').click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/06-quiz-experience.png', fullPage: true });
const q5Title = await page.textContent('h2');
console.log('Question:', q5Title);
await page.getByText('2-5 лет').click();

// Test 7: City size
console.log('\n=== TEST 7: Quiz - City ===');
await page.getByText('Далее').click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/07-quiz-city.png', fullPage: true });
const q6Title = await page.textContent('h2');
console.log('Question:', q6Title);
await page.getByText('Город-миллионник').click();

// Test 8: Chinese brands
console.log('\n=== TEST 8: Quiz - Chinese ===');
await page.getByText('Далее').click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/08-quiz-chinese.png', fullPage: true });
const q7Title = await page.textContent('h2');
console.log('Question:', q7Title);
await page.getByText('Да, без ограничений').click();

// Test 9: Submit and wait for results
console.log('\n=== TEST 9: Loading + Results ===');
await page.getByText('Получить рекомендации').click();
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/09-loading.png', fullPage: true });
console.log('Loading screen captured');

// Wait for results (up to 60 seconds)
console.log('Waiting for results from API...');
try {
  await page.waitForSelector('text=Ваши рекомендации', { timeout: 90000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/10-results.png', fullPage: true });
  console.log('Results page captured!');

  // Count recommendation cards
  const cards = await page.locator('.bg-white.rounded-2xl.shadow-sm').count();
  console.log('Recommendation cards:', cards);

  // Get general advice
  const advice = await page.locator('.bg-blue-50').textContent();
  console.log('General advice:', advice?.substring(0, 100) + '...');

} catch (e) {
  console.log('Timeout or error waiting for results:', e.message);
  await page.screenshot({ path: 'screenshots/10-error.png', fullPage: true });
}

// Check console errors
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

console.log('\n=== SUMMARY ===');
console.log('Console errors:', consoleErrors.length);
console.log('E2E test complete!');

await browser.close();

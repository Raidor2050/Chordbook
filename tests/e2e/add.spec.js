import { test, expect } from '@playwright/test';

const pageErrors = [];
const consoleErrors = [];

test.beforeEach(async ({ page }) => {
  pageErrors.length = 0;
  consoleErrors.length = 0;
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
});

test.afterEach(async () => {
  expect(pageErrors, 'no uncaught page errors').toEqual([]);
  expect(consoleErrors, 'no console.error calls').toEqual([]);
});

async function addSongManually(page, title, artist) {
  await page.goto('/#/add');
  await page.getByRole('button', { name: 'Enter details manually' }).click();
  await page.locator('#sf-title').fill(title);
  await page.locator('#sf-artist').fill(artist);
  await page.getByRole('button', { name: '+ Add section' }).click();
  await page.getByPlaceholder('C G Am F  (use | for a new chord line)').fill('C G Am F');
  await page.getByRole('button', { name: 'Add to Chordbook' }).click();
  await expect(page.getByRole('dialog', { name: 'Saving song' })).toBeVisible();
  await page.waitForURL(/\/song\//, { timeout: 15_000 });
}

test('a song added manually appears in the songbook and persists across reloads', async ({ page }) => {
  const title = 'Test Lullaby';
  const artist = 'Chordbook Tester';

  await addSongManually(page, title, artist);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
  await expect(page.getByText(/24 of 24 songs/)).toBeVisible();

  await page.reload();
  await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
});

test('duplicate songs are rejected with a clear message', async ({ page }) => {
  await addSongManually(page, 'Duplicate Demo', 'Chordbook Tester');
  await expect(page.getByRole('heading', { name: 'Duplicate Demo' })).toBeVisible();

  // Clear the client submission-throttle stamps so the duplicate check is the
  // path under test (the two adds happen within the 15 s throttle window).
  await page.evaluate(() => localStorage.clear());

  await page.goto('/#/add');
  await page.getByRole('button', { name: 'Enter details manually' }).click();
  await page.locator('#sf-title').fill('Duplicate Demo');
  await page.locator('#sf-artist').fill('Chordbook Tester');
  await page.getByRole('button', { name: '+ Add section' }).click();
  await page.getByPlaceholder('C G Am F  (use | for a new chord line)').fill('C G Am F');
  await page.getByRole('button', { name: 'Add to Chordbook' }).click();

  await expect(page.getByText(/already in Chordbook/i)).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/#\/add/);
  await expect(page.getByRole('heading', { name: /Add a song/i })).toBeVisible();
});
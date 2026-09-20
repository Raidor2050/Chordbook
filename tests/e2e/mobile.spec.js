import { test, expect } from '@playwright/test';

test('mobile viewport renders the songbook without horizontal overflow', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /songbook for guitar/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /The Scientist/ })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});

test('mobile add-song flow works end to end', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));

  await page.goto('/#/add');
  await page.getByRole('button', { name: 'Enter details manually' }).click();
  await page.locator('#sf-title').fill('Mobile Blues');
  await page.locator('#sf-artist').fill('Chordbook Tester');
  await page.getByRole('button', { name: '+ Add section' }).click();
  await page.getByPlaceholder('C G Am F  (use | for a new chord line)').fill('C G Am F');
  await page.getByRole('button', { name: 'Add to Chordbook' }).click();
  await page.waitForURL(/\/song\/mobile-blues/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Mobile Blues' })).toBeVisible();
  expect(errors).toEqual([]);
});
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

test('home renders the seeded songbook', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /songbook for guitar/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Yellow/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /The Scientist/ })).toBeVisible();
  await expect(page.getByText(/23 of 23 songs/)).toBeVisible();
});

test('search narrows results and chord search works', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Search the songbook');

  await input.fill('coldplay');
  await expect(page.getByText(/3 of 23 songs/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Yellow/ })).toBeVisible();

  await input.fill('Gmaj7');
  await expect(page.getByText(/1 of 23 songs/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Iris/ })).toBeVisible();
});

test('key filter narrows the songbook', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Filter by key').selectOption('B');
  await expect(page.getByText(/2 of 23 songs/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Yellow/ })).toBeVisible();
});
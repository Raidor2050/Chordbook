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

test('a seed song page renders chords, sheets and improvise maps', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /The Scientist/ }).click();

  await expect(page.getByRole('heading', { name: 'The Scientist' })).toBeVisible();
  await expect(page.getByLabel('Chord list')).toBeVisible();
  await expect(page.getByLabel('Chord list').getByText('C/G')).toBeVisible();
  await expect(page.getByText(/Best-known chords — check by ear/)).toBeVisible();

  const diagrams = page.locator('.dg');
  await expect(diagrams.first()).toBeVisible();
  expect(await diagrams.count()).toBeGreaterThanOrEqual(7);

  await expect(page.getByRole('region', { name: 'Improvisation maps' })).toBeVisible();
  const mapSvgs = page.locator('.improvise svg');
  expect(await mapSvgs.count()).toBeGreaterThanOrEqual(1);
});

test('breadcrumb navigates back to the songbook', async ({ page }) => {
  await page.goto('/#/song/yellow-coldplay');
  await expect(page.getByRole('heading', { name: 'Yellow' })).toBeVisible();
  await page.getByRole('link', { name: 'Songbook' }).click();
  await expect(page.getByPlaceholder(/oasis wonder/)).toBeVisible();
});
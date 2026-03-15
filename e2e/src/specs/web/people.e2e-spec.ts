import { LoginResponseDto, PersonResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('People page', () => {
  let admin: LoginResponseDto;
  let visiblePerson: PersonResponseDto;
  let hiddenPerson: PersonResponseDto;
  let personToHide: PersonResponseDto;
  let personToUnhide: PersonResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();

    const asset = await utils.createAsset(admin.accessToken);

    [visiblePerson, hiddenPerson, personToHide, personToUnhide] = await Promise.all([
      utils.createPerson(admin.accessToken, { name: 'Visible Person' }),
      utils.createPerson(admin.accessToken, { name: 'Hidden Person', isHidden: true }),
      utils.createPerson(admin.accessToken, { name: 'Person To Hide' }),
      utils.createPerson(admin.accessToken, { name: 'Person To Unhide', isHidden: true }),
    ]);

    await Promise.all([
      utils.createFace({ assetId: asset.id, personId: visiblePerson.id }),
      utils.createFace({ assetId: asset.id, personId: hiddenPerson.id }),
      utils.createFace({ assetId: asset.id, personId: personToHide.id }),
      utils.createFace({ assetId: asset.id, personId: personToUnhide.id }),
    ]);
  });

  test.beforeEach(async ({ page }) => {
    await page.route('**/*thumbnail*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/jpeg',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          'base64',
        ),
      });
    });
  });

  test('shows visible people and hides hidden people by default', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/people');

    await expect(page.getByTitle('Visible Person')).toBeVisible();
    await expect(page.getByTitle('Hidden Person')).not.toBeVisible();
  });

  test('shows hidden people when "Include hidden" is toggled', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/people');

    await page.getByRole('button', { name: 'Include hidden' }).click();

    await expect(page.getByTitle('Visible Person')).toBeVisible();
    await expect(page.getByTitle('Hidden Person')).toBeVisible();
  });

  test('hides hidden people again when "Exclude hidden" is toggled off', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/people');

    await page.getByRole('button', { name: 'Include hidden' }).click();
    await expect(page.getByTitle('Hidden Person')).toBeVisible();

    await page.getByRole('button', { name: 'Exclude hidden' }).click();
    await expect(page.getByTitle('Hidden Person')).not.toBeVisible();
  });

  test('context menu shows "Hide person" for a visible person', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/people');

    const card = page.locator('#people-card').filter({ has: page.getByTitle('Visible Person') });
    await card.hover();
    await card.getByRole('button', { name: 'Show person options' }).click();

    await expect(page.getByRole('menuitem', { name: 'Hide person' })).toBeVisible();
  });

  test('context menu shows "Unhide person" for a hidden person when include-hidden is on', async ({
    context,
    page,
  }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/people');

    await page.getByRole('button', { name: 'Include hidden' }).click();

    const card = page.locator('#people-card').filter({ has: page.getByTitle('Hidden Person') });
    await card.hover();
    await card.getByRole('button', { name: 'Show person options' }).click();

    await expect(page.getByRole('menuitem', { name: 'Unhide person' })).toBeVisible();
  });

  test('hides a person via context menu and removes them from the list', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/people');

    const card = page.locator('#people-card').filter({ has: page.getByTitle('Person To Hide') });
    await card.hover();
    await card.getByRole('button', { name: 'Show person options' }).click();
    await page.getByRole('menuitem', { name: 'Hide person' }).click();

    await expect(page.getByTitle('Person To Hide')).not.toBeVisible();
  });

  test('unhides a person via context menu and shows them in normal view', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/people');

    await page.getByRole('button', { name: 'Include hidden' }).click();

    const card = page.locator('#people-card').filter({ has: page.getByTitle('Person To Unhide') });
    await card.hover();
    await card.getByRole('button', { name: 'Show person options' }).click();
    await page.getByRole('menuitem', { name: 'Unhide person' }).click();

    await page.getByRole('button', { name: 'Exclude hidden' }).click();
    await expect(page.getByTitle('Person To Unhide')).toBeVisible();
  });
});

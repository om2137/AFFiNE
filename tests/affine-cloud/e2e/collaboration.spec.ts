import { test } from '@affine-test/kit/playwright';
import {
  addUserToWorkspace,
  createRandomUser,
  enableCloudWorkspace,
  loginUser,
} from '@affine-test/kit/utils/cloud';
import {
  clickNewPageButton,
  getBlockSuiteEditorTitle,
  waitForEditorLoad,
} from '@affine-test/kit/utils/page-logic';
import { clickUserInfoCard } from '@affine-test/kit/utils/setting';
import {
  clickSideBarAllPageButton,
  clickSideBarSettingButton,
} from '@affine-test/kit/utils/sidebar';
import { createLocalWorkspace } from '@affine-test/kit/utils/workspace';
import { expect } from '@playwright/test';

let user: {
  id: string;
  name: string;
  email: string;
  password: string;
};

test.beforeEach(async () => {
  user = await createRandomUser();
});

test.beforeEach(async ({ page }) => {
  await loginUser(page, user.email);
});

test.describe('collaboration', () => {
  test('can enable share page', async ({ page, browser }) => {
    await page.reload();
    await waitForEditorLoad(page);
    await createLocalWorkspace(
      {
        name: 'test',
      },
      page
    );
    await enableCloudWorkspace(page);
    const title = getBlockSuiteEditorTitle(page);
    await title.type('TEST TITLE', {
      delay: 50,
    });
    await page.keyboard.press('Enter', { delay: 50 });
    await page.keyboard.type('TEST CONTENT', { delay: 50 });
    await page.getByTestId('share-menu-button').click();
    await page.getByTestId('share-menu-create-link-button').click();
    await page.getByTestId('share-menu-copy-link-button').click();

    // check share page is accessible
    {
      const context = await browser.newContext();
      const url: string = await page.evaluate(() =>
        navigator.clipboard.readText()
      );
      const page2 = await context.newPage();
      await page2.goto(url);
      await waitForEditorLoad(page2);
      const title = getBlockSuiteEditorTitle(page2);
      expect(await title.innerText()).toBe('TEST TITLE');
      expect(await page2.textContent('affine-paragraph')).toContain(
        'TEST CONTENT'
      );
    }
  });

  test('can collaborate with other user and name should display when editing', async ({
    page,
    browser,
  }) => {
    await page.reload();
    await waitForEditorLoad(page);
    await createLocalWorkspace(
      {
        name: 'test',
      },
      page
    );
    await enableCloudWorkspace(page);
    await clickNewPageButton(page);
    const currentUrl = page.url();
    // format: http://localhost:8080/workspace/${workspaceId}/xxx
    const workspaceId = currentUrl.split('/')[4];
    const userB = await createRandomUser();
    const context = await browser.newContext();
    const page2 = await context.newPage();
    await loginUser(page2, userB.email);
    await addUserToWorkspace(workspaceId, userB.id, 1 /* READ */);
    await page2.reload();
    await waitForEditorLoad(page2);
    await page2.goto(currentUrl);
    {
      const title = getBlockSuiteEditorTitle(page);
      await title.type('TEST TITLE', {
        delay: 50,
      });
    }
    await page2.waitForTimeout(200);
    {
      const title = getBlockSuiteEditorTitle(page2);
      expect(await title.innerText()).toBe('TEST TITLE');
      const typingPromise = Promise.all([
        page.keyboard.press('Enter', { delay: 50 }),
        page.keyboard.type('TEST CONTENT', { delay: 50 }),
      ]);
      // username should be visible when editing
      await expect(page2.getByText(user.name)).toBeVisible();
      await typingPromise;
    }

    // change username
    await clickSideBarSettingButton(page);
    await clickUserInfoCard(page);
    const input = page.getByTestId('user-name-input');
    await input.clear();
    await input.type('TEST USER', {
      delay: 50,
    });
    await page.getByTestId('save-user-name').click({
      delay: 50,
    });
    await page.keyboard.press('Escape', {
      delay: 50,
    });
    const title = getBlockSuiteEditorTitle(page);
    await title.focus();

    {
      await expect(page2.getByText('TEST USER')).toBeVisible({
        timeout: 2000,
      });
    }
  });

  test('can sync collections between different browser', async ({
    page,
    browser,
  }) => {
    await page.reload();
    await waitForEditorLoad(page);
    await createLocalWorkspace(
      {
        name: 'test',
      },
      page
    );
    await enableCloudWorkspace(page);
    await page.getByTestId('slider-bar-add-collection-button').click();
    const title = page.getByTestId('input-collection-title');
    await title.isVisible();
    await title.fill('test collection');
    await page.getByTestId('save-collection').click();

    {
      const context = await browser.newContext();
      const page2 = await context.newPage();
      await loginUser(page2, user.email);
      await page2.goto(page.url());
      waitForEditorLoad(page2);
      const collections = page2.getByTestId('collections');
      await expect(collections.getByText('test collection')).toBeVisible();
    }
  });

  test('exit successfully and re-login', async ({ page }) => {
    await page.reload();
    await clickSideBarAllPageButton(page);
    await page.waitForTimeout(200);
    const url = page.url();
    await createLocalWorkspace(
      {
        name: 'test',
      },
      page
    );
    await enableCloudWorkspace(page);
    await clickSideBarSettingButton(page);
    await clickUserInfoCard(page);
    await page.getByTestId('sign-out-button').click();
    await page.waitForTimeout(5000);
    expect(page.url()).toBe(url);
  });
});

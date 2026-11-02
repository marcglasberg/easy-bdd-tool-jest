import { afterAll, afterEach, beforeAll, expect } from '@jest/globals';
import { chromium, type Browser, type Page } from 'playwright';
import { Bdd, Feature, val } from 'easy-bdd-tool-jest';

// End-to-end BDDs: they run the real app in a browser, with Playwright.
// The code of each step uses Playwright to type, click and check what's on the page.

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser.close();
});

afterEach(async () => {
  await page?.context().close();
});

const feature = new Feature('Todo List');

// Each scenario starts with a new page, with its own storage, so it has no todos.
feature.background
  .given('The app starts with no todos.')
  .code(async () => {
    page = await browser.newPage();
    await page.goto(process.env.APP_URL!);
    await page.getByText('No todos').waitFor();
  });

async function addTodo(text: string) {
  await page.getByRole('textbox').fill(text);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
}

Bdd(feature)
  .scenario('Adding a todo.')
  .when('The user types "buy milk" and clicks Add.')
  .code(async () => {
    await addTodo('buy milk');
  })
  .then('The todo "Buy milk" is shown, capitalized and not completed.')
  .code(async () => {
    const todo = page.getByRole('checkbox', { name: 'Buy milk' });
    await todo.waitFor();
    expect(await todo.isChecked()).toBe(false);
  })
  .and('The text field is empty again.')
  .code(async () => {
    expect(await page.getByRole('textbox').inputValue()).toBe('');
  })
  .run();

Bdd(feature)
  .scenario('Adding a todo with the Enter key.')
  .when('The user types "Walk the dog" and presses Enter.')
  .code(async () => {
    await page.getByRole('textbox').fill('Walk the dog');
    await page.getByRole('textbox').press('Enter');
  })
  .then('The todo "Walk the dog" is shown.')
  .code(async () => {
    await page.getByRole('checkbox', { name: 'Walk the dog' }).waitFor();
  })
  .run();

Bdd(feature)
  .scenario('Removing a completed todo.')
  .given('There are the todos "Buy milk" and "Walk the dog".')
  .code(async () => {
    await addTodo('Buy milk');
    await addTodo('Walk the dog');
  })
  .when('The user completes "Buy milk".')
  .code(async () => {
    await page.getByRole('checkbox', { name: 'Buy milk' }).check();
  })
  .and('Clicks "Remove Completed Todos".')
  .code(async () => {
    await page.getByRole('button', { name: 'Remove Completed Todos' }).click();
  })
  .then('Only "Walk the dog" is left.')
  .code(async () => {
    await page.getByRole('checkbox', { name: 'Buy milk' }).waitFor({ state: 'detached' });
    expect(await page.getByRole('checkbox').count()).toBe(1);
    await page.getByRole('checkbox', { name: 'Walk the dog' }).waitFor();
  })
  .run();

Bdd(feature)
  .scenario('Adding a todo that already exists.')
  .given('There is a todo "Buy milk".')
  .code(async () => {
    await addTodo('Buy milk');
  })
  .when('The user adds "Buy milk" again.')
  .code(async () => {
    await addTodo('Buy milk');
  })
  .then('A dialog says it already exists.')
  .code(async () => {
    await page.getByRole('dialog').getByText('The item "Buy milk" already exists.').waitFor();
  })
  .and('After closing the dialog, the text field asks for something else.')
  .code(async () => {
    await page.getByRole('dialog').getByRole('button').click();
    await page.getByText('Type something else').waitFor();
  })
  .run();

Bdd(feature)
  .scenario('The todos are kept when the page is reloaded.')
  .given('There is a todo "Buy milk".')
  .code(async () => {
    await addTodo('Buy milk');
  })
  .and('The app saved it.')
  .code(async () => {
    // The app saves the todos in the local storage, at most once every 2 seconds.
    await page.waitForFunction(() => window.localStorage.getItem('state')?.includes('Buy milk'));
  })
  .when('The user reloads the page.')
  .code(async () => {
    await page.reload();
  })
  .then('The todo "Buy milk" is still there.')
  .code(async () => {
    await page.getByRole('checkbox', { name: 'Buy milk' }).waitFor();
  })
  .run();

Bdd(feature)
  .scenario('The filter button changes the filter.')
  .when('The user clicks the filter button <Clicks> times.')
  .code(async ctx => {
    const clicks: number = ctx.example.val('Clicks');
    for (let i = 0; i < clicks; i++) await page.getByRole('button', { name: /^Showing / }).click();
  })
  .then('The filter is <Filter>.')
  .code(async ctx => {
    await page.getByRole('button', { name: ctx.example.val('Filter') }).waitFor();
  })
  .example(val('Clicks', 1), val('Filter', 'Showing ACTIVE'))
  .example(val('Clicks', 2), val('Filter', 'Showing COMPLETED'))
  .example(val('Clicks', 3), val('Filter', 'Showing ALL'))
  .run();

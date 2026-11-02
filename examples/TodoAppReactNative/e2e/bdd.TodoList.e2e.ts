import { by, device, element, expect, waitFor } from 'detox';
import { Bdd, Feature, val } from 'easy-bdd-tool-jest';

// End-to-end BDDs: they run the real app on an Android emulator or device, with Detox.
// The code of each step uses Detox to tap, type and check what's on the screen.

const feature = new Feature('Todo List');

// Each scenario starts with a fresh install of the app, so it has no todos.
feature.background
  .given('The app starts with no todos.')
  .code(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

async function addTodo(text: string) {
  await element(by.id('todo-input')).typeText(text);
  await element(by.text('Add')).tap();
  // Close the keyboard, so that it doesn't cover the buttons at the bottom of the screen.
  await device.pressBack();
}

Bdd(feature)
  .scenario('Adding a todo.')
  .when('The user types "Buy milk" and taps Add.')
  .code(async () => {
    await addTodo('Buy milk');
  })
  .then('The todo "Buy milk" is shown.')
  .code(async () => {
    await expect(element(by.text('Buy milk'))).toBeVisible();
  })
  .and('The text field is empty again.')
  .code(async () => {
    await expect(element(by.id('todo-input'))).toHaveText('');
  })
  .run();

Bdd(feature)
  .scenario('Removing a completed todo.')
  .given('There is a todo "Buy milk".')
  .code(async () => {
    await addTodo('Buy milk');
  })
  .when('The user completes it.')
  .code(async () => {
    await element(by.text('Buy milk')).tap();
  })
  .and('Taps "Remove Completed Todos".')
  .code(async () => {
    await element(by.text('Remove Completed Todos')).tap();
  })
  .then('There are no todos.')
  .code(async () => {
    // The app removes the completed todos with a small animation.
    await waitFor(element(by.text('No todos')))
      .toBeVisible()
      .withTimeout(5000);
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
  .then('An error dialog says it already exists.')
  .code(async () => {
    await expect(element(by.text('The item "Buy milk" already exists.'))).toBeVisible();
    await element(by.text('OK')).tap();
  })
  .run();

Bdd(feature)
  .scenario('The filter button changes the filter.')
  .when('The user taps the filter button <Taps> times.')
  .code(async ctx => {
    const taps: number = ctx.example.val('Taps');
    for (let i = 0; i < taps; i++) await element(by.id('filter-button')).tap();
  })
  .then('The filter is <Filter>.')
  .code(async ctx => {
    await expect(element(by.text(ctx.example.val('Filter')))).toBeVisible();
  })
  .example(val('Taps', 1), val('Filter', 'Showing ACTIVE'))
  .example(val('Taps', 2), val('Filter', 'Showing COMPLETED'))
  .example(val('Taps', 3), val('Filter', 'Showing ALL'))
  .run();

Feature: Todo List

  Background:
    Given The app starts with no todos.

  Scenario: Adding a todo.
    When The user types "buy milk" and clicks Add.
    Then The todo "Buy milk" is shown, capitalized and not completed.
    And The text field is empty again.

  Scenario: Adding a todo with the Enter key.
    When The user types "Walk the dog" and presses Enter.
    Then The todo "Walk the dog" is shown.

  Scenario: Removing a completed todo.
    Given There are the todos "Buy milk" and "Walk the dog".
    When The user completes "Buy milk".
    And Clicks "Remove Completed Todos".
    Then Only "Walk the dog" is left.

  Scenario: Adding a todo that already exists.
    Given There is a todo "Buy milk".
    When The user adds "Buy milk" again.
    Then A dialog says it already exists.
    And After closing the dialog, the text field asks for something else.

  Scenario: The todos are kept when the page is reloaded.
    Given There is a todo "Buy milk".
    And The app saved it.
    When The user reloads the page.
    Then The todo "Buy milk" is still there.

  Scenario Outline: The filter button changes the filter.
    When The user clicks the filter button <Clicks> times.
    Then The filter is <Filter>.
    Examples: 
      | Clicks | Filter            |
      | 1      | Showing ACTIVE    |
      | 2      | Showing COMPLETED |
      | 3      | Showing ALL       |

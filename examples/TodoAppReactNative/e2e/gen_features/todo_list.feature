Feature: Todo List

  Background:
    Given The app starts with no todos.

  Scenario: Adding a todo.
    When The user types "Buy milk" and taps Add.
    Then The todo "Buy milk" is shown.
    And The text field is empty again.

  Scenario: Removing a completed todo.
    Given There is a todo "Buy milk".
    When The user completes it.
    And Taps "Remove Completed Todos".
    Then There are no todos.

  Scenario: Adding a todo that already exists.
    Given There is a todo "Buy milk".
    When The user adds "Buy milk" again.
    Then An error dialog says it already exists.

  Scenario Outline: The filter button changes the filter.
    When The user taps the filter button <Taps> times.
    Then The filter is <Filter>.
    Examples: 
      | Taps | Filter            |
      | 1    | Showing ACTIVE    |
      | 2    | Showing COMPLETED |
      | 3    | Showing ALL       |

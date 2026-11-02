## [1.2.0] - 2026/11/02

* New Jest reporter, `easy-bdd-tool-jest/jest-reporter`, for the BDDs of all the test files of a
  Jest run. Add it to the `reporters` of your Jest configuration. It prints a summary of the whole
  run, and may write the feature files (with the BDDs of all test files that use each feature) and
  the Cucumber results. Nothing needs to be added to the test files. See the README.

* With the Jest reporter's `cucumberResults` option, the results of your BDDs (which scenarios and
  steps passed, failed or were skipped, how long they took, and the errors) are written in
  Cucumber's standard results format,
  [Cucumber Messages](https://github.com/cucumber/messages). Use it to create an HTML report with
  [Cucumber's HTML formatter](https://github.com/cucumber/html-formatter), or to send the results
  to other tools that understand Cucumber. The results are not written, and the run fails with an
  error, when they can't be reported faithfully: no BDD is silently left out. Old reports are
  deleted when the run starts, reports are written atomically, links in the path are rejected, and
  report sizes are limited. Needs Node.js 20.19 or 22.12 or later. `@cucumber/gherkin` and
  `@cucumber/messages`, from Cucumber, are now dependencies.

* `Bdd(feature).only` runs only that BDD while you work on it, like `test.only` in Jest. The other
  BDDs in the same test file are skipped, unless they are also marked with `.only`. It's marked as
  deprecated only so that your IDE shows it with a strikethrough, as a reminder to remove it before
  committing.

* `feature.background` lets you write steps that are common to all the scenarios of a feature.
  They are written once, in a `Background:` section of the feature, and their code (added with
  `.code()`) runs before the code of each scenario, and before each example row.

* `Feature.userStory(title, { asA, iWant, soThat })` creates a feature with a User Story
  description (`As a ... I want ... So that ...`).

* A scenario may start directly with `.when()` or `.then()`. Also, `.run()` may now be called
  after `.given()`, after the `.code()` of a Given or a When, and `.then()` may follow the
  `.code()` of a Given.

* Exported feature files are now always valid Gherkin:
    * A `|` in a table or `Examples` cell is written as `\|`, and a line break as `\n`. A
      backslash is escaped only where Gherkin would misread it, so values like `C:\tmp` or `\d+`
      are written unchanged.
    * A line break in a step, scenario name, feature title or user story is written as a space,
      instead of starting a new scenario or step.
    * Each line of a multi-line `.note()` becomes its own `#` comment.
  The console output uses the same formatting.

* Feature file names keep letters with accents and other alphabets, and hyphens. For example,
  `Preço médio` was written to `preo_mdio.feature`, and now to `preço_médio.feature`.

* Each test now prints `✔ TEST 1 PASSED!` or `⚠ TEST 1 FAILED!` when it finishes. After all tests of
  the test file run, if you set reporters, a `RESULTS` summary is printed (passed, failed and
  skipped tests), followed by `Running the <reporter>...` before each reporter. The summary counts
  the last attempt of retried tests, counts tests that timed out as failed, and counts tests that
  didn't run because of `.skip` or `.only` as skipped.

* The stack trace of a failing BDD no longer shows the code of this package, only your code.

* Each run of a BDD is now recorded, with the result, duration and error of each code block.
  Reporters can read it from `TestResult.executions` (or `bdd.executions`). See `BddExecution`.

* The callback given to `.run()` is now kept in `bdd.codeRuns`, separate from the code of the steps
  (`bdd.codeTerms`). It runs after the code of the steps, as before.

* `FeatureFileReporter({ clearAllOutputBeforeRun: true })` deletes the previously generated feature
  files. Only the `.feature` files directly inside `FeatureFileReporter.dir` are deleted, and only
  the ones written before the current Jest run started, so that a test file doesn't delete the
  feature files just written by another one.

* `FeatureFileReporter`: An empty `FeatureFileReporter.dir` now means the current directory,
  instead of the filesystem root. When a feature file can't be written, it says which feature
  failed and why.

* `ConsoleReporter` right-aligns the keywords, prints a separator before each feature, and prints
  the Background.

* New: `gherkinSource(feature)` returns the Gherkin text of a feature, as written to its feature
  file. `Term.isNote` tells if a term was added with `.note()`. `ctx.tables` has all the tables.
  `Keywords.only({...})` creates keywords where the ones you don't provide are empty.
  `Context`, `TableRows`, `TableValues` and `MultipleTableValues` have an `equals()` method, and
  `Feature.equals()` compares titles.

* The BDDs are declared in the test framework through `BddRunner.framework` (a `TestFramework`),
  which is Jest by default. This prepares support for other test frameworks.

* Fixes:
    * After `.then().code()`, the `.and()`, `.but()` and `.note()` steps were `When` steps, so
      `.example()` could not follow them. They are now `Then` steps.
    * `testRun()` never ran the code of the BDD.
    * The same BDD was added twice to a feature when more than one reporter was set, which
      duplicated the scenarios in the feature files.
    * Calling `reporter()` more than once ran the reporters more than once.
    * `Config.transformDescribe` couldn't be set in TypeScript (its type was `null`), and a falsy
      result like `0` or `''` was ignored. Now only `null` and `undefined` keep the original value.
    * An `undefined` value in a table or example threw an error. It's now written as `undefined`.
    * `ctx.table(...).rowWhere(name, value)` now accepts any value, like strings and numbers.
    * `FeatureFileReporter` printed a stray `'` after the file name.
    * The `Examples:` keyword was not right-aligned when `rightAlignKeywords` is `true`.

## [1.1.0] - 2026/10/07

* Supports Jest 30. `jest` is now a peer dependency (`^29.0.0 || ^30.0.0`), so your project's own
  Jest is used, instead of a second copy being installed.

## [1.0.4] - 2024/03/21

* Using `process.stdout.write` instead of `console.log`

## [1.0.3] - 2024/02/26

* Small fix regarding null values in examples.

## [1.0.2] - 2023/12/12

* Initial version.




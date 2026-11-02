/**
 * Jest configuration for the end-to-end tests, which run with Detox.
 * Run them with `npm run e2e:test`, and not with `jest` directly.
 */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.e2e.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  reporters: [
    'detox/runners/jest/reporter',
    [
      'easy-bdd-tool-jest/jest-reporter',
      {
        featureFiles: { dir: './e2e/gen_features/' },
        cucumberResults: { outputFile: './e2e/gen_cucumber_results/results.ndjson' },
      },
    ],
  ],
  // The tests run in Node.js, so only the test files themselves need Babel.
  transformIgnorePatterns: ['/node_modules/', '/easy-bdd-tool-jest/lib/'],
};

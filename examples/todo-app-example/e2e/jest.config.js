// Jest configuration for the end-to-end tests, which test the app in a real browser, with Playwright.
// Run them with `npm run e2e`. The app is served by Vite while the tests run.
export default {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/e2e/**/*.e2e.ts'],
  testTimeout: 30000,
  globalSetup: '<rootDir>/e2e/startApp.mjs',
  globalTeardown: '<rootDir>/e2e/stopApp.mjs',
  reporters: [
    'default',
    [
      'easy-bdd-tool-jest/jest-reporter',
      {
        featureFiles: { dir: './e2e/gen_features/' },
        cucumberResults: { outputFile: './e2e/gen_cucumber_results/results.ndjson' },
      },
    ],
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'es2023',
        module: 'esnext',
        moduleResolution: 'bundler',
        types: ['node'],
        strict: true,
        skipLibCheck: true,
      },
    }],
  },
};

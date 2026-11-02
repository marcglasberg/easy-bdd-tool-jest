module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test/'],
  transform: {
    // TypeScript, and the ESM-only @cucumber packages used by the Gherkin conformance tests.
    '^.+\\.[tj]s$': 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!@cucumber/)'],
};

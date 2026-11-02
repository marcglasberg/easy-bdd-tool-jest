/**
 * Detox configuration, for the end-to-end tests in the `e2e` directory.
 * See https://wix.github.io/Detox/docs/config/overview
 *
 * Start an Android emulator (or connect a device), and then run:
 *   npm run e2e:build
 *   npm run e2e:test
 */

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    // The release build has the JavaScript bundled inside, so it doesn't need Metro.
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: `cd android && ${gradlew} assembleRelease assembleAndroidTest -DtestBuildType=release`,
    },
    // The debug build needs Metro running (npm start).
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: `cd android && ${gradlew} assembleDebug assembleAndroidTest -DtestBuildType=debug`,
      reversePorts: [8081],
    },
  },
  devices: {
    // The emulator or device that is running. Start it before running the tests.
    attached: {
      type: 'android.attached',
      device: { adbName: '.*' },
    },
  },
  configurations: {
    'android.release': { device: 'attached', app: 'android.release' },
    'android.debug': { device: 'attached', app: 'android.debug' },
  },
};

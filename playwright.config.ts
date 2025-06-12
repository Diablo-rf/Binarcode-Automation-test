import { defineConfig } from '@playwright/test';
import type { TestOptions } from './test-options';
import * as dotenv from 'dotenv'

require('dotenv').config();


export default defineConfig<TestOptions>({
  testDir: './tests',
  timeout: 100000,
  fullyParallel: true, // Do we want to run tests in parallel within the single spec file
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined, // put 1 instead of undefined to run only 1 worker and disable parallel execution completly
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  //reporter: 'html',
  reporter: [['html'], ['allure-playwright']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    actionTimeout: 10000,
    launchOptions: {
      // 1
      args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled', // fixes the browser not secured for gmail
      
    ] 
    },

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure'
  },

  /* Configure projects for major browsers */
  projects: [
    // Authentication for the projects
    {
      name: 'DevAuth', testMatch: 'Authentication.setup.ts',
      use: {
        apiUrlWeb: `${process.env.DEV_API_URL_WEB}`,
        userEmail: `${process.env.DEV_EMAIL}`,
        userPassword: `${process.env.DEV_PASSWORD}`,
      }
    },
    // Project parameters
    {
      name: 'DevFrontQaTest',
      use: { 
        viewport: { width: 1920, height: 900 },
        baseURL: 'https://binarcode.pbxdev.net/',
        apiUrlWeb: `${process.env.DEV_API_URL_WEB}`,
        storageState: './playwright/.auth/devFrontAuth.json',
        userEmail: `${process.env.DEV_EMAIL}`,
        userPassword: `${process.env.DEV_PASSWORD}`,
      },
      dependencies: ['DevAuth']
    },
   
   

  
    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

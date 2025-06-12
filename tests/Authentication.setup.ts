import { test as setup } from '/Binarcode-Automation-test/test-options'

const storageState = {
    devFrontAuth: './playwright/.auth/devFrontAuth.json',
    //stageFrontManagerAuth: './playwright/.auth/stageFrontManagerAuth.json',
}

/**
 * This setup file will run a script that will store the storageState so that authentication will be executed once per test run.
 */
setup('Dev Front Authentication', async ({ apiUrlWeb, userEmail, userPassword, page }, testinfo) => {

    await page.goto('https://binarcode.pbxdev.net/') 
    await page.getByRole('textbox', { name: 'Email' }).fill(`${userEmail}`)
    await page.getByRole('textbox', { name: 'Password' }).fill(`${userPassword}`)
    await page.getByRole('button', { name: 'Log in' }).click()

    const dashboardLocator = page.locator('[class="text-2xl font-bold flex gap-2"]', { hasText: 'Dashboard' });
    const popupLocator = page.getByRole('alertdialog', { name: 'Active Session Detected' }); 
    const yesButton = page.getByRole('button', { name: 'yes' });

    const dashboardPromise = dashboardLocator.waitFor({ timeout: 20000, state: 'visible' }).then(() => 'dashboard');
    const popupPromise = popupLocator.waitFor({ timeout: 20000, state: 'visible' }).then(() => 'popup');

    const result = await Promise.race([dashboardPromise, popupPromise]);

    if (result === 'popup') {
        await yesButton.click();
        await page.waitForResponse('*/**/api/broadcasting/auth', { timeout: 20000 })
    }
        
    await page.context().storageState({ path: storageState.devFrontAuth })

}) 
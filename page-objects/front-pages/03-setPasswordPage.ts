import { Browser, Page, expect } from "@playwright/test";
import { HelperBase } from "../helperBase";

const emailLinksFile = './test_data/test_artifacts/emailLinks.json'

export class SetPasswordPage extends HelperBase {
  
    readonly browser: Browser

    constructor(page: Page, browser: Browser, apiUrlWeb: string, apiUrlMobile: string ) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.browser = browser
    }

    async resetPasswordWithValidPassword(linkName: string, password: string, repeatPassword: string) {
        const context = await this.browser.newContext()
        const setPasswordPage = await context.newPage()
        const passwordRecoveryLink = await this.readFromFile(linkName, emailLinksFile)
        console.log('Password recovery link: '+passwordRecoveryLink);
        // await mailinatorPage.goto(`${process.env.MAILINATOR}`)
        // await mailinatorPage.locator('#inbox_field').fill(email)
        // await mailinatorPage.getByRole('button', { name: 'GO' }).click()
        // await mailinatorPage.locator('tr', { hasText: 'EasyWay Password Recovery' }).first().click()
        // await expect(mailinatorPage.frameLocator('#pills-tabContent iframe#html_msg_body').locator('table').nth(2)).toContainText('There was a request to change your password!')

        // await mailinatorPage.frameLocator('#pills-tabContent iframe#html_msg_body').getByText('PASSWORD RECOVERY').click()

        // const [setPasswordPage] = await Promise.all([
        //     await context.waitForEvent('page'),
        //     await mailinatorPage.frameLocator('#pills-tabContent iframe#html_msg_body').getByText('PASSWORD RECOVERY').click()
        // ])
        const responsePromise = setPasswordPage.waitForResponse(response => response.url().includes('/v1/misc/password-strength-info'), {timeout: 60000})
        await setPasswordPage.goto(`${passwordRecoveryLink}`)
        await expect(setPasswordPage.locator('h1')).toHaveText(' SET NEW PASSWORD ')
        const response = await responsePromise
        expect(response.status()).toEqual(200)


        await setPasswordPage.getByRole('textbox', {name: 'Password', exact: true}).fill(password)
        await setPasswordPage.getByRole('textbox', {name: 'Repeat Password', exact: true}).fill(repeatPassword)

        await setPasswordPage.getByRole('button', {name: 'NEXT'}).click()

        const emailReset = await setPasswordPage.waitForResponse(response => response.url().includes('/v1/customer/reset-password?token='))
        expect(emailReset.status()).toEqual(200)

        await expect(setPasswordPage.locator('app-notification-bar .text')).toHaveText(' Your personal data was saved successfully. ')
        await expect(setPasswordPage.locator('.text-appointment span')).toHaveText("Success! Your password has been successfully recovered. Keep your credentials secure and if you have any questions, don't hesitate to contact our support team.")


    }



}
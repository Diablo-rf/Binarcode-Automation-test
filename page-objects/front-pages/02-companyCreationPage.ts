import { Browser, expect, Page} from "@playwright/test";
import { companyData } from "/Binarcode-Automation-test/test_data/data";
import { HelperBase } from "../helperBase";
import {faker} from '@faker-js/faker'

const emailLinksFile = './test_data/test_artifacts/emailLinks.json'


export class CompanyCreationPage extends HelperBase{
    readonly browser: Browser

    constructor(page: Page, browser: Browser, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile);
        this.browser = browser
    }
    /**
     * This method confirms the email confirmation mail and creates a company with valid data
     * @param email The email used on registration
     */
    async createNewCompanyWithValidData(companyName: string, linkName: string) {
        const context = await this.browser.newContext()
        const registrationPage = await context.newPage()
        const confirmEmailLink = await this.readFromFile(linkName, emailLinksFile)
        process.env.COMPANY_PASSWORD = `Test${faker.number.int(10000)}!`
        console.log(`Company password: ${process.env.COMPANY_PASSWORD}`);

        // const gmailPage = await context.newPage()
        // await gmailPage.goto('https://gmail.com')
        // await gmailPage.getByRole('textbox', {name: 'Email'}).fill(`${process.env.GMAIL_EMAIL}`)
        // await gmailPage.getByRole('button', {name: 'Next'}).click()
        // await gmailPage.getByRole('textbox', {name: 'Password'}).fill(`${process.env.GMAIL_PASSWORD}`)
        // await gmailPage.getByRole('button', {name: 'Next'}).click()
        // await expect(gmailPage.getByRole('button', {name: 'Compose'})).toBeVisible()
        // await gmailPage.locator('tr').filter({hasText: 'Welcome to EasyWay'}).first().click()
        // await expect(gmailPage.locator('.ha h2').filter({hasText: 'Welcome to EasyWay.'})).toBeVisible()
        // //await expect(gmailPage.getByRole('link', {name: 'Confirm email'})).toBeVisible()
       

        // const registrationPagePromise = context.waitForEvent('page');
        // await gmailPage.getByRole('link', {name: 'Confirm email'}).click()
        // const registrationPage = await registrationPagePromise;

        //YOUR PROFILE page
        const confirmEmail = registrationPage.waitForResponse(response => response.url().includes('/v1/customer/confirm-email?token=') && response.request().method() === 'GET', {timeout: 60000})
        await registrationPage.goto(`${confirmEmailLink}`)
        const response = await confirmEmail
        expect(response.status()).toEqual(200)

        //await expect(registrationPage.locator('app-notification-bar .text')).toHaveText(' Email confirmed ')
        await registrationPage.locator('app-notification-bar .close-btn').click()

        await expect(registrationPage.locator('app-adding-personal-data div h1')).toHaveText(' YOUR PROFILE ')

        const input = registrationPage.locator('input[type="file"]') // #file
        await input.setInputFiles('C:/Binarcode-Automation-test/test_data/customerAvatar.jpg')
        expect(await registrationPage.locator('app-avatar img').getAttribute('src')).toContain('data:image/jpeg')

        await registrationPage.getByRole('textbox', { name: 'first name' }).fill(companyData.firstName)
        await registrationPage.getByRole('textbox', { name: 'last name' }).fill(companyData.lastName)
        await registrationPage.getByRole('textbox', { name: 'Password', exact: true }).fill(`${process.env.COMPANY_PASSWORD}`)
        await registrationPage.getByRole('textbox', { name: 'Repeat Password', exact: true }).fill(`${process.env.COMPANY_PASSWORD}`)

        await registrationPage.getByRole('button', { name: 'Next' }).click()

        const personalData = await registrationPage.waitForResponse(response => response.url().includes('/v1/customer/add-personal-data?token='))
        expect(personalData.status()).toEqual(200)
        await expect(registrationPage.locator('app-notification-bar .text')).toHaveText(' Your personal data was saved successfully. ')
        
        await registrationPage.locator('app-notification-bar .close-btn').click()

        // YOUR COMPANY page
        await expect(registrationPage.locator('app-adding-company-data div h1')).toHaveText('YOUR COMPANY')

        await input.setInputFiles('C:/Binarcode-Automation-test/test_data/companyAvatar.jpg')
        expect(await registrationPage.locator('app-avatar img').getAttribute('src')).toContain('data:image/jpeg')

        await registrationPage.getByRole('textbox', { name: 'Company name' }).fill(companyName)
        await registrationPage.getByRole('textbox', { name: 'Address' }).pressSequentially(companyData.addressInput, { delay: 100 })
        await registrationPage.locator('.pac-item').first().waitFor({state: 'visible'})
        await registrationPage.locator('.pac-item').first().click()
        await expect(registrationPage.getByRole('textbox', { name: 'zip code' })).toHaveValue(companyData.zipCode)
        await registrationPage.getByRole('textbox', { name: 'apt. number' }).fill(companyData.aptNumber)
        await registrationPage.getByPlaceholder('(201) 555-0123').fill(companyData.phoneNumber)
        await registrationPage.getByRole('textbox', { name: 'mc number' }).fill(companyData.mcNumber)
        await registrationPage.getByRole('textbox', { name: 'dot number' }).fill(companyData.dotNumber)

        await registrationPage.getByRole('button', { name: 'Next' }).click()
       
        const completeRegistration = await registrationPage.waitForResponse(response => response.url().includes('/v1/customer/complete-registration?token='))
        expect(completeRegistration.status()).toEqual(200)
        await expect(registrationPage.locator('app-notification-bar .text')).toHaveText(' Company data was successfully saved. ')

        // await gmailPage.goBack()
        // await expect(gmailPage.getByRole('button', {name: 'Compose'})).toBeVisible()
        // await gmailPage.locator('tr', {hasText: 'Your account is under verification'}).first().click()
        // //await expect(gmailPage.locator('.ha h2', {hasText: 'Your account is under verification'})).toBeVisible()
        // await expect(gmailPage.getByRole('listitem').getByText('Your account is currently under moderation by our specialists. ')).toBeVisible()
    }

}
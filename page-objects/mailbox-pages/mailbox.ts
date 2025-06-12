import { Browser, Page, chromium, expect } from "@playwright/test";
import { companyData } from "/Binarcode-Automation-test/test_data/data";
import { HelperBase } from "../helperBase";

const emailLinksFile = './test_data/test_artifacts/emailLinks.json'
const gmailAuth = './playwright/.auth/gmailAuth.json'
const driverInvitationCodes = './test_data/test_artifacts/driverInvitationCodes.json'



interface PaymentRequestParams {
    email: string | undefined,
    userFirstName: string,
    paymentAmount: string,
    paymentPurpose: string,
    driverCredentials?: string,
    drivers?: string

}
export class Mailbox extends HelperBase {
    readonly browser: Browser


    constructor(page: Page, browser: Browser, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.browser = browser

    }

    

    setPage(page: Page) {
        this.page = page;
    }

    async purposeDetails(purpose: string, amount?: string) {
        let date = new Date()
        const month = date.toLocaleString('En-US', { month: 'short' })
        const year = date.getFullYear()
    
        const purposeText =
            purpose === 'SAS Service' ? `Easy Way subscription ${month}, ${year}. Calculated for: ${amount} driver(s)`
                : purpose === 'Easyway Service' ? `Easy Way Consulting service ${month}, ${year}. Calculated for: ${amount} driver(s)`
                    : purpose === 'PSP Report' ? `PSP report for Jose Davis, created at ${await this.currentDate('.')}`
                        : purpose === 'MVR Report' ? `MVR report for John Doe, created at ${await this.currentDate('.')}`
                            : 'Easy Way training: DOT Drug and Alcohol'
    
        return purposeText
    }

    /** ATTENTION This method will reset the storage state for gmail and other methods that use storage state will not work.
     * 
     */
    async loginOnGmail() {
        await this.page.goto('https://gmail.com')
        await this.page.getByRole('textbox', { name: 'Email' }).fill(`${process.env.GMAIL_EMAIL}`)
        await this.page.getByRole('button', { name: 'Next' }).click()
        await this.page.getByRole('textbox', { name: 'Password' }).fill(`${process.env.GMAIL_PASSWORD}`)
        await this.page.getByRole('button', { name: 'Next' }).click()
        await this.page.waitForTimeout(10000)
        //await this.page.waitForResponse(response => response.url().includes('logstreamz'))
        await expect(this.page.getByRole('button', { name: 'Compose' })).toBeVisible()
    }

    async openInboxPage() {
        let gmailAuthStatus = false
        await this.page.goto('https://mail.google.com/')
        gmailAuthStatus = await this.page.getByText('Choose an account').first().isVisible() || await this.page.getByText('Alege un cont').first().isVisible()
        console.log(gmailAuthStatus);
        if (gmailAuthStatus) {
            const browser = await chromium.launch({ headless: false })
            const newPage = await browser.newPage()
            await newPage.goto('https://mail.google.com/')
            await newPage.getByRole('textbox', { name: 'Email' }).fill(`${process.env.GMAIL_EMAIL}`)
            await newPage.getByRole('button', { name: 'Next' }).click()
            await newPage.getByRole('textbox', { name: 'Password' }).fill(`${process.env.GMAIL_PASSWORD}`)
            await newPage.getByRole('button', { name: 'Next' }).click()
            await newPage.waitForResponse('https://mail.google.com/mail/u/0/logstreamz')
            await newPage.context().storageState({ path: gmailAuth })

        }
        await expect.soft(this.page.getByRole('button', { name: 'Compose' })).toBeVisible()

    }
    async checkResentEmail(email: string) {
        await this.page.reload()
        await this.openTargetEmail('Welcome to EasyWay', email)
        const mailBody = this.page.locator('.adn tbody tr', { hasText: 'hello' }).last()
        await expect(mailBody.locator('td p').nth(1)).toHaveText('Thank you for joining EasyWay!')
        await expect(mailBody.locator('td p').nth(2)).toHaveText("We'd like to confirm that your account was created successfully.")
        await expect(mailBody.locator('td p').nth(3)).toHaveText(' To access your customer portal click the button below.')
        await expect(mailBody.getByRole('link', { name: 'Confirm Email' })).toBeVisible()

        await this.deleteEmail()
    }

    /**
     * This method opens the email confirmation mail and gets the confirmation link
     * @param email the email of the target recipient
     */
    async getEmailConfirmationLink(email: string, linkName: string) {

        await this.page.reload()
        await this.openTargetEmail('Welcome to EasyWay', email)
        const mailBody = this.page.locator('.adn tbody tr', { hasText: 'hello' }).last()
        await expect(mailBody.locator('td p').nth(1)).toHaveText('Thank you for joining EasyWay!')
        await expect(mailBody.locator('td p').nth(2)).toHaveText("We'd like to confirm that your account was created successfully.")
        await expect(mailBody.locator('td p').nth(3)).toHaveText(' To access your customer portal click the button below.')
        await expect(mailBody.getByRole('link', { name: 'Confirm Email' })).toBeVisible()
        const link = await this.page.locator('tbody span a').first().getAttribute('href')
        console.log('Email confirmation link: ' + link);
        await this.writeToFile(linkName, link, emailLinksFile)

        await this.deleteEmail()

    }
    /**
     * This method checks for the account verification email
     * @param email the email of the target recipient
     */
    async checkAccountVerificationEmail(email: string) {
        await this.page.reload()
        await this.openTargetEmail('Your account is under verification', email)
        const mailBody = this.page.locator('.adn tbody tr', { hasText: 'hello' }).last()
        await expect(mailBody.locator('td p').nth(1)).toHaveText('Your account is currently under moderation by our specialists.    Shortly, you will receive approval or comments regarding the missing information. ')
        await expect(mailBody.locator('td p').nth(2)).toHaveText('Thank you for your patience!')

        await this.deleteEmail()
    }
    /**
     * This method checks the account ready email
     * @param email the email of the target recipient
     */
    async checkAccountReadyEmail(email: string) {
        await this.page.reload()
        await this.openTargetEmail('Your Account is ready!', email)
        const mailBody = this.page.locator('.adn tbody tr', { hasText: 'hello' }).last()
        await expect(mailBody.locator('td h2')).toHaveText(companyData.firstName)
        await expect(mailBody.locator('td p').nth(1)).toHaveText('Thank you for your patience!')
        await expect(mailBody.locator('td p').nth(2)).toHaveText('This email is to confirm that your account is activated ')
        await expect(mailBody.locator('td p').nth(3)).toHaveText('and now you are part of the Easy Way family ')
        await expect(mailBody.locator('td p').nth(4)).toHaveText('and you have a 14-day free trial!')

        await this.deleteEmail()
    }
    /**
     * 
     * @param email 
     */
    async checkPasswordResetEmail(email: string, linkName: string): Promise<void> {
        await this.page.reload()
        await this.openTargetEmail('EasyWay Password Recovery', email)
        const mailBody = this.page.locator('.adn tbody tr', { hasText: 'hello' }).last()
        await expect(mailBody.locator('td h2')).toHaveText(companyData.firstName)
        await expect(mailBody.locator('td p').nth(1)).toHaveText('There was a request to change your password!')
        await expect(mailBody.locator('td p').nth(2)).toHaveText('If you did not make this request then please ignore this email.')
        await expect(mailBody.locator('td p').nth(3)).toHaveText(' Otherwise, please click this button to change your password : ')
        await expect(mailBody.getByRole('link', { name: 'PASSWORD RECOVERY' })).toBeVisible()
        const link = await this.page.locator('tbody p a').first().getAttribute('href')
        console.log('Password Resent Email: ' + link);
        await this.writeToFile(linkName, link, emailLinksFile)

        await this.deleteEmail()

    }
    async checkDriverInvitationEmail(email: string, driverFirstName: string) {
        await this.openTargetEmail('Welcome to EasyWay.', email)
        const mailBody = this.page.locator('.adn tbody tr', { hasText: 'hello' }).last()
        await expect.soft(mailBody.locator('td h2')).toHaveText(driverFirstName)
        await expect.soft(mailBody.locator('td p').nth(1)).toHaveText('Please use the following code in the process of registering on the Mobile App:')
        await expect.soft(this.page.locator('td p').nth(4)).toHaveText('You can install our Mobile App using the following links:')
        expect.soft(await this.page.locator('a[title="Android"] img').getAttribute('src')).toEqual('https://ci3.googleusercontent.com/meips/ADKq_NbW266VaDyyfxVHosqSccI6uCzoa3sBLL7gKPXjmsBjRF0dmIOHAqImzF11lkbMXLfBXdQUQHPhMqEXuNf1a7LeEbJBW9VZaE0OJMMkE453fHPOTg9sG1JgNg=s0-d-e1-ft#https://easyway.pro/wp-content/uploads/2023/07/Google_play_store.png')
        expect.soft(await this.page.locator('a[title="IOS"] img').getAttribute('src')).toEqual('https://ci3.googleusercontent.com/meips/ADKq_NbQLWr3gbrdqJoUp6Ob5ZEoKoOnHQ7_NlWY_LjQyKw7a1pZSsVWqhKVsHIG46qY8zch8ig5tZlAZ3fFvHwdZW0PAMyGmqlpSBA2hm5wzf9QWl5UMgU5sA9v4jAdcHkdaczlzzfpBfPOwBZvpXyBUayEic36856Bem4Nhw93sptnN6YJ91DY4xo=s0-d-e1-ft#https://easyway.pro/wp-content/uploads/2023/07/apple-app-store-appstore-icon-png-image-purepng-transparent-4-1.png')
        const invitationCode = await mailBody.locator('td p').nth(2).textContent()
        console.log('Driver invitation code: ' + invitationCode);
        await this.writeToFile(email, invitationCode, driverInvitationCodes)

        await this.deleteEmail()
    }
    async checkEwServiceApplicationEmail(email: string) {
        await this.page.reload()
        await this.openTargetEmail('Your request is pending!', email)
        const mailBody = this.page.locator('.adn tbody tr', { hasText: 'hello' }).last()
        await expect(mailBody.locator('td h2')).toHaveText(companyData.firstName)
        await expect(mailBody.locator('td p').nth(2)).toHaveText('Thank you for your intention to collaborate! ')
        await expect(mailBody.locator('td p').nth(4)).toHaveText('Your request is pending!')

        await this.deleteEmail()
    }
    async checkEwServiceActivationEmail(email: string) {
        await this.page.reload()
        await this.openTargetEmail('Welcome to EasyWay SERVICE!', email)
        const mailBody = this.page.locator('.adn tbody tr', { hasText: 'hello' }).last()
        await expect(mailBody.locator('td h2')).toHaveText(companyData.firstName)
        await expect(mailBody.locator('td p').nth(1)).toHaveText('Welcome to EasyWay SERVICE! ')
        await expect(mailBody.locator('td p').nth(3)).toHaveText('Your request is ACCEPTED!')

        await this.deleteEmail()
    }
    async checkPaymentRequestPaid({ email, userFirstName, paymentAmount, paymentPurpose, driverCredentials, drivers }: PaymentRequestParams) {
        const currentDate = await this.currentDate('.')

        //await this.page.waitForTimeout(6000)
        await this.page.reload()
        console.log(await this.purposeDetails(paymentPurpose, drivers));
        //MVR report for John Doe, created at 01.23.2025
        await this.openTargetEmail('Payment Request Paid', email, `${await this.purposeDetails(paymentPurpose, drivers)}`)
        const mailBody = this.page.locator('.adn tbody tr', { hasText: 'hello' }).last()
        await expect.soft(this.page.locator('.adn tbody tr', { hasText: 'hello' }).last().locator('td h2')).toHaveText(userFirstName)
        await expect.soft(this.page.locator('.adn tbody tr', { hasText: 'hello' }).last().locator('td p').nth(1)).toHaveText('A payment for EasyWay services')
        await expect.soft(this.page.locator('.adn tbody tr', { hasText: 'hello' }).last().locator('td p').nth(2)).toHaveText(`of ${paymentAmount} USD was successfully paid!`)
        console.log(await this.purposeDetails(paymentPurpose, drivers));
        await expect.soft(this.page.locator('td p').nth(7))
            .toHaveText(`                            Payment NAME:   ${await this.purposeDetails(paymentPurpose, drivers)}`)
        await expect.soft(this.page.locator('td p').nth(8)).toContainText(`                             Payment DATE:    ${currentDate}`)
        await expect.soft(this.page.locator('td p').nth(9)).toHaveText(`Amount:        ${paymentAmount} USD`)
        expect.soft(await this.page.locator('[class="aZo N5jrZb"]').getAttribute('download_url')).toContain('Invoice')
        await this.deleteEmail()
    }
    async checkDrugScreenQPassport(email: string | undefined) {
        //await this.page.waitForTimeout(6000)
        await this.page.reload()
        await this.openTargetEmail('Your Drug Screen QPassport', email)
        await expect.soft(this.page.locator('.a3s')).toContainText('Attached is your drug screen QPassport')
        expect.soft(await this.page.locator('.a3s a').getAttribute('href')).toEqual('https://www.questdiagnostics.com/home/companies/employer/drug-screening/what-to-expect/')
        expect.soft(await this.page.locator('[class="aZo N5jrZb"]').getAttribute('download_url')).toContain('QPassport')
        await this.deleteEmail()
    }
    /** OPEN TARGET EMAIL:
     * This method cycle through the emails and opens the email that have the target recipient
     * @param emailTitle the title of the target email
     * @param email the email of the target recipient
     */
    private async openTargetEmail(emailTitle: string, email: string | undefined, paymentPurpose?: string) {
        //await this.page.locator('.aDP').waitFor({state: 'visible'})
        let emailRows = await this.page.locator('.aDP tbody tr', { hasText: emailTitle }).all()
        let emailValue: string | null
        let paymentName: string | null
        let found = false
        let retries = 0

        while (!found) {
            for (let emailRow of emailRows) {
                await emailRow.click({ position: { x: 100, y: 0 } })
                emailValue = await this.page.locator('.ady div span span').getAttribute('email')

                if (paymentPurpose) {
                    paymentName = await this.page.locator('[class="ii gt"] p span', { hasText: 'Payment NAME' }).textContent()
                    if (emailValue === email && paymentName?.includes(paymentPurpose)) {
                        found = true
                        break
                    } else {
                        continue
                    }
                } else {
                    if (emailValue === email) {
                        found = true
                        break
                    } else {
                        continue
                    }
                }

            }

            if (!found && retries < 6) {
                await this.page.reload()
                //await this.page.locator('.aDP').waitFor({state: 'visible'})
                retries++
                emailRows = await this.page.locator('.aDP tbody tr', { hasText: emailTitle }).all()
            } else { break }
        }

        expect.soft(await this.page.locator('.ady div span span').getAttribute('email')).toEqual(email)
    }
    async deleteEmail() {

        await this.page.getByRole('menu').click()
        const ariaExpanded = this.page.getByRole('button', { name: 'more message options' })
        const menuAttribute = await ariaExpanded.getAttribute('aria-expanded')

        expect(menuAttribute).toEqual('true')
        await this.page.getByRole('menuitem', { name: 'Delete this message' }).click()

    }
    async deleteTargetEmail(emailTitle: string, email: string) {
        let emailRows = await this.page.locator('.aDP tbody tr', { hasText: emailTitle }).all()
        let emailValue: string | null
        let found = false
        let retries = 0

        while (!found) {
            for (let emailRow of emailRows) {
                await emailRow.click()
                emailValue = await this.page.locator('.ady div span span').getAttribute('email')

                if (emailValue === email) {
                    found = true
                    await this.page.getByRole('menu').click()
                    const ariaExpanded = this.page.getByRole('button', { name: 'more message options' })
                    const menuAttribute = await ariaExpanded.getAttribute('aria-expanded')

                    expect(menuAttribute).toEqual('true')
                    await this.page.getByRole('menuitem', { name: 'Delete this message' }).click()
                    break
                } else {
                    continue
                }
            }

            if (!found && retries < 5) {
                await this.page.reload()
                retries++
                emailRows = await this.page.locator('.aDP tbody tr', { hasText: emailTitle }).all()
            } else { break }
        }
        await this.page.waitForTimeout(1000)
        //expect.soft(await this.page.locator('.ady div span span').getAttribute('email')).not.toContain(email)
    }
    /** WAIT FOR NEW EMAIL (FLAKY):
     * This method waits for a number of page reloads for the letter with label "New" to be displayed
     * @param emailTitle the title of the target email
     * @param numberOfReloads the number of page reloads to be executed 
     */
    private async waitForNewEmail(emailTitle: string, numberOfReloads: number) {
        const emailRow = this.page.locator('tr', { hasText: emailTitle })
        let newEmail = await emailRow.filter({ has: this.page.locator('.aRI', { hasText: 'New' }) }).count()
        let reload = 0

        while (!newEmail && reload < numberOfReloads) {
            await this.page.reload()
            newEmail = await emailRow.filter({ has: this.page.locator('.aRI', { hasText: 'New' }) }).count()
            reload++

        }
    }

    async checkConsortiumApplicationEmail(email: string) {
        await this.page.reload()
        await this.openTargetEmail('EasyWay CONSORTIUM application!', email)
        const mailBody = this.page.locator('.adn tbody tr', { hasText: 'hello' }).last()
        await expect(mailBody.locator('td h2')).toHaveText(companyData.firstName)
        await expect(mailBody.locator('td p').nth(1)).toHaveText('Welcome to EasyWay CONSORTIUM!')
        await expect(mailBody.locator('td p').nth(2)).toHaveText(' Thank You for your application!')
        await expect(mailBody.locator('td p').nth(4)).toHaveText('We will analyze the information soon and in a short time')
        await expect(mailBody.locator('td p').nth(5)).toHaveText(' you will have access to the testing program. ')

        await this.deleteEmail()
    }
    async checkConsortiumConfirmationEmail(email: string) {
        await this.page.reload()
        await this.openTargetEmail('EasyWay consortium request vas ACCEPTED!', email)
        const mailBody = this.page.locator('.adn tbody tr', { hasText: 'hello' }).last()
        await expect(mailBody.locator('td h2')).toHaveText(companyData.firstName)
        await expect(mailBody.locator('td p').nth(1)).toHaveText('Welcome to EasyWay CONSORTIUM!')
        await expect(mailBody.locator('td p').nth(2)).toHaveText('Your request vas ACCEPTED!')
        await expect(mailBody.locator('td p').nth(4)).toHaveText('Now you are part of the EasyWay Consortium drug & alcohol testing program!')
        await expect(mailBody.locator('td p').nth(6)).toHaveText('Find in the attachment Your Certificate of Enrollment!')

        await this.deleteEmail()
    }

}


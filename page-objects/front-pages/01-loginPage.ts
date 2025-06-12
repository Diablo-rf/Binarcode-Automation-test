import { Page, expect } from "@playwright/test";
import { companyData } from "/Binarcode-Automation-test/test_data/data";




export class LoginPage {
    readonly page: Page

    constructor(page: Page) {
        this.page = page
    }
    
    async signUpTheEmail(email: string) {
        //await this.page.getByRole('button', { name: 'AGREE' }).click()
        await this.page.locator('.register-container').getByRole('textbox', { name: 'Email' }).fill(email)
        console.log('Sign up email: '+email);
        await this.page.locator('.register-container').getByRole('button', { name: ' Sign up ' }).click()
        await this.page.waitForSelector('.registration-card')
        await expect(this.page.locator('.registration-card')).toContainText(' You have acquired professional software for managing your trucking business. ')
        await expect(this.page.locator('.registration-card .email')).toHaveText(email)

    } 
    async resendEmailVerification(email: string) {
        await expect(this.page.locator('.registration-card')).toContainText(' You have acquired professional software for managing your trucking business. ')
        await expect(this.page.locator('.registration-card .email')).toHaveText(email)
        const resendPromise = this.page.waitForResponse(response => response.url().includes('/v1/customer/resend-registration-email?token=') && response.request().method() === 'POST')
        await this.page.locator('.red-link', {hasText: 'Resend'}).click()
        const resendResponse = await resendPromise
        expect(resendResponse.status()).toEqual(200)
        await expect(this.page.locator('app-notification-bar .text')).toHaveText(' The email was successfully resent. ')
        await expect(this.page.locator('span a').first()).toHaveClass(/disabled-link/)



    }

    async signIn(email: string, password: string) {
        await this.page.locator('.login-form').getByRole('textbox', { name: 'Email' }).fill(email)
        await this.page.locator('.login-form').getByRole('textbox', { name: 'Password' }).fill(password)
        await this.page.locator('.login-form').getByRole('button', { name: 'Sign in' }).click()
        const logInResponse = await this.page.waitForResponse(response => response.url().includes('/v1/auth/login') && response.request().method() === 'POST')
        expect(logInResponse.status()).toEqual(200)
        await expect(this.page.locator('app-notification-bar .text')).toHaveText(' Logged in successfully! ')

        await this.page.waitForResponse('*/**/v1/customer/me?expand=company,entity')
        await this.page.locator('app-breadcrumbs li').waitFor({state: 'visible'})
        await expect(this.page.locator('app-header .breadcrumbs__item', {hasText: 'Dashboard'})).toBeVisible()
        

    }
    async signInAfterAccountApproval(email: string, password: string) {
        await this.page.locator('.login-form').getByRole('textbox', { name: 'Email' }).fill(email)
        await this.page.locator('.login-form').getByRole('textbox', { name: 'Password' }).fill(password)
        await this.page.locator('.login-form').getByRole('button', { name: 'Sign in' }).click()
        const logInResponse = await this.page.waitForResponse(response => response.url().includes('/v1/auth/login') && response.request().method() === 'POST')
        expect(logInResponse.status()).toEqual(200)
        await expect(this.page.locator('app-notification-bar .text')).toHaveText(' Logged in successfully! ')

        await this.page.waitForResponse('*/**/v1/customer/me?expand=company,entity')
        await expect(this.page.locator('app-header .breadcrumbs__item')).toHaveText("Dashboard")
        await expect(this.page.locator('.free-trial__text span')).toHaveText(' Free Trial: 14 days left ')
        await expect(this.page.locator('.card_arrow_left_top .title')).toHaveText(' Drivers ')
        await expect(this.page.locator('.circle')).toHaveCSS('top', '183.5px')
        await expect(this.page.locator('.full_name')).toHaveText(`${companyData.firstName} ${companyData.lastName}`)

        const companyAvatar = await this.page.locator('.company-logo img').getAttribute('src')
        expect(companyAvatar).toContain('companyAvatar.jpg')
        const customerAvatar = await this.page.locator('.avatar__inner img').getAttribute('src')
        expect(customerAvatar).toContain('customerAvatar.jpg')
    }

    async sendEmail(email: string) {
        await this.page.getByRole('textbox', { name: 'Email' }).fill(email)
        await expect(this.page.getByRole('textbox', { name: 'Email' })).toHaveValue(email)
        await this.page.getByRole('button', { name: 'Send' }).click()

        const response = await this.page.waitForResponse(response => response.url().includes('/v1/customer/recover-password'))
        expect(response.status()).toEqual(200)
        await expect(this.page.locator('.registration-card .text span')).toHaveText(' To keep your data safe, we sent you an email with a reset password link. ')
    }

    async switchToSignInPage() {
        await this.page.locator('app-register-form').getByRole('button', { name: 'Sign In' }).click()
        await expect(this.page.locator('.login-container__subtitle')).toHaveText('Welcome back! Please login to your account.')
    }

    async navigateToForgoPassword() {
        await this.page.getByText('Forgot Password').click()
        await expect(this.page.locator('.__forgot_password-container__title')).toHaveText('RESET PASSWORD')
    }

}
import { Page, expect } from "@playwright/test";

export class DashboardPage {
    readonly page: Page
    readonly apiUrlWeb: string

    constructor(page: Page, apiUrlWeb: string) {
        this.page = page
        this.apiUrlWeb = apiUrlWeb
    }
    

    async openMyCompanyPage() {
        await this.page.goto('/')
        await this.page.waitForLoadState('domcontentloaded')
        await this.page.locator('.sidebar-profile-card').hover()
        await expect.soft(this.page.locator('a[data-sidebar-button="/company"]')).toBeVisible()
        await this.page.locator('a[data-sidebar-button="/company"]').click()
        await this.page.locator('h1', {hasText: 'My Company'}).waitFor({state: 'visible'})

    }
  

    async openPage(pageTitle: string) {

        const locators: { [key: string]: string } = {
            'Dashboard': 'a i.ew-dashboard',
            'Drivers': 'a i.ew-driver',
            'Trucks': 'a i.ew-truck',
            'Trailers': 'a i.ew-trailer',
            'Automation Testing Company': 'a i.ew-building',
            'Team Members': 'a i.ew-team',
            'Suggestions': 'a em.ew-settings',
            'Trainings': 'a em.ew-book',
            'Accident Register': 'a em.ew-accident',
            'Payments': 'a em.ew-payment',
            'Drug and Alcohol': 'a em.ew-drugalcohol',
            'Tasks': 'a em.ew-suitcase',
            'Drivers Map': 'a em.ew-map',
            'Credentials': 'a em.ew-eye',
            'Loads': 'a em.ew-load',
            'Chat': 'a em.ew-chat'
        }
        const locatorSelector = locators[pageTitle] || locators['Chat']
        await this.page.locator(locatorSelector).waitFor({state: 'visible'})
        await this.page.locator(locatorSelector).click()

        if (pageTitle === 'Automation Testing Company')
            await this.page.locator('app-company-info').waitFor({state: 'visible'});
        if (pageTitle === 'Trainings' || pageTitle === 'Drug and Alcohol')
            await this.page.waitForLoadState('networkidle');
        if (pageTitle === 'Drivers Map')
            await this.page.locator('.drivers-list').waitFor({state: 'visible'});
        if (pageTitle === 'Chat')
            await this.page.getByRole('progressbar').first().waitFor({ state: 'detached' });
        await expect.soft(this.page.locator('app-header app-breadcrumbs', {hasText: pageTitle})).toBeVisible()

    }

    async openEwServicePage() {
        await this.page.getByRole('button', {name: 'EW SERVICE'}).click()
        
        await expect(this.page.getByRole('button', {name: 'SEND REQUEST'})).toBeVisible()
        await expect(this.page.locator('[class="subtitle init"]')).toHaveText(' You are about to initiate Easy Way Safety Service ')
        

    }
    async applyToEwService() {
        const responsePromise = this.page.waitForResponse(response => response.url().includes('api.easyway.pro/v1/company/get-ew-service-agreement') && response.request().method() === 'GET')
        await this.page.getByRole('button', {name: 'SEND REQUEST'}).click()
        const ewServiceResponse = await responsePromise
        expect(ewServiceResponse.status()).toEqual(200)

        await expect(this.page.getByRole('button', {name: 'sign'})).toBeVisible()
        await expect(this.page.locator('.agreement').first()).toHaveText(' AGREEMENT ')
        

    }
    async signEwServiceAgreement() {
        const responsePromise = this.page.waitForResponse(response => response.url().includes('api.easyway.pro/v1/company/sign-ew-service-agreement') && response.request().method() === 'POST' )
        await this.page.getByRole('button', {name: 'sign'}).click()
        const ewServiceResponse = await responsePromise
        expect(ewServiceResponse.status()).toEqual(200)

        await expect(this.page.locator('.company-inspection div')).toHaveText('Our team is researching the application and we will approve it soon!')

    }
    async checkCompanyAfterEwServiceActivation() {
        await this.page.reload()
        //await expect.soft(this.page.locator('.free-trial__inner div span')).toHaveText(' Subscription Payment Required: 5 days left ')
        await expect.soft(this.page.locator('.ew-bell span')).toHaveText(' 1 ')
        await this.page.locator('.ew-bell').click()
        await expect.soft(this.page.locator('.notification', {hasText: 'Your request for Safety Service was approved'})).toBeVisible()
        await this.page.locator('.close').click()
    }
    async editCustomerProfile() {
        await this.page.locator('app-header em.ew-user').click()
        await expect(this.page.locator('button', {hasText: 'settings'})).toBeVisible()
        await this.page.locator('button', {hasText: 'settings'}).click()
        await this.page.locator('app-team-member-addit').waitFor({state: 'visible'})
        await this.page.getByRole('textbox', { name: 'Address' }).pressSequentially('Astoria', { delay: 100 })
        await this.page.locator('.pac-item').first().waitFor({state: 'visible'})
        await this.page.locator('.pac-item').first().click()
        await expect(this.page.getByRole('textbox', { name: 'zip code' })).toHaveValue('97103')
        await this.page.locator('app-phone-number', {hasText: ' Phone Number '}).getByPlaceholder('(201) 555-0123').fill('(201) 555-0155')
        await this.page.getByRole('button', { name: 'save' }).click()
        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Team Member was updated successfully! ' })).toBeVisible()
    }

    async activateSAS() {
        await this.page.locator('.free-trial__wrap mat-icon').click()
        await expect.soft(this.page.locator('.modal-dialog__title', { hasText: 'Activation' })).toBeVisible()
        await expect.soft(this.page.locator('mat-dialog-content').first()).toContainText('Ready to start your subscription?')
        const modalText = await this.page.locator('.modal-dialog__content').allTextContents()

        if (modalText[0].includes('This payment will be processed automatically')) {
            const responsePromise = this.page.waitForResponse(response => response.url() === `${this.apiUrlWeb}/subscription/start-sas` && response.request().method() === 'POST', { timeout: 60000 })
            await this.page.getByRole('button', { name: 'confirm' }).click()
            const pspResponse = await responsePromise
            expect(pspResponse.status()).toEqual(200)
            await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' This payment request will be automatically accepted and paid! ' })).toBeVisible()
            await expect.soft(this.page.locator('.free-trial__wrap mat-icon')).not.toBeVisible()
            const paymentResponseBody = await pspResponse.json()
            return paymentResponseBody.data.payment_request_id
        } else {
            /**
             * @Todo Write the flow of the manual payment
             */
        }
    }
}
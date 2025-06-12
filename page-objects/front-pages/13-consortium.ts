import { Page, expect, APIRequestContext} from "@playwright/test";
import { HelperBase} from "../helperBase";


export class DrugAndAlcoholPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request
    }

    async checkConsortiumPageAfterCompanyCreation(){
        await this.page.locator('a em.ew-drugalcohol').click()
        await this.page.waitForLoadState('domcontentloaded');
        await expect.soft(this.page.locator('.ew-brand')).toHaveText(' Easy Way Drug & Alcohol Testing Program ')
        await expect.soft(this.page.locator('.progress-apply')).toHaveText('Your company is in the process of adding to Quest Diagnostics. You will be notified shortly.')
    }
    async signDaConsortiumAgrrement(){
        await this.page.locator('a em.ew-drugalcohol').click()
        await this.page.locator('app-waiting-agreement-consortium-status-application').waitFor({state: 'visible'})
        await expect.soft(this.page.locator('.ew-brand')).toHaveText(' Easy Way Consortium Agreement ')
        await expect.soft(this.page.locator('.subtitle')).toHaveText('You are about to initiate Easy Way Drug & Alcohol Testing Program.')
        //await expect.soft(this.page.locator('p', {hasText: 'By click NEXT BUTTON, I authorize EasyWay to act as the intermediary'})).toBeVisible()
        await this.page.getByRole('button', {name: 'sign agreement'}).click()
        const agreementRequest = await this.page.waitForResponse(response => response.url() === `${this.apiUrlWeb}/da-application/sign-agreement` && response.request().method()  === 'POST')
        expect.soft(agreementRequest.status()).toEqual(200)
    }
    async confirmClearingHouseApplication() {
        await this.page.locator('app-clearing-house-check-consortium-status-application').waitFor({state: 'visible'})
        await this.page.locator('pdf-viewer').waitFor({state: 'visible'})
        await expect.soft(this.page.locator('.subtitle')).toHaveText('Designate Easy Way LLC to Clearing House')
        await expect.soft(this.page.locator('.markedContent [role="presentation"]', {hasText: 'Designating Your C/TPA in the Employer Dashboard'})).toBeVisible()
        await expect.soft(this.page.getByRole('button', {name: 'visibility_outlined'})).toBeVisible()
        await expect.soft(this.page.getByRole('button', {name: 'file_download_outlined'})).toBeVisible()
        await this.page.getByRole('button', {name: 'confirm application'}).click()
        const agreementRequest = await this.page.waitForResponse(response => response.url() === `${this.apiUrlWeb}/da-application/clearing-house-confirm` && response.request().method()  === 'POST')
        expect.soft(agreementRequest.status()).toEqual(200)
        await expect.soft(this.page.locator('.subtitle')).toHaveText('Our operators check the Clearing House settings')
    }
    async checkConsortiumPageAfterConfirmation() {
        await this.page.locator('a em.ew-drugalcohol').click()
        await this.page.waitForLoadState('domcontentloaded');
        await expect.soft(this.page.locator('app-header .breadcrumbs__item', {hasText: 'Drug and Alcohol'})).toBeVisible()
        await expect.soft(this.page.locator('app-tests-list h4')).toHaveText('No active generated quarters and tests')
    }
    async checkConsortiumPageAfterBeingRejected() {
        await this.page.locator('a em.ew-drugalcohol').click()
        await this.page.waitForLoadState('domcontentloaded');
        await expect.soft(this.page.locator('app-header .breadcrumbs__item', {hasText: 'Dashboard'})).toBeVisible()
        await expect.soft(this.page.locator('.reject-apply')).toHaveText('Your clearing house settings was rejected. Please contact support for any questions!')
    }

}
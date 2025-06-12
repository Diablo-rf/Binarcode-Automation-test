import { APIRequestContext, Page, expect } from "@playwright/test";
import { HelperBase } from "../helperBase";

const daIdFilePath = './test_data/test_artifacts/daID.json'

export class DaApplicationsPage extends HelperBase {

    readonly request: APIRequestContext
    backUrl: string
    backAuthToken: string

    constructor(page: Page, request: APIRequestContext, backUrl: string, backAuthToken: string, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request
        this.backUrl = backUrl
        this.backAuthToken = backAuthToken

    }

    setPage(page: Page) {
        this.page = page;
    }

    async verifyDaStatusAfterCompanyCreation(companyName: string): Promise<void> {
        const companyRow = this.page.locator('tbody tr', { hasText: companyName })
        const daIdValue = await companyRow.locator('[data-col-seq="1"]').textContent()
        await this.writeToFile(companyName, daIdValue, daIdFilePath)

        await expect.soft(companyRow.locator('[data-col-seq="3"]')).toHaveText('waiting_qd_request')
        await expect.soft(companyRow.locator('[data-col-seq="4"]')).toHaveText('waiting_agreement_confirmation')
        await expect.soft(companyRow.locator('[data-col-seq="5"]')).toHaveText('EW_CONSORTIUM_COMMON_POOL')

    }
    async emailQuestDiagnostics(companyName: string | undefined, der?: boolean, phone?: boolean) {
        const daApplicationId = await this.page.locator('tbody tr', { hasText: companyName }).locator('[data-col-seq="1"]').textContent()
        await this.page.locator('tbody tr', { hasText: companyName }).getByTitle('update').click()
        await expect.soft(this.page.locator('.box-header h3')).toHaveText(`Update Da Application: ${companyName}`)
        expect.soft(await this.page.locator(`#daapplication-status option`, {hasText: 'Waiting QD request'}).getAttribute('selected')).toBe('')
        
        const emailQuestDiagnostics = await this.request.post(`${this.backUrl}da-application/email-quest-diagnostics?id=${daApplicationId}`, {
            headers: {
                Authorization: this.backAuthToken,
                Cookie: await this.phpSessidCookie()
            }, timeout: 30000
        })
        expect(emailQuestDiagnostics.status()).toEqual(200)
        await this.page.reload()
        //await expect.soft(this.page.locator('.alert-success', {hasText: 'Email to Quest Diagnostics has been sent!'})).toBeVisible()
        expect.soft(await this.page.locator(`#daapplication-status option`, {hasText: 'Waiting QD response'}).getAttribute('selected')).toBe('')

        await expect.soft(this.page.locator('.form-group a', {hasText: 'accept'})).toBeVisible()
        await expect.soft(this.page.locator('.form-group a', {hasText: 'reject'})).toBeVisible()
        return daApplicationId
    }
    async acceptQuestDiagnostics(companyName: string, daApplicationId: string | null, accountNumber?: boolean){
        await this.page.getByRole('textbox', {name: 'account number'}).fill('11320912')
        const updateResponsePromise = this.page.waitForResponse(response => response.url().includes(`${this.backUrl}da-application/update?id=`))
        await this.page.getByRole('button', {name: 'save'}).click()
        const updateResponse = await updateResponsePromise
        expect.soft(updateResponse.status()).toEqual(200)
        await expect.soft(this.page.locator('.box-title')).toHaveText(companyName)

        const accept = await this.request.post(`${this.backUrl}da-application/accept?id=${daApplicationId}`, {

            headers: {
                Authorization: this.backAuthToken,
                Cookie: await this.phpSessidCookie()
            }
        })
        accountNumber ? expect(accept.status()).toEqual(200) : expect(accept.status()).toEqual(500)
        await this.page.locator('a i.fa-pencil-alt').click()
        await this.page.locator('.box-title', {hasText: `Update Da Application: ${companyName}`}).waitFor({state: 'visible'})
        expect.soft(await this.page.locator(`#daapplication-status option`, {hasText: 'Accepted'}).getAttribute('selected')).toBe('')
        await expect.soft(this.page.locator('.form-group a', {hasText: 'accept'})).not.toBeVisible()
        await expect.soft(this.page.locator('.form-group a', {hasText: 'reject'})).not.toBeVisible()
    }
    async checkConsortiumStatusAfterSigningAgreement(){
        await this.page.reload()
        expect.soft(await this.page.locator('#daapplication-consortium_status', {hasText: 'Waiting clearing house confirmation'}).getAttribute('selected')).toBe(null)
        
    }
    async acceptConsortium(daApplicationId: string | null){
        await this.page.reload()
        await expect.soft(this.page.locator('.form-group a', {hasText: 'accept consortium'})).toBeVisible()
        await expect.soft(this.page.locator('.form-group a', {hasText: 'reject consortium'})).toBeVisible()
        expect.soft(await this.page.locator(`#daapplication-consortium_status`, {hasText: 'Clearing house check'}).getAttribute('selected')).toBe(null)

        const accept = await this.request.post(`${this.backUrl}da-application/accept-consortium?id=${daApplicationId}`, {

            headers: {
                Authorization: this.backAuthToken,
                Cookie: await this.phpSessidCookie()
            }
        })
        expect(accept.status()).toEqual(200) 
        await this.page.reload()
        expect.soft(await this.page.locator('#daapplication-consortium_status', {hasText: 'Accepted'}).getAttribute('selected')).toBe(null)
        await expect.soft(this.page.locator('.form-group a', {hasText: 'accept consortium'})).not.toBeVisible()
        await expect.soft(this.page.locator('.form-group a', {hasText: 'reject consortium'})).not.toBeVisible()
    }
    async rejectConsortium(daApplicationId: string | null){
        await this.page.reload()
        await expect.soft(this.page.locator('.form-group a', {hasText: 'accept consortium'})).toBeVisible()
        await expect.soft(this.page.locator('.form-group a', {hasText: 'reject consortium'})).toBeVisible()
        expect.soft(await this.page.locator(`#daapplication-consortium_status`, {hasText: 'Clearing house check'}).getAttribute('selected')).toBe(null)

        const accept = await this.request.post(`${this.backUrl}da-application/reject-consortium?id=${daApplicationId}`, {

            headers: {
                Authorization: this.backAuthToken,
                Cookie: await this.phpSessidCookie()
            }
        })
        expect(accept.status()).toEqual(200) 
        await this.page.reload()
        expect.soft(await this.page.locator('#daapplication-consortium_status', {hasText: 'Rejected'}).getAttribute('selected')).toBe(null)
        await expect.soft(this.page.locator('.form-group a', {hasText: 'accept consortium'})).not.toBeVisible()
        await expect.soft(this.page.locator('.form-group a', {hasText: 'reject consortium'})).not.toBeVisible()
    }
    
}
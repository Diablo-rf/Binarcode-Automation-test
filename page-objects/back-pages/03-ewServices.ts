import { APIRequestContext, Page, expect } from "@playwright/test";
import { HelperBase } from "../helperBase";


export class EwServicesPage extends HelperBase {

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

    async verifyEwServiceStatusAfterApplication(companyName: string): Promise<void> {
        await expect(this.page.locator('tbody tr', { hasText: companyName }).locator('[data-col-seq="5"]')).toHaveText('unconfirmed_agreement')

    }
    async activateEwService(companyName: string, specialPrice: string) {
        await expect(this.page.locator('tbody tr', { hasText: companyName }).locator('[data-col-seq="5"]')).toHaveText('company_inspection')
        await this.page.locator('tbody tr', { hasText: companyName }).getByTitle('update').click()

        await expect(this.page.locator('.box-title')).toHaveText('Update Ew Service: ' + companyName)
        await expect(this.page.getByRole('button', { name: 'Save' })).toBeVisible()
        await expect(this.page.getByRole('link', { name: 'Activate' })).toBeVisible()

        await this.page.getByRole('combobox').click()
        await this.page.locator('.select2-results__options li', { hasText: 'Automation Service' }).click()
        await expect(this.page.locator('.select2-selection__choice[title="Automation Service"]')).toBeVisible()

        await this.page.locator('input[name="EwService[special_price]"]').fill(specialPrice)
        await expect(this.page.locator('input[name="EwService[special_price]"]')).toHaveValue(specialPrice)

        await this.page.getByRole('button', { name: 'Save' }).click()
        await this.page.locator('.box-title').waitFor({ state: 'attached' })
        await expect(this.page.locator('tr', { hasText: 'Company' }).first().locator('td')).toHaveText(companyName)
        await expect(this.page.locator('tr', { hasText: 'EW Operators' }).locator('td')).toHaveText('Automation Service')
        await expect(this.page.locator('tr', { hasText: 'Status' }).locator('td')).toHaveText('company_inspection')
        await expect(this.page.locator('tr', { hasText: 'Special Price' }).locator('td')).toHaveText(`${specialPrice}.00`)
        const ewServiceId = await this.page.locator('.box-title').textContent()
        console.log('EW SERVICE ID: ' + ewServiceId);

        const appprove = await this.request.post(`${this.backUrl}/ew-service/activate?id=${ewServiceId}`, {

            headers: {
                Authorization: this.backAuthToken,
                Cookie: await this.phpSessidCookie()
            }
        })
        expect(appprove.status()).toEqual(200)
        await this.page.reload()
        await expect(this.page.locator('tr', { hasText: 'Status' }).locator('td')).toHaveText('active')
    }

}
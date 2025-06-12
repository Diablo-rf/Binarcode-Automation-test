import { APIRequestContext, Page, expect } from "@playwright/test";
import { companyData } from "/Binarcode-Automation-test/test_data/data";
import { promises as fs } from 'fs';
import { HelperBase } from "../helperBase";

const companyIdFilePath = './test_data/test_artifacts/companyID.json'

export class CompaniesPage extends HelperBase {

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
    async verifyCompanyStatusAndDataAfterCreation(companyName: string, companyIdKey: string): Promise<void> {
        const companyIdValue = await this.page.locator('tbody tr', { hasText: companyName }).locator('[data-col-seq="1"]').textContent()
      
        await this.writeToFile(companyIdKey, companyIdValue, companyIdFilePath)

        await expect(this.page.locator('tbody tr', { hasText: companyName }).locator('[data-col-seq="14"]').first()).toHaveText('under_verification')

        await this.page.locator('tbody tr', { hasText: companyName }).getByTitle('update').first().click()

        await expect(this.page.locator('.box-title')).toHaveText('Update Company: ' + companyName)
        await expect(this.page.getByRole('textbox', { name: 'title' })).toHaveValue(companyName)
        await expect(this.page.getByRole('textbox', { name: 'address' })).toHaveValue(companyData.addressOutput)
        await expect(this.page.getByRole('textbox', { name: 'zip' })).toHaveValue(companyData.zipCode)
        await expect(this.page.getByRole('textbox', { name: 'phone number' })).toHaveValue(companyData.phoneNumber)
        await expect(this.page.getByRole('textbox', { name: 'mc number' })).toHaveValue(companyData.mcNumber)
        await expect(this.page.getByRole('textbox', { name: 'dot number' })).toHaveValue(companyData.dotNumber)
        await expect(this.page.getByRole('textbox', { name: 'unit number' })).toHaveValue(companyData.aptNumber)

    }
    /**
     * This method makes an API call to approve a company in backoffice
     * @param companyName The name of the company 
     * @param companyID The company ID
     */
    async approveCompany(companyName: string, companyID: string) {
        const fileData = JSON.parse(await fs.readFile(companyIdFilePath, 'utf8'));
        let companyIdValue: string | undefined = undefined
        for (const id of fileData) {
            if (id.hasOwnProperty(companyID)) {
                companyIdValue = id[companyID]
                break
            }
        }
        console.log('Approve company id =' + companyIdValue);
        await expect(this.page.locator('tbody tr', { hasText: companyName }).filter({ hasText: companyIdValue }).locator('[data-col-seq="14"]')).toHaveText('under_verification')
        const appprove = await this.request.post(`${this.backUrl}/company/approve?id=${companyIdValue}`, {

            headers: {
                Authorization: this.backAuthToken,
                Cookie: await this.phpSessidCookie()
            }
        })
        expect(appprove.status()).toEqual(200)
        await this.page.reload()
        await expect(this.page.locator('tbody tr', { hasText: companyName }).filter({ hasText: companyIdValue }).locator('[data-col-seq="14"]')).toHaveText('free_trial')

    }
    async editCompany(companyName: string) {
        await this.page.locator('tbody tr', { hasText: companyName }).getByTitle('update').first().click()
        await this.page.getByRole('combobox').click()
        await this.page.locator('.select2-results').waitFor({state: 'visible'})
        await this.page.getByRole('option', {name: 'James Bond'}).click()
        await expect.soft(this.page.getByRole('textbox', {name: 'James Bond'})).toBeVisible()
        const updateResponsePromise = this.page.waitForResponse(response => response.url().includes(`${this.backUrl}company/update?id=`))

        await this.page.getByRole('button', {name: 'save'}).click()
        const updateResponse = await updateResponsePromise
        expect.soft(updateResponse.status()).toEqual(302)
        await expect.soft(this.page.locator('.box-title')).toHaveText(companyName)
    }


}
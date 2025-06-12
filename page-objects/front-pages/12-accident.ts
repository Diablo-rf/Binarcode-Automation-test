import { Page, expect, APIRequestContext} from "@playwright/test";
import { HelperBase} from "../helperBase";

interface AddAccidentOptions {
    driver: string
    location: string
    accidentType?: string
    date: string
    roadCondition?: string
    weatherCondition?: string
    injuries?: string
    drivingHours?: string
    fatalities?: string
    hazmat?: string
    info?: string
    file?: string
}

export class AccidentRegisterPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request
    }

    async addAccident({
        driver, location, accidentType, date, roadCondition, weatherCondition,
        injuries, drivingHours, fatalities, hazmat, info, file }: AddAccidentOptions, accidentId?: string[]) {

        const accidentRow = this.page.locator('app-accident-row', { hasText: driver })
        await this.page.getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Add a new accident' })).toBeVisible()
        await this.page.getByText('add_circle_outline').click()
        await this.page.locator('app-accident-addit form').waitFor({ state: 'visible' })
        /** entity creation */
        await this.page.waitForLoadState('networkidle')
        await this.page.getByPlaceholder('select driver').click()
        await this.page.getByRole('listbox').waitFor({ state: 'attached' })
        await this.page.getByRole('option', { name: driver}).click()
        await this.page.getByRole('textbox', { name: 'Location' }).pressSequentially(location, { delay: 100 })
        await this.page.locator('.pac-item').first().waitFor({state: 'visible'})
        await this.page.locator('.pac-item').first().click()
        await this.page.getByRole('textbox', { name: 'accident type' }).fill(accidentType ? accidentType : '')
        await this.page.locator('[formcontrolname="datetime"]').pressSequentially(`${date}`, { delay: 500 })
        await this.page.locator('[formcontrolname="datetime"]').press('Tab')
        await this.page.locator('[formcontrolname="datetime"]').pressSequentially(`11:00a`, { delay: 500 })
        const expectedDate = await this.page.locator('[formcontrolname="datetime"]').textContent()
        await this.page.getByRole('textbox', { name: 'road condition' }).fill(roadCondition ? roadCondition : '')
        await this.page.getByRole('textbox', { name: 'weather condition' }).fill(weatherCondition ? weatherCondition : '')
        await this.page.locator('mat-form-field', { hasText: 'injuries' }).locator('input').fill(injuries ? injuries : '0')
        await this.page.locator('mat-form-field', { hasText: 'driving hours' }).locator('input').fill(drivingHours ? drivingHours : '')
        await this.page.locator('mat-form-field', { hasText: 'fatalities' }).locator('input').fill(fatalities ? fatalities : '0')
        await this.page.getByRole('combobox', { name: 'hazmat materials' }).click()
        await this.page.getByRole('option', { name: hazmat }).click()
        await this.page.getByRole('textbox', { name: 'info' }).fill(info ? info : '')
        if (file) {
            await this.page.locator('app-file-attachment').click()
            await this.page.locator('app-accident-file-addit').waitFor({ state: 'attached' })
            await expect.soft(this.page.locator('app-right-modal-title h3')).toHaveText(' New ')
            await this.page.getByRole('textbox', { name: 'title' }).fill('Test file title')
            await this.page.getByRole('textbox', { name: 'description' }).fill('Test file description')
            await this.page.locator('mat-expansion-panel', { hasText: 'add files' }).click()
            await this.page.locator('[type="file"]').setInputFiles(`./test_data/${file}`)
            await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
            await this.page.locator('app-accident-file-addit').getByRole('button', { name: 'save' }).click()
            await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
            await expect.soft(this.page.locator('app-notification-bar .text', { hasText: 'Accident File was created successfully!' })).toBeVisible()
            await expect(this.page.locator('app-file-attachment', { hasText: 'Test file title' })).toBeVisible()
        }
        const expectedLocation = await this.page.locator('input[name="address"]').inputValue()
        await this.page.getByRole('button', { name: 'save' }).click()

        const entityResponse = await this.page.waitForResponse(
            response => response.url() === `${this.apiUrlWeb}/accident-register/create` && response.request().method() === 'POST')
        const entityResponseBody = await entityResponse.json()
        expect.soft(entityResponse.status()).toEqual(200)
        if (entityResponse.status() === 200) accidentId?.push(entityResponseBody.data.id);

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: 'Accident was created successfully!' })).toBeVisible()
        /** Row validation */
        await expect.soft(accidentRow.locator('.location-col')).toHaveText(` ${expectedLocation} `)
        await expect.soft(accidentRow.locator('.w-20')).toHaveText(` ${date.replace(/\//g, "-")} 11:00 AM `)
        await expect.soft(accidentRow.locator('.w-10').nth(0)).toHaveText(injuries ? injuries : '0')
        await expect.soft(accidentRow.locator('.w-10').nth(1)).toHaveText(fatalities ? fatalities : '0')
        await expect.soft(accidentRow.locator('.w-10').nth(2)).toHaveText(hazmat ? hazmat : 'No')
        /** form validation */
        await accidentRow.click()
        await this.page.locator('app-accident-addit form').waitFor({ state: 'visible' })
        await expect.soft(this.page.getByPlaceholder(driver)).toBeVisible()
       
        await expect.soft(this.page.getByRole('textbox', { name: 'Location' })).toHaveValue(`${expectedLocation}`)
        await expect.soft(this.page.getByRole('textbox', { name: 'accident type' })).toHaveValue(accidentType ? accidentType : '')
        expect.soft(await this.page.locator('[formcontrolname="datetime"]').textContent()).toEqual(expectedDate)
        await expect.soft(this.page.getByRole('textbox', { name: 'road condition' })).toHaveValue(roadCondition ? roadCondition : '')
        await expect.soft(this.page.getByRole('textbox', { name: 'weather condition' })).toHaveValue(weatherCondition ? weatherCondition : '')
        await expect.soft(this.page.locator('mat-form-field', { hasText: 'injuries' }).locator('input')).toHaveValue(injuries ? injuries : '0')
        await expect.soft(this.page.locator('mat-form-field', { hasText: 'driving hours' }).locator('input')).toHaveValue(drivingHours ? drivingHours : '')
        await expect.soft(this.page.locator('mat-form-field', { hasText: 'fatalities' }).locator('input')).toHaveValue(fatalities ? fatalities : '0')
        await expect.soft(this.page.locator('[formcontrolname="hazardous_materials"] .mat-mdc-select-min-line')).toHaveText(hazmat ? hazmat : 'No')
        await expect.soft(this.page.getByRole('textbox', { name: 'info' })).toHaveValue(info ? info : '')
        if (file) await expect(this.page.locator('app-file-attachment', { hasText: 'Test file title' })).toBeVisible();
        //await this.page.getByRole('button', {name: 'cancel'}).click()
        
    }

    

}
import { Page, expect, APIRequestContext, BrowserContext, Locator} from "@playwright/test";
import { HelperBase, twoDigitDateFormat } from "../helperBase";

export class ActiveDriversPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request

    }

    async openInviteDriverModal() {
        await this.page.locator('mat-icon', { hasText: 'add_circle_outline' }).waitFor({state: 'visible'})
        await this.page.locator('mat-icon', { hasText: 'add_circle_outline' }).hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Invite a driver' })).toBeVisible()
        await this.page.locator('mat-icon', { hasText: 'add_circle_outline' }).click()
        await expect.soft(this.page.locator('.invite__header h3')).toHaveText('Invite a driver')
        await this.page.waitForTimeout(1000)

    }
    async openDriverProfile(driverCredentials: string) {
        await this.page.getByText(driverCredentials, {exact: true}).click()
        //await this.page.locator('.card__title', { hasText: driverCredentials}).click()
        await expect.soft(this.page.locator('.entity-data', { hasText: driverCredentials })).toBeVisible({timeout: 8000})

    }
    async inviteDriver(email: string, driverType: string, driverFirstName: string, driverLasttName: string, driverId?: string[]) {
        await this.page.getByRole('textbox', { name: 'first name' }).fill(driverFirstName)
        await this.page.getByRole('textbox', { name: 'last name' }).fill(driverLasttName)
        await this.page.getByRole('textbox', { name: 'email' }).fill(email)
        //await this.page.getByRole('combobox').click()
        await this.page.locator('app-invite-driver .mat-mdc-select-trigger').click()
        await this.page.locator('mat-option', {hasText: driverType}).waitFor({state: 'visible'})
        expect.soft(await this.page.getByRole('combobox', { name: 'type' }).getAttribute('aria-expanded')).toEqual('true')
        await this.page.getByRole('option', { name: driverType }).click()

        await this.page.getByRole('button', { name: 'invite' }).click()
        const responsePromise = await this.page.waitForResponse(response => response.url().includes('api.easyway.pro/v1/driver/invite') && response.request().method() === 'POST')

        const driverResponseBody = await responsePromise.json()
        expect(responsePromise.status()).toEqual(200)
        if (responsePromise.status() === 200) driverId?.push(driverResponseBody.data.id)
        
        await expect.soft(this.page.locator('app-notification-bar .text')).toHaveText(" An email was sent to your employee's email address! ")

        const driverCard = this.page.locator('mat-card .card__wrap', { hasText: driverFirstName }).filter({ hasText: driverLasttName })
        await driverCard.locator('mat-icon[color="warn"]').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'On hold. Reason - On boarding process' })).toBeVisible()
        await driverCard.locator('.avatar__status').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Pending' })).toBeVisible()
        await expect.soft(driverCard.locator('.card__subtitle div')).toHaveText(driverType)

        await driverCard.locator('.avatar__initials').click()
        await this.page.locator('.card-wrapper').waitFor({ state: 'attached' })

        const driverPanel = this.page.locator('.card-wrapper')
        await expect.soft(driverPanel.locator('.entity-name', { hasText: driverFirstName })).toBeVisible()
        await expect.soft(driverPanel.locator('.entity-name', { hasText: driverLasttName })).toBeVisible()
        await expect.soft(driverPanel.locator('.entity-subtitle')).toHaveText(driverType)
        await expect.soft(driverPanel.getByText('pending', { exact: true })).toBeVisible()
        await expect.soft(driverPanel.locator('[data-mat-icon-name="resend-email"]')).toBeVisible()
        await expect.soft(driverPanel.locator('[class="row my-2 info-row"]', { hasText: 'On hold' }).filter({ hasText: ' (On boarding process) ' })).toBeVisible()
        await expect.soft(driverPanel.locator('[class="row my-2 mat-gray info-row"]', { hasText: email })).toBeVisible()
    }

}
export class DriverProfilePage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request


    }

    async editDriverInfo(driverCredentials: string, driverAvatarFileName: string) {
        await this.page.locator('.options-button').click()
        await expect(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()

        await this.page.locator('.addit-title').waitFor({ state: 'attached' })
        await expect(this.page.locator('.addit-title')).toContainText(driverCredentials)

        if (driverAvatarFileName) {
            await this.page.locator('input[type="file"]').setInputFiles(`./test_data/${driverAvatarFileName}`)
            expect.soft(await this.page.locator('app-driver-addit app-avatar img').getAttribute('src')).toContain('data:image/')
        }

        await this.page.getByRole('textbox', { name: 'first name' }).fill('EditedFirstName')
        await this.page.getByRole('textbox', { name: 'last name' }).fill('EditedLastName')
        await this.page.getByRole('textbox', { name: 'Address' }).pressSequentially('Astoria', { delay: 100 })
        await this.page.locator('.pac-item').first().waitFor({state: 'visible'})
        await this.page.locator('.pac-item').first().click()
        await expect(this.page.getByRole('textbox', { name: 'zip code' })).toHaveValue('97103')
        await this.page.getByRole('textbox', { name: 'apt' }).fill('118')
        await this.page.getByRole('textbox', { name: 'email' }).fill('edited.email@gmail.com')
        await this.page.getByPlaceholder('(201) 555-0123').first().fill('(201) 555-0155')
        await this.page.getByRole('combobox', { name: 'cdl' }).pressSequentially('alaska', { delay: 100 })
        await this.page.getByRole('option').first().waitFor({state: 'visible'})
        await this.page.getByRole('option').first().click()
        await this.page.getByRole('textbox', { name: 'cdl number' }).fill('TE1234567')

        await this.page.locator('[formcontrolname="cdl_issue_date"]').click()
        await expect(this.page.locator('.mat-calendar ')).toBeVisible()
        await this.page.getByRole('gridcell', { name: '2024' }).click()
        await this.page.getByRole('gridcell', { name: 'Aug' }).click()
        await this.page.locator('button span:text-is("11")').click()

        await this.page.getByRole('combobox', { name: 'gender' }).click()
        await this.page.getByRole('option', { name: 'female' }).click()

        await this.page.locator('[formcontrolname="birth_date"]').click()
        await expect(this.page.locator('.mat-calendar ')).toBeVisible()
        await this.page.getByRole('gridcell', { name: '2000' }).click()
        await this.page.getByRole('gridcell', { name: 'Dec' }).click()
        await this.page.locator('button span:text-is("2")').click()

        await this.page.getByRole('combobox', { name: 'role' }).click()
        await this.page.getByRole('option', { name: 'company driver' }).click()

        await this.page.getByRole('combobox', { name: 'dispatcher' }).click()
        await this.page.getByRole('option', { name: 'dispatcher' }).first().click()
        const selectedDispatcher = await this.page.getByRole('combobox', { name: 'dispatcher' }).textContent() || ''

        await this.page.getByRole('combobox', { name: 'truck' }).click()
        await this.page.getByRole('option', { name: 'truck' }).first().click()
        const selectedTruck = await this.page.getByRole('combobox', { name: 'truck' }).textContent() || ''

        await this.page.getByRole('combobox', { name: 'trailer' }).click()
        await this.page.getByRole('option', { name: 'trailer' }).first().click()
        const selectedTrailer = await this.page.getByRole('combobox', { name: 'trailer' }).textContent() || ''


        await this.page.getByRole('combobox', { name: 'drug' }).click()
        await this.page.getByRole('option', { name: 'yes' }).click()

        await this.page.locator('[formcontrolname="hire_date"]').click()
        await expect(this.page.locator('.mat-calendar ')).toBeVisible()
        await this.page.getByRole('button', { name: 'choose' }).click()
        await this.page.getByRole('gridcell', { name: '2024' }).click()
        await this.page.getByRole('gridcell', { name: 'Jan' }).click()
        await this.page.locator('button span:text-is("24")').click()

        await this.page.getByRole('textbox', { name: 'ssn' }).fill('SSN123456')
        await this.page.getByRole('textbox', { name: 'medical' }).fill('Doctor Strange')
        await this.page.getByRole('textbox', { name: 'registry' }).fill('REG123456')
        await this.page.getByRole('textbox', { name: 'emergency' }).fill('Andrei')
        await this.page.getByPlaceholder('(201) 555-0123').nth(1).fill('(201) 555-0155')
        await this.page.getByRole('textbox', { name: 'other' }).fill('This is a driver edit test')
        await this.page.getByRole('button', { name: 'save' }).click()
        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect(this.page.locator('app-notification-bar .text', { hasText: ' The driver was updated successfully! ' })).toBeVisible()
        
        if (driverAvatarFileName)
            expect.soft(await this.page.locator('app-profile-info app-avatar img').getAttribute('src')).toContain(driverAvatarFileName);
        
        //this.page.reload() // to be removed after the bug with the dispatcher is fixed

        await this.page.locator('.options-button').click({ timeout: 30000 })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()
        await expect.soft(this.page.locator('.addit-title', { hasText: 'EditedFirstName EditedLastName' })).toBeVisible()

        expect.soft(await this.page.locator('app-driver-addit app-avatar img').getAttribute('src')).toContain(driverAvatarFileName)
        await expect.soft(this.page.getByRole('textbox', { name: 'first name' })).toHaveValue('EditedFirstName')
        await expect.soft(this.page.getByRole('textbox', { name: 'last name' })).toHaveValue('EditedLastName')
        await expect.soft(this.page.getByRole('textbox', { name: 'Address' })).toHaveValue('Astoria, OR 97103, USA')
        await expect.soft(this.page.getByRole('textbox', { name: 'zip code' })).toHaveValue('97103')
        await expect.soft(this.page.getByRole('textbox', { name: 'apt' })).toHaveValue('118')
        await expect.soft(this.page.getByRole('textbox', { name: 'email' })).toHaveValue('edited.email@gmail.com')
        await expect.soft(this.page.getByPlaceholder('(201) 555-0123').first()).toHaveValue('(201) 555-0155')
        await expect.soft(this.page.getByRole('combobox', { name: 'cdl' })).toHaveValue('Alaska')
        await expect.soft(this.page.getByRole('textbox', { name: 'cdl number' })).toHaveValue('TE1234567')
        await expect.soft(this.page.locator('[formcontrolname="cdl_issue_date"]')).toHaveValue('Sunday, Aug 11, 2024')
        await expect.soft(this.page.getByRole('combobox', { name: 'gender' })).toHaveText('Female')
        await expect.soft(this.page.locator('[formcontrolname="birth_date"]')).toHaveValue('Saturday, Dec 2, 2000')
        await expect.soft(this.page.getByRole('combobox', { name: 'role' })).toHaveText('Company driver')
        await expect.soft(this.page.getByRole('combobox', { name: 'dispatcher' })).toHaveText(selectedDispatcher)
        await expect.soft(this.page.getByRole('combobox', { name: 'truck' })).toHaveText(selectedTruck)
        await expect.soft(this.page.getByRole('combobox', { name: 'trailer' })).toHaveText(selectedTrailer)
        await expect.soft(this.page.getByRole('combobox', { name: 'drug' })).toHaveText('Yes')
        await expect.soft(this.page.locator('[formcontrolname="hire_date"]')).toHaveValue('Wednesday, Jan 24, 2024')
        await expect.soft(this.page.getByRole('textbox', { name: 'ssn' })).toHaveValue('SSN123456')
        await expect.soft(this.page.getByRole('textbox', { name: 'medical' })).toHaveValue('Doctor Strange')
        await expect.soft(this.page.getByRole('textbox', { name: 'registry' })).toHaveValue('REG123456')
        await expect.soft(this.page.getByRole('textbox', { name: 'emergency' })).toHaveValue('Andrei')
        await expect.soft(this.page.getByPlaceholder('(201) 555-0123').first()).toHaveValue('(201) 555-0155')
        await expect.soft(this.page.getByRole('textbox', { name: 'other' })).toHaveValue('This is a driver edit test')

        await this.page.locator('button.close').click()

    }
    async disableOnHold(driverCredentials: string) {
        expect.soft(this.page.locator('.info-row', { hasText: 'on hold' }).getByRole('switch', { checked: true })).toBeTruthy()
        await expect.soft(this.page.locator('.info-row', { hasText: 'on hold (on boarding process)' })).toBeVisible()

        this.page.locator('.info-row', { hasText: 'on hold' }).getByRole('switch', { checked: true }).click()

        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' On hold was disabled successfully! ' })).toBeVisible()
        expect.soft(this.page.locator('.info-row', { hasText: 'on hold' }).getByRole('switch', { checked: false })).toBeTruthy()
        await expect.soft(this.page.locator('.info-row', { hasText: '(on boarding process)' })).not.toBeVisible()

        await this.page.locator('.options-button').click()
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()
        await expect.soft(this.page.getByRole('combobox', { name: 'hold' })).toHaveText('No')
        await this.page.locator('button.close').click()

        await this.page.locator('a i.ew-driver').click()
        await expect.soft(this.page.locator('app-header .breadcrumbs__item', { hasText: 'Drivers' })).toBeVisible()
        await this.page.locator('app-driver-card-item', { hasText: driverCredentials }).waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-driver-card-item', { hasText: driverCredentials }).locator('mat-icon[color="warn"]')).not.toBeVisible()

    }
    async enableOnHold(driverCredentials: string) {
        const switchState = await this.page.locator('.info-row', { hasText: 'on hold' }).getByRole('switch').getAttribute('aria-checked')
        if (switchState === 'true') {
            this.page.locator('.info-row', { hasText: 'on hold' }).getByRole('switch', { checked: true }).click()
            await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' On hold was disabled successfully! ' })).toBeVisible()
        }
        await this.page.locator('.info-row', { hasText: 'on hold' }).getByRole('switch', { checked: false }).click()
        await expect.soft(this.page.locator('.modal-dialog__content', { hasText: 'Are you sure you want to activate on hold driver ' })).toBeVisible()
        await this.page.getByRole('textbox').fill('automation test')
        await this.page.getByRole('button', { name: 'confirm' }).click()

        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' On hold was activated successfully! ' })).toBeVisible()
        expect.soft(this.page.locator('.info-row', { hasText: 'on hold' }).getByRole('switch', { checked: true })).toBeTruthy()
        await expect.soft(this.page.locator('.info-row', { hasText: 'on hold (automation test)' })).toBeVisible()

        await this.page.locator('.options-button').click()
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()
        await expect.soft(this.page.getByRole('combobox', { name: 'hold' })).toHaveText('Yes')
        await this.page.locator('button.close').click()

        await this.page.locator('a i.ew-driver').click()
        await expect.soft(this.page.locator('app-header .breadcrumbs__item', { hasText: 'Drivers' })).toBeVisible()
        await this.page.locator('app-driver-card-item', { hasText: driverCredentials }).waitFor({ state: 'attached' })
        await this.page.locator('app-driver-card-item', { hasText: driverCredentials }).locator('mat-icon[color="warn"]').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'On hold. Reason - automation test' })).toBeVisible()
    }
    async assignTruckToTheDriver(driverCredentials: string) {
        expect.soft(this.page.locator('.info-row', { hasText: 'No Truck' })).toBeVisible()
        await this.page.locator('.icon-truck').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface')).toHaveText('Assign truck to the driver')
        await this.page.locator('.icon-truck').click()
        await this.page.locator('app-driver-addit').waitFor({state: 'visible'})
        await expect.soft(this.page.getByRole('listbox')).toBeVisible()
        await this.page.getByRole('option', { name: 'truck' }).first().click()
        const selectedTruck = await this.page.getByRole('combobox', { name: 'truck' }).textContent() || ''
        await expect.soft(this.page.getByRole('combobox', { name: 'truck' })).toHaveText(selectedTruck)

        await this.page.getByRole('button', { name: 'save' }).click()
        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' The driver was updated successfully! ' })).toBeVisible()

        await this.page.locator('.icon-truck').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface')).toHaveText('Open Truck')
        const unitNumber = selectedTruck.replace(/\D+/g, '')
        expect.soft(this.page.locator('.info-row', { hasText: 'unit' })).toHaveText(` UNIT ${unitNumber} `)

        await this.page.locator('a i.ew-driver').click()
        await expect.soft(this.page.locator('app-header .breadcrumbs__item', { hasText: 'Drivers' })).toBeVisible()
        await this.page.locator('app-driver-card-item', { hasText: driverCredentials }).waitFor({ state: 'attached' })
        await this.page.locator('app-driver-card-item', { hasText: driverCredentials }).locator('.icon-truck').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Open Truck' })).toHaveText(`Open Truck ${unitNumber}`)
    }
    async assignTrailerToTheDriver(driverCredentials: string) {
        expect.soft(this.page.locator('.info-row', { hasText: 'No Trailer' })).toBeVisible()
        await this.page.locator('.icon-trailer').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface')).toHaveText('Assign trailer to the driver')
        await this.page.locator('.icon-trailer').click()
        await this.page.locator('app-driver-addit').waitFor({state: 'visible'})
        await expect.soft(this.page.getByRole('listbox')).toBeVisible()
        await this.page.getByRole('option', { name: 'trailer' }).first().click()
        const selectedTruck = await this.page.getByRole('combobox', { name: 'trailer' }).textContent() || ''
        await expect.soft(this.page.getByRole('combobox', { name: 'trailer' })).toHaveText(selectedTruck)

        await this.page.getByRole('button', { name: 'save' }).click()
        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' The driver was updated successfully! ' })).toBeVisible()

        await this.page.locator('.icon-trailer').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface')).toHaveText('Open Trailer')
        const unitNumber = selectedTruck.replace(/\D+/g, '')
        console.log(unitNumber);
        expect.soft(this.page.locator('.info-row', { hasText: 'unit' })).toHaveText(` UNIT ${unitNumber} `)

        await this.page.locator('a i.ew-driver').click()
        await expect.soft(this.page.locator('app-header .breadcrumbs__item', { hasText: 'Drivers' })).toBeVisible()
        await this.page.locator('app-driver-card-item', { hasText: driverCredentials }).waitFor({ state: 'attached' })
        await this.page.locator('app-driver-card-item', { hasText: driverCredentials }).locator('.icon-trailer').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Open Trailer' })).toHaveText(`Open Trailer ${unitNumber}`)
    }
    async assignDispatcherToTheDriver(driverCredentials: string) {
        await this.page.locator('.options-button').click()
        await expect(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()

        await this.page.getByRole('combobox', { name: 'dispatcher' }).click()
        await this.page.getByRole('option', { name: 'dispatcher' }).first().click()
        const selectedDispatcher = await this.page.getByRole('combobox', { name: 'dispatcher' }).textContent() || ''

        await this.page.getByRole('button', { name: 'save' }).click()
        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect(this.page.locator('app-notification-bar .text', { hasText: ' The driver was updated successfully! ' })).toBeVisible()

        await this.page.locator('a i.ew-driver').click()
        await expect(this.page.locator('app-header .breadcrumbs__item', { hasText: 'Drivers' })).toBeVisible()
        await this.page.locator('app-driver-card-item', { hasText: driverCredentials }).waitFor({ state: 'attached' })
        await this.page.locator('app-driver-card-item', { hasText: driverCredentials }).locator('.icon-dispatcher').hover()
        await expect(this.page.locator('.mdc-tooltip__surface', { hasText: 'Open Dispatcher' })).toHaveText(`Open Dispatcher ${selectedDispatcher}`)
    }
    async enableDrugAndAcoholPool(driverCredentials: string) {
        const switchState = await this.page.locator('.info-row', { hasText: 'Drug and alcohol pool' }).getByRole('switch').getAttribute('aria-checked')
        if (switchState === 'true') {
            this.page.locator('.info-row', { hasText: 'Drug and alcohol pool' }).getByRole('switch', { checked: true }).click()
            await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Driver was removed from D&A pool successfully! ' })).toBeVisible()
        }
        await this.page.locator('.info-row', { hasText: 'Drug and alcohol pool' }).getByRole('switch', { checked: false }).click()

        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Driver was added to D&A pool successfully! ' })).toBeVisible()
        expect.soft(this.page.locator('.info-row', { hasText: 'Drug and alcohol pool' }).getByRole('switch', { checked: true })).toBeTruthy()

        await this.page.locator('.options-button').click()
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()
        await expect.soft(this.page.getByRole('combobox', { name: 'Drug and Alcohol Pool' })).toHaveText('Yes')
        await this.page.locator('button.close').click()

        await this.page.locator('a em.ew-drugalcohol').click()
        await this.page.getByRole('tab', { name: 'driver pool' }).click()
        await this.page.locator('app-driver-pool-view mat-card', { hasText: driverCredentials }).waitFor({state: 'attached'})
        expect.soft(this.page.locator('app-driver-pool-view mat-card', { hasText: driverCredentials })).toBeVisible()
        expect.soft(this.page.locator('app-driver-pool-view mat-card', { hasText: driverCredentials }).getByRole('switch', { checked: true })).toBeTruthy()
    }
    async disableDrugAndAcoholPool(driverCredentials: string) {
        const switchState = await this.page.locator('.info-row', { hasText: 'Drug and alcohol pool' }).getByRole('switch').getAttribute('aria-checked')
        if (switchState === 'false') {
            this.page.locator('.info-row', { hasText: 'Drug and alcohol pool' }).getByRole('switch', { checked: false }).click()
            await expect(this.page.locator('app-notification-bar .text', { hasText: ' Driver was added to D&A pool successfully! ' })).toBeVisible()
        }
        await this.page.locator('.info-row', { hasText: 'Drug and alcohol pool' }).getByRole('switch', { checked: true }).click()

        await expect(this.page.locator('app-notification-bar .text', { hasText: ' Driver was removed from D&A pool successfully! ' })).toBeVisible()
        expect(this.page.locator('.info-row', { hasText: 'Drug and alcohol pool' }).getByRole('switch', { checked: false })).toBeTruthy()

        await this.page.locator('.options-button').click()
        await expect(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()
        await expect(this.page.getByRole('combobox', { name: 'Drug and Alcohol Pool' })).toHaveText('No')
        await this.page.locator('button.close').click()

        await this.page.locator('a em.ew-drugalcohol').click()
        await this.page.getByRole('tab', { name: 'driver pool' }).click()
        await this.page.locator('app-driver-pool-view mat-card', { hasText: driverCredentials }).waitFor({state: 'attached'})
        expect.soft(this.page.locator('app-driver-pool-view mat-card', { hasText: driverCredentials })).toBeVisible()
        expect.soft(this.page.locator('app-driver-pool-view mat-card', { hasText: driverCredentials }).getByRole('switch', { checked: false })).toBeTruthy()
    }

    async generateReport(reportType: string, expectedPrice: string) {
        const reportPanel = this.page.locator('.surround-border', { hasText: `${reportType}` })
        await reportPanel.getByRole('button', { name: 'Generate' }).click()
        await expect.soft(this.page.locator('.modal-dialog__title', { hasText: `${reportType}` })).toBeVisible()
        await expect.soft(this.page.locator('mat-dialog-content b').nth(1)).toHaveText(`Price: ${expectedPrice}$`)
        const modalText = await this.page.locator('.modal-dialog__content').allTextContents()

        if (modalText[0].includes('This payment will be processed automatically')) {
            const responsePromise = this.page.waitForResponse(response => response.url() === `${this.apiUrlWeb}/${reportType}-info/create` && response.request().method() === 'POST', { timeout: 60000 })
            await this.page.getByRole('button', { name: 'confirm' }).click()
            const reportResponse = await responsePromise
            const reportBody = await reportResponse.json()
            expect(reportResponse.status()).toEqual(200)
            await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' This payment request will be automatically accepted and paid! ' })).toBeVisible()
            await this.page.reload()
            console.log('reportbody '+ reportBody.data);

            return reportBody.data
        } else {
            /**
             * @Todo Write the flow of the manual payment
             */
        }

        if (reportType === 'psp') {
            await reportPanel.locator('mat-icon', { hasText: ' remove_red_eye ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Preview' })).toBeVisible()
            await reportPanel.locator('mat-icon', { hasText: ' download ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Download' })).toBeVisible()
            await reportPanel.locator('mat-icon', { hasText: ' autorenew ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Renew Report' })).toBeVisible()
        } else {
            await reportPanel.locator('mat-icon', { hasText: ' autorenew ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Renew Report' })).toBeVisible()
            await reportPanel.locator('mat-icon', { hasText: ' print ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Preview' })).toBeVisible()

        }

    }
    async renewReport(reportType: string, expectedPrice: string, driverCredentials: string) {
        const reportPanel = this.page.locator('.surround-border', { hasText: `${reportType}` })
        await reportPanel.locator('mat-icon', { hasText: 'autorenew' }).click()
        await expect.soft(this.page.locator('.modal-dialog__title', { hasText: `${reportType}` })).toBeVisible()
        await expect.soft(this.page.locator('mat-dialog-content b').nth(1)).toHaveText(`Price: ${expectedPrice}$`)
        const modalText = await this.page.locator('.modal-dialog__content').allTextContents()


        if (modalText[0].includes('This payment will be processed automatically')) {
            const responsePromise = this.page.waitForResponse(response => response.url() === `${this.apiUrlWeb}/${reportType}-info/create?company_ids=124` && response.request().method() === 'POST', { timeout: 60000 })
            await this.page.getByRole('button', { name: 'confirm' }).click()
            const pspResponse = await responsePromise
            expect(pspResponse.status()).toEqual(200)
            await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' This payment request will be automatically accepted and paid! ' })).toBeVisible()
            await this.page.reload()
            await expect.soft(this.page.locator('.entity-data', { hasText: driverCredentials })).toBeVisible({timeout: 8000})

        } else {
            /**
             * @Todo Write the flow of the manual payment
             */
        }
        if (reportType === 'psp') {
            await reportPanel.locator('mat-icon', { hasText: ' remove_red_eye ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Preview' })).toBeVisible()
            await reportPanel.locator('mat-icon', { hasText: ' download ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Download' })).toBeVisible()
            await reportPanel.locator('mat-icon', { hasText: ' autorenew ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Renew Report' })).toBeVisible()
        } else {
            await reportPanel.locator('mat-icon', { hasText: ' autorenew ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Renew Report' })).toBeVisible()
            await reportPanel.locator('mat-icon', { hasText: ' print ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Preview' })).toBeVisible()

        }
    }
    async downloadReport(reportName: string, fileName: string) {
        const pspPanel = this.page.locator('.surround-border', { hasText: reportName })
        const downloadEvent = this.page.waitForEvent('download')
        await pspPanel.locator('mat-icon', { hasText: ' download ' }).click()
        const download = await downloadEvent
        await download.saveAs('./downloads/' + fileName)
    }
    async openReportPrintPage(reportType: string, browserContext: BrowserContext) {
        const context = browserContext

        const reportPanel = this.page.locator('.surround-border', { hasText: `${reportType}` })
        await reportPanel.locator('mat-icon', { hasText: ' print ' }).click()
        await expect(this.page.locator('.html-container tbody tr', { hasText: ' Name: DOE, JOHN SSSSSSS ' })).toBeVisible()
        const printPagePromise = context.waitForEvent('page');
        this.page.locator('mat-dialog-container mat-icon', { hasText: ' print ' }).click()
        const printPage = await printPagePromise;
        await expect(printPage.locator('tbody tr', { hasText: 'Name: DOE, JOHN SSSSSSS' })).toBeVisible()
        await this.page.locator('mat-dialog-container [type="button"]').click()

    }
}

interface CreateDocumentOptions {
    folderTitle?: string;
    docTitle: string;
    switchOption?: number;
    daysFromCurrentDate?: number;
    addFilesFileName?: string;
    addEwTemplateName?: string;
    description?: string;
}

export class DriverDocumentsTab extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request

    }

    tooltip(text: string) {
        return this.page.locator('.mdc-tooltip__surface', { hasText: text })
    }

    async createVisibleToDriverDoc(daysFromCurrentDate: number) {
        await this.page.getByLabel('Documents').getByText('add_circle_outline').click()
        await this.page.getByRole('menuitem', { name: 'Add new item' }).click()
        expect(this.page.locator('.right-modal__title span', { hasText: 'Document' })).toBeVisible()
        await this.page.getByRole('textbox', { name: 'Title' }).fill('Visible to driver doc test')
        await this.page.getByRole('switch', { name: 'Visible to driver' }).click()

        expect(this.page.locator('[formcontrolname="visible_to_driver"]').getByRole('switch', { checked: true })).toBeTruthy()
        expect(this.page.locator('mat-error').first()).toHaveText(' One of these fields is required ')
        expect(this.page.locator('mat-error').nth(1)).toHaveText(' One of these fields is required ')

        await this.page.locator('[formcontrolname="expire_at"]').click()
        await expect(this.page.locator('.mat-calendar ')).toBeVisible()
        const expirationDate = await this.selectDaysFromCurrentDate(daysFromCurrentDate, true, 'expire_at')
        //console.log(expirationDate)
        await this.page.locator('mat-expansion-panel', { hasText: 'add files' }).click()
        await this.page.locator('[type="file"]').setInputFiles('./test_data/two_page_pdf.pdf')
        await expect(this.page.locator('app-file-icon')).toBeAttached()
        await this.page.getByRole('textbox', { name: 'description' }).fill('Automation test description')
        await this.page.getByRole('button', { name: 'Save' }).click()
        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect(this.page.locator('app-notification-bar .text', { hasText: ' Document was created successfully! ' })).toBeVisible()

        const docRow = this.page.locator('app-document-row', { hasText: 'Visible to driver doc test' })

        await this.page.locator('app-document-row', { hasText: 'Visible to driver doc test' }).getByText('Visible to driver doc test').hover()
        await expect(this.page.locator('mat-tooltip-component', { hasText: 'Visible to driver doc test' })).toBeVisible()
        await expect(docRow.locator('.file-number-container span')).toHaveText('1')
        await expect(docRow.locator('mat-icon', { hasText: 'attach_file' })).toBeVisible()
        await expect(docRow.locator('.doc_expiration')).toHaveText(` EXPIRES IN 5 DAY(S) `)
        await expect(docRow.locator('mat-icon', { hasText: 'folder_shared' })).toBeVisible()
        await docRow.locator('mat-icon', { hasText: 'folder_shared' }).hover()
        await expect(this.page.locator('.mdc-tooltip__surface', { hasText: 'Shared with driver' })).toBeVisible()
        await expect(docRow.locator('.doc-uploaded__time')).toHaveText('Expire Soon')

        await docRow.click()
        await this.page.locator('app-document-view .right-modal__body').waitFor({ state: 'visible' })
        await expect(this.page.locator('app-right-modal-title h3 span')).toHaveText(' Visible to driver doc test ')
        await expect(this.page.locator('app-file .file__info div')).toHaveText(' two_page_pdf.pdf ')
        await expect(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
        await expect(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        await expect(this.page.locator('.right-modal__label-value')).toHaveText(expirationDate)
        await expect(this.page.locator('.right-modal__description-value')).toHaveText('Automation test description')
        await this.page.locator('.close').click()

        return docRow.getAttribute('id')

    }
    async createDocument({
        folderTitle,
        docTitle,
        switchOption,
        daysFromCurrentDate,
        addFilesFileName,
        addEwTemplateName,
        description,
    }: CreateDocumentOptions, documentId?: string[]) {
        const redstyleAttributeColor = 'color: rgb(232, 44, 63);'
        const orangestyleAttributeColor = 'color: rgb(255, 173, 32);'

        const switchTitle = switchOption == 1 ? 'Visible to driver'
            : switchOption == 2 ? 'Need to be filled and signed'
                : switchOption == 3 ? 'Invite driver to upload' : undefined

        await this.page.getByLabel('Documents').getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Add new item' })).toBeVisible()
        await this.page.getByLabel('Documents').getByText('add_circle_outline').click()
        await this.page.getByRole('menuitem', { name: 'Add new item' }).click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Document' })).toBeVisible()
        await this.page.getByRole('textbox', { name: 'Title' }).fill(docTitle)


        if (switchOption) {
            await this.page.getByRole('switch', { name: switchTitle }).click()

            const formControlName = switchOption == 1 ? 'visible_to_driver'
                : switchOption == 2 ? 'driver_to_fill_and_sign'
                    : switchOption == 3 ? 'driver_to_upload' : undefined

            if (switchOption == 1 || switchOption == 2) {
                expect.soft(this.page.locator('mat-error', {hasText: ' One of these fields is required '}).first()).toBeVisible()
                await this.page.locator('mat-error', {hasText: ' One of these fields is required '}).nth(1).waitFor({state: 'visible'})
                expect.soft(this.page.locator('mat-error', {hasText: ' One of these fields is required '}).nth(1)).toBeVisible()
            }
            expect.soft(this.page.locator(`[formcontrolname="${formControlName}"]`).getByRole('switch', { checked: true })).toBeTruthy()
        }

        let expirationDate = ''
        if (daysFromCurrentDate !== undefined) {
            await this.page.locator('[formcontrolname="expire_at"]').click()
            await expect.soft(this.page.locator('.mat-calendar ')).toBeVisible()
            expirationDate = await this.selectDaysFromCurrentDate(daysFromCurrentDate, true, 'expire_at')

        }

        if (addFilesFileName) {
            await this.page.locator('mat-expansion-panel', { hasText: 'add files' }).click()
            await this.page.locator('[type="file"]').setInputFiles(`./test_data/${addFilesFileName}.pdf`)
            await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
        } else if (addEwTemplateName) {
            await this.page.locator('mat-expansion-panel', { hasText: 'add easy way template' }).click()
            expect.soft(await this.page.locator('mat-expansion-panel', { hasText: 'add easy way template' }).locator('mat-expansion-panel-header').getAttribute('aria-expanded')).toEqual('true')
            await this.page.locator('.document-templates-item', { hasText: addEwTemplateName }).locator('.check-icon').click()
        }

        if (description) {
            await this.page.getByRole('textbox', { name: 'description' }).fill(description)
        }

        await this.page.getByRole('button', { name: 'Save' }).click()
        const responsePromise = await this.page.waitForResponse(response => response.url() === `${this.apiUrlWeb}/document/create` && response.request().method() === 'POST')
        const entityResponseBody = await responsePromise.json()
        expect.soft(responsePromise.status()).toEqual(200)
        if (responsePromise.status() === 200) documentId?.push(entityResponseBody.data.id);

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Document was created successfully! ' })).toBeVisible()

        const docRow = this.page.locator('app-document-row', { hasText: docTitle })

        await docRow.getByText(docTitle).hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: docTitle })).toBeVisible()

        const fileIcon = addFilesFileName || addEwTemplateName || switchOption != 3
        
        if (fileIcon)
            await expect.soft(docRow.locator('.file-number-container span')).toHaveText('1')
        await expect.soft(docRow.locator('mat-icon', { hasText: fileIcon ? 'attach_file' : 'help_outline' })).toBeVisible()

        const docExpiration = docRow.locator('.doc_expiration')
        if (daysFromCurrentDate !== undefined) {
            if (daysFromCurrentDate == 0) {
                await expect.soft(docExpiration).toHaveText(` EXPIRE TODAY `)
                expect.soft(await docExpiration.getAttribute('style')).toEqual(redstyleAttributeColor)
            } else if (daysFromCurrentDate < 4) {
                await expect.soft(docExpiration).toHaveText(` EXPIRES IN ${(daysFromCurrentDate ?? 0).toString()} DAY(S) `)
                expect.soft(await docExpiration.getAttribute('style')).toEqual(redstyleAttributeColor)
            } else if (daysFromCurrentDate < 29) {
                await expect.soft(docExpiration).toHaveText(` EXPIRES IN ${(daysFromCurrentDate ?? 0).toString()} DAY(S) `)
                expect.soft(await docExpiration.getAttribute('style')).toEqual(orangestyleAttributeColor)
            }
        }
        const docUploadedTime = docRow.locator('.doc-uploaded__time')
        if (switchTitle === 'Visible to driver') {
            await expect.soft(docRow.locator('mat-icon', { hasText: 'folder_shared' })).toBeVisible()
            await docRow.locator('mat-icon', { hasText: 'folder_shared' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Shared with driver' })).toBeVisible()
            if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 4) {
                await expect.soft(docUploadedTime).toHaveText('Expire Soon')
                expect.soft(await docUploadedTime.getAttribute('style')).toEqual(redstyleAttributeColor)
            } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 31) {
                await expect.soft(docUploadedTime).toHaveText('Expire Soon')
                expect.soft(await docUploadedTime.getAttribute('style')).toEqual(orangestyleAttributeColor)
            } else {
                await expect.soft(docUploadedTime).toHaveText('Complied')
            }
        } else if (switchTitle === 'Need to be filled and signed') {
            await expect.soft(docUploadedTime).toHaveText('Waiting for driver to fill and sign')
        } else if (switchTitle === 'Invite driver to upload') {
            await expect.soft(docUploadedTime).toHaveText('Waiting for driver to upload')
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 4) {
            await expect.soft(docUploadedTime).toHaveText('Expire Soon')
            expect.soft(await docUploadedTime.getAttribute('style')).toEqual(redstyleAttributeColor)
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 31) {
            await expect.soft(docUploadedTime).toHaveText('Expire Soon')
            expect.soft(await docUploadedTime.getAttribute('style')).toEqual(orangestyleAttributeColor)
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate > 30) {
            await expect.soft(docUploadedTime).toHaveText('Complied')
        } else if (!addFilesFileName || !addEwTemplateName) {
            await expect.soft(docUploadedTime).toHaveText('No file')
        }


        await docRow.click()
        await this.page.locator('.right-modal').waitFor({ state: 'visible' })
        await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(` ${docTitle} `)

        if (switchTitle !== 'Invite driver to upload') {
            if (addFilesFileName) {
                await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addFilesFileName}.pdf `)
                await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
                await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
            } else if (addEwTemplateName) {
                await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addEwTemplateName}.pdf `)
                await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
                await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
            }
        }

        if (switchTitle === 'Need to be filled and signed') {
            await expect.soft(this.page.locator('.right-modal__status span')).toHaveText('WAITING TO FILL AND SIGN BY DRIVER')
        } else if (switchTitle === 'Invite driver to upload') {
            await expect.soft(this.page.locator('.right-modal__status span')).toHaveText('WAITING FOR AN UPLOAD FROM DRIVER')
        }

        if (daysFromCurrentDate !== undefined) {
            await expect.soft(this.page.locator('.right-modal__label-value')).toHaveText(` ${expirationDate} `)
        }

        if (description) {
            await expect.soft(this.page.locator('.right-modal__description-value', { hasText: description })).toBeVisible()
        }

        await this.page.locator('.close').click()

    }
    /**
     * 
     * @param docTitle 
     * @param uploadedFileName 
     * @param switchOption 1 = 'Need to be filled and signed' 2 = 'Invite driver to upload'
     */
    async denyDriverDocument(docTitle: string, uploadedFileName: string, switchOption: number) {
        const docRow = this.page.locator('app-document-row', { hasText: docTitle })
        await expect.soft(docRow.locator('.file-number-container span')).toHaveText('1')
        await expect.soft(docRow.locator('mat-icon', { hasText: 'attach_file' })).toBeVisible()
        await expect.soft(docRow.locator('.doc-uploaded__time')).toHaveText('Waiting for operator approval')
        await docRow.click()

        await this.page.locator('.right-modal').waitFor({ state: 'visible' })
        await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${uploadedFileName} `)
        await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
        await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        await this.page.getByRole('button', { name: 'deny' }).click()
        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ` The ${docTitle} document has been rejected! ` })).toBeVisible()
        await this.page.locator('.right-modal__status').waitFor({ state: 'visible' })
        await expect.soft(this.page.locator('.right-modal__status span')).toHaveText(switchOption === 1 ? 'WAITING TO FILL AND SIGN BY DRIVER' : 'WAITING FOR AN UPLOAD FROM DRIVER')
        await this.page.locator('.close').click()

        await expect.soft(docRow.locator('mat-icon', { hasText: 'help_outline' })).toBeVisible()
        await expect.soft(docRow.locator('.doc-uploaded__time')).toHaveText(switchOption === 1? 'Waiting for driver to fill and sign' : 'Waiting for driver to upload')

    }
    async approveDriverDocument(docTitle: string, uploadedFileName: string) {
        const docRow = this.page.locator('app-document-row', { hasText: docTitle })
        await expect.soft(docRow.locator('.file-number-container span')).toHaveText('1')
        await expect.soft(docRow.locator('mat-icon', { hasText: 'attach_file' })).toBeVisible()
        await expect.soft(docRow.locator('.doc-uploaded__time')).toHaveText('Waiting for operator approval')
        await docRow.click()

        await this.page.locator('.right-modal').waitFor({ state: 'visible' })
        await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${uploadedFileName} `)
        await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
        await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        await this.page.getByRole('button', { name: 'approve' }).click()
        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ` The ${docTitle} document has been approved! ` })).toBeVisible()
        await this.page.locator('app-file').waitFor({ state: 'visible' })
        await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${uploadedFileName} `)
        await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
        await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        await expect.soft(this.page.getByRole('button', { name: 'edit' })).toBeVisible()
        await this.page.locator('.close').click()

        await expect.soft(docRow.locator('.file-number-container span')).toHaveText('1')
        await expect.soft(docRow.locator('mat-icon', { hasText: 'attach_file' })).toBeVisible()
        await expect.soft(docRow.locator('.doc-uploaded__time')).toHaveText('Complied')
    }

    async createDocumentFolder(docFolderTitle: string, folderId?: string[]) {
        await this.page.getByLabel('Documents').getByText('add_circle_outline').click()
        await this.page.getByRole('menuitem', { name: 'New Folder' }).click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Folder' })).toBeVisible()
        await this.page.getByRole('textbox', { name: 'Title' }).fill(docFolderTitle)
        await this.page.getByRole('button', { name: 'Save' }).click()
        
        const responsePromise = await this.page.waitForResponse(response => response.url() === `${this.apiUrlWeb}/document-folder/create` && response.request().method() === 'POST')
        const entityResponseBody = await responsePromise.json()
        expect.soft(responsePromise.status()).toEqual(200)
        
        if (responsePromise.status() === 200) folderId?.push(entityResponseBody.data.id)

        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ` Folder was created successfully! ` })).toBeVisible()
        await this.page.locator('app-notification-bar .close-btn').click()
        const docFolderRow = this.page.locator('app-document-folder-row', { hasText: docFolderTitle })
        await docFolderRow.getByText(docFolderTitle).hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: docFolderTitle })).toBeVisible()
        await expect(docFolderRow.locator('.number-of-docs')).toHaveText(' no files ')
    }

    async checkFolderStatusAndTooltip(
        statusText: string,
        folderColor: string,
        docUploadedTime: Locator,
        folderStatus: Locator,
        docColor?: string,
    ) {
        await expect.soft(docUploadedTime).toHaveText(statusText)
        if (docColor) {
            expect.soft(await docUploadedTime.getAttribute('style')).toEqual(docColor)
        }
        await expect.soft(folderStatus).toHaveText(` 1 `)
        expect.soft(await folderStatus.getAttribute('style')).toEqual(`background-${folderColor}`)
        await folderStatus.hover()
        await expect.soft(this.tooltip(statusText)).toBeVisible()
    }
    async createDocumentInFolder({
        folderTitle,
        docTitle,
        switchOption,
        daysFromCurrentDate,
        addFilesFileName,
        addEwTemplateName,
        description,
    }: CreateDocumentOptions, documentId?: string[]) {
        const docColors = {
            red: 'color: rgb(232, 44, 63);',
            orange: 'color: rgb(255, 173, 32);',
            green: 'color: rgb(72, 200, 118);',
            blue: 'color: rgb(120, 185, 228);',
            ocean: 'color: rgb(86, 168, 221);',
            grey: 'color: rgb(218, 218, 218);',

        }

        const switchTitle = switchOption == 1 ? 'Visible to driver'
            : switchOption == 2 ? 'Need to be filled and signed'
                : switchOption == 3 ? 'Invite driver to upload' : undefined

        const docFolderRow = this.page.locator('app-document-folder-row', { hasText: folderTitle })
        await docFolderRow.click()
        expect.soft(await docFolderRow.locator('mat-expansion-panel-header').getAttribute('aria-expanded')).toEqual('true')

        await docFolderRow.getByText('Add file').click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Document' })).toBeVisible()
        await this.page.getByRole('textbox', { name: 'Title' }).fill(docTitle)


        if (switchOption) {
            await this.page.getByRole('switch', { name: switchTitle }).click()

            const formControlName = switchOption == 1 ? 'visible_to_driver'
                : switchOption == 2 ? 'driver_to_fill_and_sign'
                    : switchOption == 3 ? 'driver_to_upload' : undefined

            if (switchOption == 1 || switchOption == 2) {
                expect.soft(this.page.locator('mat-error').first()).toHaveText(' One of these fields is required ')
                expect.soft(this.page.locator('mat-error').nth(1)).toHaveText(' One of these fields is required ')
            }
            expect.soft(this.page.locator(`[formcontrolname="${formControlName}"]`).getByRole('switch', { checked: true })).toBeTruthy()
        }
        let expirationDate = ''
        if (daysFromCurrentDate !== undefined) {
            await this.page.locator('[formcontrolname="expire_at"]').click()
            await expect.soft(this.page.locator('.mat-calendar ')).toBeVisible()
            expirationDate = await this.selectDaysFromCurrentDate(daysFromCurrentDate, true, 'expire_at')

        }
        if (addFilesFileName) {
            await this.page.locator('mat-expansion-panel', { hasText: 'add files' }).click()
            await this.page.locator('[type="file"]').setInputFiles(`./test_data/${addFilesFileName}.pdf`)
            await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
        } else if (addEwTemplateName) {
            await this.page.locator('mat-expansion-panel', { hasText: 'add easy way template' }).click()
            expect.soft(await this.page.locator('mat-expansion-panel', { hasText: 'add easy way template' }).locator('mat-expansion-panel-header').getAttribute('aria-expanded')).toEqual('true')
            await this.page.locator('.document-templates-item', { hasText: addEwTemplateName }).locator('.check-icon').click()
        }
        if (description) {
            await this.page.getByRole('textbox', { name: 'description' }).fill(description)
        }
        await this.page.getByRole('button', { name: 'Save' }).click()
        const responsePromise = await this.page.waitForResponse(response => response.url() === `${this.apiUrlWeb}/document/create` && response.request().method() === 'POST')
        const entityResponseBody = await responsePromise.json()
        expect.soft(responsePromise.status()).toEqual(200)
        
        if (responsePromise.status() === 200) documentId?.push(entityResponseBody.data.id);
        // After SAVE

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Document was created successfully! ' })).toBeVisible()
        
        await this.page.locator('app-document-row', {hasText: docTitle}).waitFor({ state: 'attached' })
        const numberOfFiles = await docFolderRow.locator('app-document-row').count()
        await expect.soft(docFolderRow.locator('.number-of-docs')).toHaveText(` ${numberOfFiles} files `)
        const docRow = docFolderRow.locator('app-document-row', { hasText: docTitle })
        await docRow.getByText(docTitle).hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: docTitle })).toBeVisible()

        const fileIcon = addFilesFileName || addEwTemplateName || switchOption != 3
        if (fileIcon)
            await expect.soft(docRow.locator('.file-number-container span')).toHaveText('1')
        await expect.soft(docRow.locator('mat-icon', { hasText: fileIcon ? 'attach_file' : 'help_outline' })).toBeVisible()

        const docExpiration = docRow.locator('.doc_expiration')
        if (daysFromCurrentDate !== undefined) {
            if (daysFromCurrentDate == 0) {
                await expect.soft(docExpiration).toHaveText(` EXPIRE TODAY `)
                expect.soft(await docExpiration.getAttribute('style')).toEqual(docColors.red)
            } else if (daysFromCurrentDate < 4) {
                await expect.soft(docExpiration).toHaveText(` EXPIRES IN ${(daysFromCurrentDate ?? 0).toString()} DAY(S) `)
                expect.soft(await docExpiration.getAttribute('style')).toEqual(docColors.red)
            } else if (daysFromCurrentDate < 29) {
                await expect.soft(docExpiration).toHaveText(` EXPIRES IN ${(daysFromCurrentDate ?? 0).toString()} DAY(S) `)
                expect.soft(await docExpiration.getAttribute('style')).toEqual(docColors.orange)
            }
        }
        const folderStatus = docFolderRow.locator('mat-expansion-panel-header .status-circle')
        const docUploadedTime = docRow.locator('.doc-uploaded__time')

        if (switchTitle === 'Visible to driver') {
            await expect.soft(docRow.locator('mat-icon', { hasText: 'folder_shared' })).toBeVisible()
            await docRow.locator('mat-icon', { hasText: 'folder_shared' }).hover()
            await expect.soft(this.tooltip('Shared with driver')).toBeVisible()
            if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 4) {
                await this.checkFolderStatusAndTooltip('Expire Soon', docColors.red, docUploadedTime, folderStatus, docColors.red)
            } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 31) {
                await this.checkFolderStatusAndTooltip('Expire Soon', docColors.orange, docUploadedTime, folderStatus, docColors.orange)
            } else {
                await this.checkFolderStatusAndTooltip('Complied', docColors.green, docUploadedTime, folderStatus)
            }

        } else if (switchTitle === 'Need to be filled and signed') {
            await this.checkFolderStatusAndTooltip('Waiting for driver to fill and sign', docColors.ocean, docUploadedTime, folderStatus)
        } else if (switchTitle === 'Invite driver to upload') {
            await this.checkFolderStatusAndTooltip('Waiting for driver to upload', docColors.blue, docUploadedTime, folderStatus)
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 4) {
            await this.checkFolderStatusAndTooltip('Expire Soon', docColors.red, docUploadedTime, folderStatus, docColors.red)
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 31) {
            await this.checkFolderStatusAndTooltip('Expire Soon', docColors.orange, docUploadedTime, folderStatus, docColors.orange)
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate > 30) {
            await this.checkFolderStatusAndTooltip('Complied', docColors.green, docUploadedTime, folderStatus)
        } else if (!addFilesFileName || !addEwTemplateName) {
            await this.checkFolderStatusAndTooltip('No file', docColors.grey, docUploadedTime, folderStatus)
        }

        await docRow.click()
        await this.page.locator('.right-modal').waitFor({ state: 'visible' })
        await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(` ${docTitle} `)

        if (switchTitle !== 'Invite driver to upload') {
            if (addFilesFileName) {
                await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addFilesFileName}.pdf `)
                await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
                await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
            } else if (addEwTemplateName) {
                await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addEwTemplateName}.pdf `)
                await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
                await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
            }

        }

        if (switchTitle === 'Need to be filled and signed') {
            await expect.soft(this.page.locator('.right-modal__status span')).toHaveText('WAITING TO FILL AND SIGN BY DRIVER')
        } else if (switchTitle === 'Invite driver to upload') {
            await expect.soft(this.page.locator('.right-modal__status span')).toHaveText('WAITING FOR AN UPLOAD FROM DRIVER')
        }

        if (daysFromCurrentDate !== undefined) {
            await expect.soft(this.page.locator('.right-modal__label-value')).toHaveText(` ${expirationDate} `)
        }

        if (description) {
            await expect.soft(this.page.locator('.right-modal__description-value', { hasText: description })).toBeVisible()
        }

        await this.page.locator('.close').click()
    }

}

interface CreateChecklistItemOptions {
    checklistTitle: string;
    checklistItemTitle: string;
    proof?: boolean;
    addFilesFileName?: string;
    description?: string;
}

export class DriverChecklistTab extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request

    }

    async createChecklist(checklistTitle: string, daysFromCurrentDate?: number, checklistId?: string[]) {
        const checklistColors = {
            red: 'color: rgb(232, 44, 63);',
            orange: 'color: rgb(255, 173, 32);',
        }

        await this.page.getByLabel('Checklist').getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Add Checklist' })).toBeVisible()
        await this.page.getByLabel('Checklist').getByText('add_circle_outline').click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'New Checklist' })).toBeVisible()
        await this.page.getByRole('textbox', { name: 'Title' }).fill(checklistTitle)

        let expirationDate = ''
        if (daysFromCurrentDate !== undefined) {
            await this.page.locator('[formcontrolname="expire_at"]').click()
            await expect.soft(this.page.locator('.mat-calendar ')).toBeVisible()
            expirationDate = await this.selectDaysFromCurrentDate(daysFromCurrentDate, true, 'expire_at')
        }
        await this.page.getByRole('button', { name: 'SAVE' }).click()
        const checklistResponse = await this.page.waitForResponse(response => response.url().includes(`${this.apiUrlWeb}/checklist/view?id=`) && response.request().method() === 'GET')
        const checklistResponseBody = await checklistResponse.json()
        expect(checklistResponse.status()).toEqual(200)
        if (checklistResponse.status() === 200) checklistId?.push(checklistResponseBody.data.id);

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Checklist was created successfully! ' })).toBeVisible()

        const checklistFolderRow = this.page.locator('app-checklist-row', { hasText: checklistTitle })
        await checklistFolderRow.getByText(checklistTitle).hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: checklistTitle })).toBeVisible()
        await expect.soft(checklistFolderRow.locator('.number-of-checklist-item')).toHaveText(' 0 Items ')
        await expect.soft(checklistFolderRow.locator('.check__created')).toHaveText(` Created ${await this.currentDate('-')} `)
        await checklistFolderRow.locator('.color-purple-200').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Assign to the driver in the mobile app' })).toBeVisible()

        const docExpiration = checklistFolderRow.locator('.status')
        if (daysFromCurrentDate !== undefined) {
            if (daysFromCurrentDate == 0) {
                await expect.soft(docExpiration).toHaveText(` Expire Today `)
                expect.soft(await docExpiration.getAttribute('style')).toEqual(checklistColors.red)
            } else if (daysFromCurrentDate < 16) {
                await expect.soft(docExpiration).toHaveText(` Due date: ${expirationDate} `)
                expect.soft(await docExpiration.getAttribute('style')).toEqual(checklistColors.orange)
            }
        }
    }
    async assignChecklistToDriverByIcon(checklistTitle: string) {

        const checklistFolderRow = this.page.locator('app-checklist-row', { hasText: checklistTitle })
        await checklistFolderRow.locator('.color-purple-200').click()
        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Checklist was assigned successfully! ' })).toBeVisible()
        await checklistFolderRow.locator('.color-purple-400').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Cancel driver assignment in the mobile app' })).toBeVisible()

        await this.page.locator('app-checklist-row', { hasText: 'automation' }).locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'open' }).click()

        await this.page.locator('.right-modal').waitFor({ state: 'visible' })
        await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(` ${checklistTitle} `)
        await expect.soft(this.page.locator('.right-modal__body div', { hasText: 'Assignee to the driver in the mobile app:' }).locator('span').nth(1)).toHaveText('Yes')
        await expect.soft(this.page.getByRole('button', { name: 'EDIT' })).toBeVisible()
        await this.page.locator('.close').click()
    }
    async addChecklistItem({ checklistTitle, checklistItemTitle, proof, addFilesFileName, description }: CreateChecklistItemOptions) {
        const checklistFolderRow = this.page.locator('app-checklist-row', { hasText: checklistTitle })
        await checklistFolderRow.click()
        expect.soft(await checklistFolderRow.locator('mat-expansion-panel-header').getAttribute('aria-expanded')).toEqual('true')
        await checklistFolderRow.getByText('Add Field').click()

        await this.page.getByRole('textbox', { name: 'Title' }).fill(checklistItemTitle)

        if (proof) {
            await this.page.getByRole('checkbox').check()
        }
        if (addFilesFileName) {
            await this.page.locator('mat-expansion-panel', { hasText: 'add files' }).click()
            await this.page.locator('[type="file"]').setInputFiles(`./test_data/${addFilesFileName}.pdf`)
            await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
        }
        if (description) {
            await this.page.getByRole('textbox', { name: 'description' }).fill(description)
        }

        await this.page.getByRole('button', { name: 'SAVE' }).click()
        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Checklist item was created successfully! ' })).toBeVisible()


        const checklistItemRow = checklistFolderRow.locator('app-checklist-item-row', { hasText: checklistItemTitle })
        await checklistFolderRow.locator('.check__title').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: checklistItemTitle })).toBeVisible()
        const numberOfItems = await checklistFolderRow.locator('app-checklist-item-row').count()
        await expect.soft(checklistFolderRow.locator('.number-of-checklist-item')).toHaveText(` ${numberOfItems} Items `)
        await expect.soft(checklistFolderRow.locator('[class="mat-mdc-tooltip-trigger status-circle"]')).toHaveText(` ${numberOfItems} `)

        if (proof) {
            await expect.soft(checklistItemRow.locator('.request_proof_status')).toHaveText(' Need proof ')
        }
        await checklistItemRow.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'open' }).click()
        await expect.soft(this.page.locator('.right-modal__body div.mb-3')).toHaveText(proof ? ' Request Driver Proof: yes ' : ' Request Driver Proof: no ')
        if (addFilesFileName) {
            await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addFilesFileName}.pdf `)
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' inventory_2 ' })).toBeVisible()
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        }
        if (description) {
            await expect.soft(this.page.locator('.right-modal__description-value')).toHaveText(description)
        }
        await expect.soft(this.page.getByRole('button', { name: 'EDIT' })).toBeVisible()
        await this.page.locator('.close').click()

        return await checklistItemRow.getAttribute('id')

    }

    async checkChecklistItemByCheckbox({ checklistTitle, checklistItemTitle, proof, addFilesFileName }: CreateChecklistItemOptions) {
        const checklistFolderRow = this.page.locator('app-checklist-row', { hasText: checklistTitle })
        const checklistItemRow = checklistFolderRow.locator('app-checklist-item-row', { hasText: checklistItemTitle })

        await checklistItemRow.getByRole('checkbox').click()
        await expect.soft(this.page.locator('mat-dialog-container h1', { hasText: 'Check item as DONE' })).toBeVisible()
        if (proof) {
            await expect.soft(this.page.locator('mat-dialog-content').first()).toHaveText(` The ${checklistItemTitle} checklist item requires some proof file. Before checking it as DONE you have to upload a proof file! `)
            await expect.soft(this.page.locator('mat-dialog-content').nth(1)).toHaveText("The already uploaded files can't serve as proof.")
            await this.page.getByRole('button', { name: 'upload proof file' }).click()

            await this.page.locator('app-checklist-item-addit .right-modal__body').waitFor({ state: 'visible' })
            await expect(this.page.locator('app-right-modal-title h3 span')).toHaveText(checklistItemTitle)
            await this.page.locator('[type="file"]').setInputFiles(`./test_data/${addFilesFileName}.pdf`)
            await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
            await this.page.locator('.right-modal').getByRole('button', { name: 'check' }).click()

        } else {
            /**@Todo */
        }
        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Checklist item was checked successfully! ' })).toBeVisible()
        await expect.soft(checklistItemRow.getByRole('checkbox')).toBeChecked()
        const totalCheckboxes = await checklistFolderRow.locator('app-checklist-item-row').count()
        const checkedCheckboxes = await checklistFolderRow.locator('app-checklist-item-row .mdc-checkbox--selected').count()
        const uncheckedCheckboxes = await checklistFolderRow.locator('app-checklist-item-row [class="mdc-checkbox__native-control"]').count()

        if (checkedCheckboxes == totalCheckboxes) {
            await expect.soft(checklistFolderRow.locator('.status')).toHaveText(' All items checked ')
            expect.soft(await checklistFolderRow.locator('.status').getAttribute('style')).toEqual('color: rgb(72, 200, 118);')
        } else {
            if (uncheckedCheckboxes) {
                await expect.soft(checklistFolderRow.locator('.status-circle[style="background-color: rgb(218, 218, 218);"]')).toHaveText(` ${uncheckedCheckboxes} `)
            }
            await expect.soft(checklistFolderRow.locator('.status-circle[style="background-color: rgb(72, 200, 118);"]')).toHaveText(` ${uncheckedCheckboxes} `)
        }

        await checklistFolderRow.locator('.check__title').hover()
        await checklistItemRow.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'open' }).click()
        await expect.soft(this.page.locator('.right-modal__body div.mb-3')).toHaveText(proof ? ' Request Driver Proof: yes ' : ' Request Driver Proof: no ')
        if (addFilesFileName) {
            await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addFilesFileName}.pdf `)
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' inventory_2 ' })).toBeVisible()
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        }
        await expect.soft(this.page.getByRole('button', { name: 'EDIT' })).toBeVisible()
        await this.page.locator('.close').click()
    }
    async uncheckChecklistItemByCheckbox({ checklistTitle, checklistItemTitle }: CreateChecklistItemOptions) {
        const checklistFolderRow = this.page.locator('app-checklist-row', { hasText: checklistTitle })
        const checklistItemRow = checklistFolderRow.locator('app-checklist-item-row', { hasText: checklistItemTitle })

        await checklistItemRow.getByRole('checkbox').click()
        await expect.soft(this.page.locator('mat-dialog-container h1', { hasText: 'Uncheck item' })).toBeVisible()
        await expect.soft(this.page.locator('mat-dialog-content').first()).toHaveText(` Are you sure you want to uncheck the ${checklistItemTitle} checklist item? `)
        await this.page.getByRole('button', { name: 'uncheck' }).click()

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Checklist item was unchecked successfully! ' })).toBeVisible()
        await expect.soft(checklistItemRow.getByRole('checkbox')).not.toBeChecked()

        const checkedCheckboxes = await checklistFolderRow.locator('app-checklist-item-row .mdc-checkbox--selected').count()
        const uncheckedCheckboxes = await checklistFolderRow.locator('app-checklist-item-row [class="mdc-checkbox__native-control"]').count()

        if (checkedCheckboxes) {
            await expect.soft(checklistFolderRow.locator('.status')).toHaveText(` ${checkedCheckboxes} `)
            expect.soft(await checklistFolderRow.locator('.status').getAttribute('style')).toEqual('color: rgb(72, 200, 118);')
        } else {
            if (uncheckedCheckboxes) {
                await expect.soft(checklistFolderRow.locator('.status-circle[style="background-color: rgb(218, 218, 218);"]')).toHaveText(` ${uncheckedCheckboxes} `)
            }
        }

    }


}

interface CreatePreviousEmployerOptions {
    companyName: string
    address: string
    startDate: number
    endDate: number
    phoneNumber?: string
    position?: string
    fax?: string
    email?: string
    leavingReason?: string
}
interface CreateAttemptOptions {
    companyName: string
    phoneNumber?: boolean
    email?: boolean
    fax?: boolean
    requestDate: number
    addFilesName?: string
    description?: string
}

export class PreviousEmployerTab extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request

    }

    async addEmployer({ companyName, address, startDate, endDate, phoneNumber, position, fax, email, leavingReason }: CreatePreviousEmployerOptions) {
        await this.page.getByLabel('Previous Employer').getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'add employer' })).toBeVisible()
        await this.page.getByLabel('Previous Employer').getByText('add_circle_outline').click()
        await this.page.locator('app-previous-employer-list form').waitFor({ state: 'attached' })

        await this.page.getByRole('textbox', { name: 'company name' }).fill(companyName)
        await this.page.getByRole('textbox', { name: 'Address' }).pressSequentially(address, { delay: 100 })
        await this.page.locator('.pac-item').first().waitFor({state: 'visible'})
        await this.page.locator('.pac-item').first().click()

        await this.page.locator('[formcontrolname="start_date"]').click()
        await expect.soft(this.page.locator('.mat-calendar ')).toBeVisible()
        const expectedStartDate = await this.selectDaysFromCurrentDate(startDate, false, 'start_date')

        await this.page.locator('[formcontrolname="end_date"]').click()
        await expect.soft(this.page.locator('.mat-calendar ')).toBeVisible()
        const expectedEndDate = await this.selectDaysFromCurrentDate(endDate, false, 'end_date')

        if (phoneNumber)
            await this.page.getByPlaceholder('(201) 555-0123').fill(phoneNumber)
        if (position)
            await this.page.getByRole('textbox', { name: 'position' }).fill(position)
        if (fax)
            await this.page.getByRole('textbox', { name: 'fax' }).fill(fax)
        if (email)
            await this.page.getByRole('textbox', { name: 'email' }).fill(email)
        if (leavingReason)
            await this.page.getByRole('textbox', { name: 'leaving reason' }).fill(leavingReason)

        await this.page.getByRole('button', { name: 'SAVE' }).click()
        const employerResponse = await this.page.waitForResponse(response => response.url().includes(`${this.apiUrlWeb}/previous-employer/create`) && response.request().method() === 'POST')
        const employerResponseBody = await employerResponse.json()
        expect(employerResponse.status()).toEqual(200)

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: 'Employer was created successfully!' })).toBeVisible()
        await expect.soft(this.page.locator('.profile-info__status-chip').locator('app-status-chip .mat-mdc-tooltip-trigger span', {hasText: 'PROGRESS'})).toBeVisible()

        const employerPanel = this.page.locator('mat-expansion-panel', { hasText: companyName })
        await employerPanel.locator('.folder__info').click()
        expect.soft(await employerPanel.locator('mat-expansion-panel-header').getAttribute('aria-expanded')).toEqual('true')
        await employerPanel.locator('form').waitFor({ state: 'attached' })

        await expect.soft(employerPanel.getByRole('textbox', { name: 'company name' })).toHaveValue(companyName)
        expect.soft(await employerPanel.getByRole('textbox', { name: 'address' }).inputValue()).toContain(address)
        expect.soft(await employerPanel.locator('[formcontrolname="start_date"]').inputValue()).toContain(expectedStartDate)
        expect.soft(await employerPanel.locator('[formcontrolname="end_date"]').inputValue()).toContain(expectedEndDate)

        if (phoneNumber)
            await expect.soft(employerPanel.getByPlaceholder('(201) 555-0123')).toHaveValue(phoneNumber)
        if (position)
            await expect.soft(employerPanel.getByRole('textbox', { name: 'position' })).toHaveValue(position)
        if (fax)
            await expect.soft(employerPanel.getByRole('textbox', { name: 'fax' })).toHaveValue(fax)
        if (email)
            await expect.soft(employerPanel.getByRole('textbox', { name: 'email' })).toHaveValue(email)
        if (leavingReason)
            await expect.soft(employerPanel.getByRole('textbox', { name: 'leaving reason' })).toHaveValue(leavingReason)

        await employerPanel.locator('.folder__info').click()
        await employerPanel.locator('form').waitFor({ state: 'detached' })
        expect.soft(await employerPanel.locator('mat-expansion-panel-header').getAttribute('aria-expanded')).toEqual('false')


        return employerResponseBody.data.id

    }
    async setDiverAsVerified(setVerified: boolean, employerRecords: boolean) {
        await expect.soft(this.page.locator('.profile-info__status-chip').locator('app-status-chip .mat-mdc-tooltip-trigger')).toHaveText(!setVerified ? 'DONE' : employerRecords ? 'PROGRESS' : 'PENDING')
        await this.page.locator('.mdc-checkbox__native-control').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: setVerified ? 'done' : 'in progress' })).toBeVisible()

        if (setVerified) {
            await expect.soft(this.page.getByRole('checkbox')).not.toBeChecked()
            this.page.getByRole('checkbox').click()
            await expect.soft(this.page.getByRole('checkbox')).toBeChecked()


        } else {
            await expect.soft(this.page.getByRole('checkbox')).toBeChecked()
            this.page.getByRole('checkbox').click()
            await expect.soft(this.page.getByRole('checkbox')).not.toBeChecked()
        }

        await expect.soft(this.page.locator('.profile-info__status-chip').locator('app-status-chip .mat-mdc-tooltip-trigger')).toHaveText(setVerified ? 'DONE' : employerRecords ? 'PROGRESS' : 'PENDING')
        await this.page.getByLabel('Previous Employer').getByText('add_circle_outline').hover()
        await this.page.locator('.mdc-checkbox__native-control').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: setVerified ? 'in progress' : 'done' })).toBeVisible()
    }
    async createAttempt({ companyName, phoneNumber, email, fax, requestDate, addFilesName, description }: CreateAttemptOptions) {
        const employerPanel = this.page.locator('mat-expansion-panel', { hasText: companyName })
        await employerPanel.locator('.folder__info').click()
        expect.soft(await employerPanel.locator('mat-expansion-panel-header').getAttribute('aria-expanded')).toEqual('true')
        await employerPanel.locator('form').waitFor({ state: 'attached' })

        await this.page.locator('app-add-new-card', { hasText: 'add new' }).hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Add new' })).toBeVisible()
        await this.page.locator('app-add-new-card', { hasText: 'add new' }).click()

        const attemptModal = this.page.locator('app-previous-employer-attempt-addit')
        const expectedAttemptNumber = await this.page.locator('.title-status__attempt').count() + 1
        await expect.soft(attemptModal.locator('app-right-modal-title h3 span')).toHaveText(`Attempt ${expectedAttemptNumber}`)
        if (phoneNumber)
            await this.page.getByRole('checkbox', { name: 'phone number' }).check()
        if (email)
            await this.page.getByRole('checkbox', { name: 'email' }).check()
        if (fax)
            await this.page.getByRole('checkbox', { name: 'fax' }).check()

        await this.page.locator('[formcontrolname="request_at"]').click()
        await expect.soft(this.page.locator('.mat-calendar ')).toBeVisible()
        const expectedRequestDate = await this.selectDaysFromCurrentDate(requestDate, false, 'request_at')

        if (addFilesName) {
            await this.page.locator('mat-expansion-panel', { hasText: 'add files' }).click()
            await this.page.locator('[type="file"]').setInputFiles(`./test_data/${addFilesName}.pdf`)
            await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
        }

        if (description)
            await this.page.getByRole('textbox', { name: 'description' }).fill(description)

        await attemptModal.getByRole('button', { name: 'save' }).click()
        const attemptResponse = await this.page.waitForResponse(response => response.url().includes(`${this.apiUrlWeb}/previous-employer-attempt/create`) && response.request().method() === 'POST')
        const attemptResponseBody = await attemptResponse.json()
        expect(attemptResponse.status()).toEqual(200)

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: 'Employer Attempt was created successfully!' })).toBeVisible()
        await expect.soft(this.page.locator('mat-card', { hasText: `Attempt ${expectedAttemptNumber}` }).locator('.title-status__status')).toHaveText('Pending')

        await this.page.locator('mat-card', { hasText: `Attempt ${expectedAttemptNumber}` }).click()
        await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(`Attempt ${expectedAttemptNumber}`)

        if (addFilesName) {
            await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addFilesName}.pdf `)
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' inventory_2 ' })).toBeVisible()
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        }
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'created' }).locator('.right-modal__label-value')).toHaveText(` ${expectedRequestDate} `)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'phone number' }).locator('.right-modal__label-value')).toHaveText(phoneNumber ? ' Yes ' : ' No ')
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'email' }).locator('.right-modal__label-value')).toHaveText(email ? ' Yes ' : ' No ')
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'fax' }).locator('.right-modal__label-value')).toHaveText(fax ? ' Yes ' : ' No ')
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'status' }).locator('.right-modal__label-value')).toHaveText(' Pending ')
        if (description)
            await expect.soft(this.page.locator('.right-modal__label', { hasText: 'description' }).locator('.right-modal__label-value')).toHaveText(description)

        await this.page.getByText('close').click()

        return `Attempt ${expectedAttemptNumber}`
        //return attemptResponseBody.data.id
    }

    async setAttemptStatus(attemptValue: string, success: boolean) {
        await this.page.locator('mat-card', { hasText: attemptValue }).click()
        await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(attemptValue)
        await this.page.getByRole('button', { name: 'Edit' }).click()
        await this.page.locator('mat-radio-group').waitFor({ state: 'attached' })
        await this.page.getByRole('radio', { name: success ? 'Success' : 'Failure' }).click()
        await this.page.locator('app-previous-employer-attempt-addit').getByRole('button', { name: 'Save' }).click()

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: 'Employer Attempt was updated successfully!' })).toBeVisible()
        await expect.soft(this.page.locator('mat-card', { hasText: attemptValue }).locator('.title-status__status')).toHaveText(success ? 'Success' : 'Failed')

        await this.page.locator('mat-card', { hasText: attemptValue }).click()
        await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(attemptValue)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'status' }).locator('.right-modal__label-value')).toHaveText(success ? ' Success ' : ' Failure ')
        await expect.soft(this.page.getByRole('button', { name: 'Edit' })).not.toBeVisible()
        await this.page.getByText('close').click()


    }

}

interface CreateInspection {
    title: string
    state?: string
    date: number
    level?: string
    authority?: string
    addFilesName?: string
    clean?: boolean
    oos?: boolean
}
interface AddViolation {
    inspectionTitle: string
    violationTitle?: string
    severity?: string
    solved?: boolean
    addFilesName?: string
}

export class RoadsideInspectionsTab extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request

    }

    async createInspection({ title, state, date, level, authority, addFilesName, clean, oos }: CreateInspection, inspectionId?: string[]) {
        /** Creation part */
        const inspectionRow = this.page.locator('app-inspection-row', { hasText: title })
        const onHoldToggleLocator = this.page.locator('.info-row', { hasText: 'on hold' }).locator('mat-slide-toggle')
        const onHoldToggle = await onHoldToggleLocator.getAttribute('class').then(classes => classes?.includes('mat-mdc-slide-toggle-checked') || false)
        await this.page.getByLabel('Roadside inspection').getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Add new inspection' })).toBeVisible()
        await this.page.getByLabel('Roadside inspection').getByText('add_circle_outline').click()

        await expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Roadside Inspection' })).toBeVisible()
        await this.page.getByRole('textbox', { name: 'Roadside Inspection' }).fill(title)

        if(state) {
            await this.page.getByRole('combobox', {name: 'state'}).click()
            await this.page.getByRole('listbox').waitFor({state: 'attached'})
            expect.soft(await this.page.locator('[formcontrolname="state_id"]').getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', {name: state, exact: true}).click({force: true})
        }

        await this.page.locator('[formcontrolname="issue_date"]').click()
        await expect.soft(this.page.locator('.mat-calendar ')).toBeVisible()
        const expectedInspectionDate = await this.selectDaysFromCurrentDate(date, false, 'issue_date')

        if (level) {
            await this.page.getByRole('combobox', { name: 'level' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'level' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: level }).click()
        }
        if (authority) {
            await this.page.getByRole('combobox', { name: 'Authority' }).click()
            await this.page.getByLabel('dropdown search').pressSequentially(authority, { delay: 100 })
            await this.page.getByRole('option').first().waitFor({state: 'visible'})
            await this.page.getByRole('option').first().click()
        }
        if (addFilesName) {
            await this.page.locator('mat-expansion-panel', { hasText: 'add files' }).click()
            await this.page.locator('[type="file"]').setInputFiles(`./test_data/${addFilesName}.pdf`)
            await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
        }
        if (clean)
            await this.page.getByRole('checkbox', { name: 'Clean' }).check()
        if (oos)
            await this.page.getByRole('checkbox', { name: 'oos' }).check()

        await expect.soft(this.page.getByText('Please save inspection for adding violations ')).toBeVisible()

        await this.page.getByRole('button', { name: 'save' }).click()

        /** Validation part 1 */
        const inspectionResponse = await this.page.waitForResponse(response => response.url().includes(`${this.apiUrlWeb}/inspection/create`) && response.request().method() === 'POST')
        const inspectionResponseBody = await inspectionResponse.json()
        expect(inspectionResponse.status()).toEqual(200)
        if (inspectionResponse.status() === 200) inspectionId?.push(inspectionResponseBody.data.id);


        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: 'Inspection was created successfully!' })).toBeVisible()

        if (!clean) {
            expect.soft(this.page.locator('.right-modal__title span', { hasText: title })).toBeVisible()

            if (addFilesName) {
                await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addFilesName}.pdf `)
                await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' delete ' })).toBeVisible()
                await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' inventory_2 ' })).toBeVisible()
                await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
                await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
            }

            await expect.soft(this.page.getByRole('textbox', { name: 'Roadside Inspection' })).toHaveValue(title)
            if (state)
                await expect.soft(this.page.locator('[formcontrolname="state_id"] .mat-mdc-select-min-line')).toHaveText(state)

            expect.soft(await this.page.locator('[formcontrolname="issue_date"]').inputValue()).toContain(expectedInspectionDate)
            if (level)
                await expect.soft(this.page.getByRole('combobox', { name: 'level' }).locator('.mat-mdc-select-min-line')).toHaveText(level)
            if (authority)
                await expect.soft(this.page.getByRole('combobox', { name: 'Authority' }).locator('.mat-mdc-select-min-line')).toContainText(authority)

            await expect.soft(this.page.getByRole('checkbox', { name: 'Clean' })).not.toBeChecked()

            if (oos) {
                await expect.soft(this.page.getByRole('checkbox', { name: 'oos' })).toBeChecked()
            } else {
                await expect.soft(this.page.getByRole('checkbox', { name: 'oos' })).not.toBeChecked()
            }

        }
        await this.page.locator('.close').click()
        /**Validation part 2 */
        if (oos && !onHoldToggle)
            await expect.soft(this.page.locator('.info-row ', { hasText: 'on hold' }).locator('i')).toHaveText(` (Due to OSS road inspection dated ${twoDigitDateFormat.replace(/(\d{2})-(\d{2})-(\d{4})/, '$1.$2.$3')} - ${title}) `)
        await expect.soft(inspectionRow.locator('.title p span')).toHaveText(` ${title} `)
        await expect.soft(inspectionRow.locator('.doc_level')).toHaveText(` Level ${level} `)
        await expect.soft(inspectionRow.locator('.doc-uploaded__time')).toHaveText('Clean')
        await expect.soft(inspectionRow.locator('.doc-uploaded__by')).toHaveText(`Issue date ${twoDigitDateFormat}`)

        await inspectionRow.locator('.doc__title').click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: title })).toBeVisible()

        if (addFilesName) {
            await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addFilesName}.pdf `)
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' inventory_2 ' })).toBeVisible()
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        }
        if (state)
            await expect.soft(this.page.locator('.right-modal__label', { hasText: 'State:' }).locator('.right-modal__label-value')).toHaveText(` ${state} `)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Date' }).locator('.right-modal__label-value')).toHaveText(` ${twoDigitDateFormat} `)
        if (level)
            await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Level' }).locator('.right-modal__label-value')).toHaveText(` ${level} `)
        if (authority)
            await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Authority' }).locator('.right-modal__label-value')).toContainText(authority)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'clean' }).locator('.right-modal__label-value')).toHaveText(clean ? ' yes ' : ' no ')
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'oos' }).locator('.right-modal__label-value')).toHaveText(oos ? ' yes ' : ' no ')
        await this.page.locator('.close').click()

        if (onHoldToggle)
        this.page.locator('.info-row', { hasText: 'on hold' }).getByRole('switch', { checked: true }).click() // unchecking the on hold

    }
    async addViolation({ inspectionTitle, violationTitle, severity, solved, addFilesName }: AddViolation) {
        /** Creation part */
        const inspectionRow = this.page.locator('app-inspection-row', { hasText: inspectionTitle })
        const violationForm = this.page.locator('.violation-form-row')
        const violationDetailsForm = this.page.locator('.lesson-form-row')

        await inspectionRow.locator('.doc__title').click()
        await expect.soft(this.page.locator('.right-modal__title span', { hasText: inspectionTitle })).toBeVisible()
        await this.page.getByRole('button', {name: 'edit'}).click()
        await this.page.locator('.right-modal__body').waitFor({state: 'attached'})
        const totalViolations = await violationForm.count()
        await this.page.getByRole('menuitem', { name: 'add violation' }).click()
        

        await expect.soft(violationForm.locator('h5')).toHaveText(` ${totalViolations + 1} . Violation `)
        await expect.soft(violationForm.locator('mat-icon', { hasText: ' delete ' })).toBeVisible()
        if (violationTitle)
            await violationForm.getByRole('textbox', { name: 'Title' }).fill(violationTitle)
        if (severity) {
            await violationForm.getByRole('combobox', { name: 'select level' }).click()
            expect.soft(await violationForm.getByRole('combobox', { name: 'select level' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: severity }).click()
        }
        if (solved) {
            await this.page.getByRole('checkbox', { name: 'Solved' }).check()

            if (addFilesName) {
                await violationForm.locator('[type="file"]').setInputFiles(`./test_data/${addFilesName}.pdf`)
                await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
            }
        }
        await this.page.getByRole('button', { name: 'save' }).click()

        /** Validation part 1 */

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: 'Inspection was updated successfully!' })).toBeVisible()

        if (!solved) {
            await expect.soft(inspectionRow.locator('.doc-uploaded__time')).toHaveText(`${totalViolations + 1} violations`)
            await expect.soft(inspectionRow.locator('.doc-uploaded__by')).toHaveText('Need to renew')
        }

        await inspectionRow.locator('.doc__title').click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: inspectionTitle })).toBeVisible()
        if (violationTitle)
            await expect.soft(violationDetailsForm.locator('.right-modal__label', { hasText: 'Violation' }).locator('.right-modal__label-value')).toHaveText(` ${violationTitle} `)
        if (severity)
            await expect.soft(violationDetailsForm.locator('.right-modal__label', { hasText: 'level' }).locator('.right-modal__label-value')).toHaveText(` ${severity} `)
        await expect.soft(this.page.locator('.lesson-form-row').locator('.right-modal__label', { hasText: ' Solved: ' }).locator('.right-modal__label-value')).toHaveText(solved ? ' Yes ' : ' No ')
        
        if (addFilesName) {
            await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addFilesName}.pdf `)
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' inventory_2 ' })).toBeVisible()
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        }

        await this.page.locator('.close').click()

    }
    async solveViolation({ inspectionTitle, solved, addFilesName }: AddViolation) {
        /** Creation part */
        const inspectionRow = this.page.locator('app-inspection-row', { hasText: inspectionTitle })
        const violationForm = this.page.locator('.violation-form-row')
        const violationDetailsForm = this.page.locator('.lesson-form-row')

        await inspectionRow.locator('.doc__title').click()
        await expect.soft(this.page.locator('.right-modal__title span', { hasText: inspectionTitle })).toBeVisible()
        await this.page.getByRole('button', {name: 'edit'}).click()
        await this.page.locator('.right-modal__body').waitFor({state: 'attached'})
        const totalViolations = await violationForm.count()
        
        if (!solved){
            await violationForm.getByRole('checkbox', { name: 'Solved' }).check()

            if (addFilesName) {
                await violationForm.locator('[type="file"]').setInputFiles(`./test_data/${addFilesName}.pdf`)
                await expect.soft(violationForm.locator('app-file-icon')).toBeAttached()
            }
        } /** @Todo if unsolved */ 

        await this.page.getByRole('button', { name: 'save' }).click()

        /** Validation part 1 */

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: 'Inspection was updated successfully!' })).toBeVisible()

        if (!solved) {
            await expect.soft(inspectionRow.locator('.doc-uploaded__time')).toHaveText('Clean')
            await expect.soft(inspectionRow.locator('.doc-uploaded__by')).toHaveText(`Issue date ${twoDigitDateFormat}`)
        } else {
            await expect.soft(inspectionRow.locator('.doc-uploaded__time')).toHaveText(`${totalViolations + 1} violations`)
            await expect.soft(inspectionRow.locator('.doc-uploaded__by')).toHaveText('Need to renew')
        }
         /** Validation part 2 */
        await inspectionRow.locator('.doc__title').click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: inspectionTitle })).toBeVisible()
        await expect.soft(violationDetailsForm.locator('.right-modal__label', { hasText: ' Solved: ' }).locator('.right-modal__label-value')).toHaveText(!solved ? ' Yes ' : ' No ')
        
        if (addFilesName) {
            await this.page.getByRole('button', {name: 'edit'}).click()
            await this.page.locator('.right-modal__body').waitFor({state: 'attached'})
            await expect.soft(violationForm.locator('app-file .file__info div')).toHaveText(` ${addFilesName}.pdf `)
            await expect.soft(violationForm.locator('app-file mat-icon', { hasText: ' delete ' })).toBeVisible()
            await expect.soft(violationForm.locator('app-file mat-icon', { hasText: ' inventory_2 ' })).toBeVisible()
            await expect.soft(violationForm.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
            await expect.soft(violationForm.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        }
        await this.page.locator('.close').click()

    }
    async setInspectionAsClean({title, clean}: CreateInspection) {
        /** Creation part */
        const inspectionRow = this.page.locator('app-inspection-row', { hasText: title })
        const violationForm = this.page.locator('.violation-form-row')

        await inspectionRow.locator('.doc__title').click()
        await this.page.locator('.right-modal__body').waitFor({state: 'attached'})
        const initialViolationsInDetails = await this.page.locator('.lesson-form-row').count()
        await this.page.getByRole('button', {name: 'edit'}).click()

        let violationsInEdit = await violationForm.count()
        await this.page.locator('.right-modal__body').waitFor({state: 'attached'})
        
        if (!clean){
            await this.page.getByRole('checkbox', { name: 'clean' }).check()
            violationsInEdit = await violationForm.count()
            expect(violationsInEdit).toEqual(0)
        } else {
            await this.page.getByRole('checkbox', { name: 'clean' }).uncheck()
            violationsInEdit = await violationForm.count()
            expect(violationsInEdit).toEqual(initialViolationsInDetails)
        }
        await this.page.getByRole('button', { name: 'save' }).click()

        /** Validation part 1 */

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: 'Inspection was updated successfully!' })).toBeVisible()

        if (!clean) {
            await expect.soft(inspectionRow.locator('.doc-uploaded__time')).toHaveText('Clean')
            await expect.soft(inspectionRow.locator('.doc-uploaded__by')).toHaveText(`Issue date ${twoDigitDateFormat}`)
        } else {
            await expect.soft(inspectionRow.locator('.doc-uploaded__time')).toHaveText(`${initialViolationsInDetails} violations`)
            await expect.soft(inspectionRow.locator('.doc-uploaded__by')).toHaveText('Need to renew')
        }
         /** Validation part 2 */
        await inspectionRow.locator('.doc__title').click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: title })).toBeVisible()
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'clean' }).locator('.right-modal__label-value')).toHaveText(!clean ? ' yes ' : ' no ')
        expect(await this.page.locator('.lesson-form-row').count()).toEqual(initialViolationsInDetails)
        
        await this.page.locator('.close').click()

    }
}

interface CreateDaTest {
    testType: string
    testReason: string
    driverCdl: string,
    driverDob: string
    locationZip: string
    locationRadius?: string
    locationName: string
    days?: number
    hours?: number
    minutes?: number
    locationInstructions?: string
    donorInstructions?: string
    expectedPrice: string
}
interface DaTestDateParams {
    locationTime: string
    days?: number
    hours?: number
    minutes?: number
}

export class DrugAndAlcoholTab extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request

    }

    async createDaTest({testType, testReason, driverCdl, driverDob, locationZip, locationRadius, locationName, days, hours, minutes, locationInstructions, donorInstructions, expectedPrice}: CreateDaTest) {
        
        await this.page.getByLabel('Drug').getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Add DA Test' })).toBeVisible()
        /** Creation part */
        await this.page.getByLabel('Drug').getByText('add_circle_outline').click()
        await expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Order Test' })).toBeVisible()
        await this.page.locator('.right-modal__body').waitFor({state: 'attached'})
      
        await this.page.getByRole('combobox', {name: 'type'}).click()
        expect.soft(await this.page.getByRole('combobox', { name: 'type' }).getAttribute('aria-expanded')).toEqual('true')
        await this.page.getByRole('option', { name: testType }).click()
        
        await this.page.getByRole('combobox', {name: 'reason'}).click()
        expect.soft(await this.page.getByRole('combobox', { name: 'reason' }).getAttribute('aria-expanded')).toEqual('true')
        await this.page.getByRole('option', { name: testReason }).click()

        await this.page.getByRole('button', {name: 'set'}).click()
        await expect.soft(this.page.locator('app-order-test-location', { hasText: 'Location search' })).toBeVisible()
        await this.page.getByRole('textbox', {name: 'zip code'}).pressSequentially(locationZip, {delay: 500})
        if(locationRadius){
            await this.page.getByRole('combobox', {name: 'radius'}).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'radius' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: '5 miles', exact: true}).click()
        }
        const locationCardName = this.page.locator('.location-card', {hasText: locationName})
        await locationCardName.click()
        expect.soft(await locationCardName.getAttribute('class').then(classes => classes?.includes('active') || false)).toBeTruthy()
        const selectedLocationName = await locationCardName.locator('.col-10').textContent() || 'location name not received'
        await this.page.getByRole('button', {name: 'save'}).click()
        await this.page.locator('.right-modal__body').waitFor({state: 'attached'})
        await expect.soft(this.page.locator('.location-display .content div').first()).toContainText(selectedLocationName)
        
        const currentLocationDate = await this.page.locator('.right-modal__body div', {hasText: 'current time'}).textContent() || ''
        
        const testDate = await this.daTestDate({
            locationTime: currentLocationDate,
            days: days,
            hours: hours,
            minutes: minutes
            
        })
   
        await this.page.locator('[formcontrolname="expiration_date_time"]').pressSequentially(`${testDate.date}`, {delay: 300})
        await this.page.locator('[formcontrolname="expiration_date_time"]').press('Tab')
        console.log(testDate.time);
        await this.page.locator('[formcontrolname="expiration_date_time"]').pressSequentially(`${testDate.time}`, {delay: 300})
        await this.page.locator('[formcontrolname="expiration_date_time"]').pressSequentially(`${testDate.format}`, {delay: 300})

        const dateValue = await this.page.locator('[formcontrolname="expiration_date_time"]').textContent()

        await this.page.locator('.right-modal').getByRole('button', {name: 'generate'}).click()

        await expect.soft(this.page.locator('.modal-dialog__title', { hasText: 'Order test' })).toBeVisible()
        await expect.soft(this.page.locator('mat-dialog-content b')).toHaveText(`Price: ${expectedPrice}$`)
        const modalText = await this.page.locator('.modal-dialog__content').allTextContents()
        const testRow = this.page.locator('mat-row', {hasText: testReason})

        if (modalText[0].includes('This payment will be processed automatically')) {
            const responsePromise = this.page.waitForResponse(response => response.url() === `${this.apiUrlWeb}/da-test/create` && response.request().method() === 'POST', { timeout: 40000 })

            await this.page.getByRole('button', { name: 'confirm' }).click()
            
            const response = await responsePromise
            expect(response.status()).toEqual(200)
            await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Order Test successfully created! ' }).first()).toBeVisible()
            await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' This payment request will be automatically accepted and paid! ' })).toBeVisible({timeout: 10000})
            /**Row validation */
            const expirationDate = ` ${testDate.date} ${testDate.timeAssertion} ${testDate.format} `
            await expect.soft(testRow.locator('.mat-column-date')).toHaveText(expirationDate)
            await expect.soft(testRow.locator('.mat-column-type')).toHaveText(` ${testType} `)
            await expect.soft(testRow.locator('.status-chip span')).toHaveText('SCHEDULED')

            await this.page.waitForTimeout(10000)
            await this.page.reload()
            await this.page.locator('[class="mat-mdc-tab-body-wrapper"]').waitFor({state: 'attached'})
            await testRow.waitFor({state: 'visible'})
            await testRow.locator('.mat-column-qpassport mat-icon', { hasText: ' remove_red_eye ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Preview' })).toBeVisible()
            await testRow.locator('.mat-column-qpassport mat-icon', { hasText: ' download ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Download' })).toBeVisible()
            /** modal validation */
            const driverFName = await this.page.locator('.entity-name').first().textContent() || ''
            const driverLName = await this.page.locator('.entity-name').nth(1).textContent() || ''
            const emailvalue = await this.page.locator('.info-row', {hasText: 'Email'}).locator('.text-right').textContent() || ''
            const driverEmail = emailvalue.replace(/\s+/g, '')
            
            await testRow.click()
            const modalResponse = await this.page.waitForResponse(response => response.url().includes(`${this.apiUrlWeb}/da-test/view?id=`) && response.request().method() === 'GET')
            expect(modalResponse.status()).toEqual(200)
            const modalResponseBody = await modalResponse.json()
            const referenceId = modalResponseBody.data.reference_test_id 

            await this.page.locator('.right-modal').waitFor({ state: 'visible' });
            await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(' Order Test ');
            await expect.soft(this.page.locator('.right-modal .status-chip span')).toHaveText('SCHEDULED')

            await expect.soft(this.page.locator('.file__info div')).toContainText('QPassport.pdf')
            this.page.locator('.right-modal mat-icon', { hasText: ' remove_red_eye ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Preview' })).toBeVisible()
            await this.page.locator('.right-modal mat-icon', { hasText: ' download ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Download' })).toBeVisible()

            await expect.soft(this.page.locator('.field-block', {hasText: 'test reason'}).locator('.value')).toHaveText(testReason)
            await expect.soft(this.page.locator('.field-block', {hasText: 'expiration date'}).locator('.right-modal__label-value')).toHaveText(expirationDate)
            await expect.soft(this.page.locator('.field-block', {hasText: locationName})).toBeVisible()
            if (locationInstructions)
                await expect.soft(this.page.locator('.field-block', {hasText: locationInstructions})).toBeVisible()      
            await expect.soft(this.page.locator('.field-block', {hasText: 'first name'}).locator('.value')).toHaveText(driverFName)
            await expect.soft(this.page.locator('.field-block', {hasText: 'last name'}).locator('.value')).toHaveText(driverLName)
            await expect.soft(this.page.locator('.field-block', {hasText: 'cdl'}).locator('.value')).toHaveText(driverCdl)
            await expect.soft(this.page.locator('.field-block', {hasText: 'date of birth'}).locator('.value')).toHaveText(driverDob)
            await expect.soft(this.page.locator('.field-block', {hasText: 'contact phone'}).locator('.value')).toHaveText('+1 (201) 555-1231')
            if (donorInstructions)
                await expect.soft(this.page.locator('.field-block', {hasText: donorInstructions})).toBeVisible()  
            await expect.soft(this.page.getByRole('button', {name: 'cancel'})).toBeVisible()
            await this.page.locator('button.close').click()
            await expect.soft(this.page.locator('button.close')).not.toBeVisible() 
            await this.page.waitForTimeout(1000)
            
            return {driverEmail: driverEmail, referenceId: referenceId}

        } else {
            /**
             * @Todo Write the flow of the manual payment
             */
        }
        
    }
    async daTestDate({ locationTime, days, hours, minutes }: DaTestDateParams) {
        
        const timePattern = /Current Time: (\d{2}-\d{2}-\d{4}) (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)/;
        const match = locationTime.match(timePattern);
        if (!match) throw new Error("Invalid time format");

        const [_, dateString, hourString, minuteString, secondString, period] = match;

        // Convert to a Date object
        const [month, day, year] = dateString.split('-').map(Number);
        let hours24 = Number(hourString);
        const minutesInt = Number(minuteString);
        const secondsInt = Number(secondString);

        // Adjust for AM/PM
        if (period === 'PM' && hours24 < 12) hours24 += 12;
        if (period === 'AM' && hours24 === 12) hours24 = 0;

        // Create a Date object
        const currentDate = new Date(year, month - 1, day, hours24, minutesInt, secondsInt);

        // Modify date and time as required
        if (days) currentDate.setDate(currentDate.getDate() + days);
        if (hours) currentDate.setHours(currentDate.getHours() + hours);
        if (minutes) currentDate.setMinutes(currentDate.getMinutes() + minutes);

        // Format the updated date as MM-DD-YYYY
        const updatedMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
        const updatedDay = String(currentDate.getDate()).padStart(2, '0');
        const updatedYear = currentDate.getFullYear();
        //const updatedDate = `${updatedMonth}/${updatedDay}/${updatedYear}`;
        const updatedDate = `${updatedMonth}-${updatedDay}-${updatedYear}`;

        // Format the updated time as HH:MM AM/PM
        let updatedHours = currentDate.getHours();
        const updatedMinutes = String(currentDate.getMinutes()).padStart(2, '0');
        const amPm = updatedHours >= 12 ? 'PM' : 'AM';
        updatedHours = updatedHours % 12 || 12; // Convert to 12-hour format

        //const updatedTime = `${updatedHours}:${updatedMinutes} ${amPm}`;
        const updatedTime = updatedHours < 10 ? `0${updatedHours}:${updatedMinutes}` : `${updatedHours}:${updatedMinutes}`;

        const [receivedHours, receivedMinutes] = updatedTime.split(':')
        const formattedHours = parseInt(receivedHours, 10).toString()
        const timeToAssert = `${formattedHours}:${receivedMinutes}`

        return { date: updatedDate, time: updatedTime, format: amPm, timeAssertion: timeToAssert };
    }

    async downloadQpassport(testReason: string, fileName: string) {
        const testRow = this.page.locator('mat-row', {hasText: testReason})
        const downloadEvent = this.page.waitForEvent('download')
        await testRow.locator('.mat-column-qpassport mat-icon', { hasText: ' download ' }).click()
        const download = await downloadEvent
        await download.saveAs('./downloads/' + fileName)
    }
    async cancelTestFromModal(testReason: string) {
        const testRow = this.page.locator('mat-row', {hasText: testReason})
        await testRow.click()
        await this.page.locator('.right-modal').waitFor({ state: 'visible' });
        await this.page.getByRole('button', {name: 'cancel'}).click()
        await expect.soft(this.page.locator('mat-dialog-container h1', {hasText: 'Order Test'})).toBeVisible()
        await expect.soft(this.page.locator('mat-dialog-container mat-dialog-content')).toHaveText('Are you sure you want to cancel this order test request?')
        await this.page.getByRole('button', {name: 'cancel'}).click()

        const cancelResponse = await this.page.waitForResponse(response => response.url().includes(`${this.apiUrlWeb}/da-test/cancel-order`) && response.request().method() === 'POST')
        expect(cancelResponse.status()).toEqual(200)
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Order Test successfully canceled! ' }).first()).toBeVisible()
        await this.page.locator('button.close').click()

        await expect.soft(testRow.locator('.status-chip span')).toHaveText('WAITING CANCEL')
        await testRow.click()
        await this.page.locator('.right-modal').waitFor({ state: 'visible' });
        await expect.soft(this.page.locator('.right-modal .status-chip span')).toHaveText('WAITING CANCEL')
        await expect.soft(this.page.getByRole('button', {name: 'cancel'})).not.toBeVisible()
        await this.page.locator('button.close').click()
        await expect.soft(this.page.locator('button.close')).not.toBeVisible() 
        await this.page.waitForTimeout(1000)
        await this.page.reload()
        await expect.soft(testRow.locator('.status-chip span')).toHaveText('CANCELED')
        
    }
    /**
     * 
     * @param referenceId 
     * @param testResult 
     * @param testStatus 
     * @param request 
     */
    async setTestStatusAndResult(referenceId: string, request: APIRequestContext, testResult: string, testStatus: string) {
        const statusColor = 
            testResult === 'POSITIVE' ? 'rgb(232, 44, 63)' 
            : testResult === 'NEGATIVE' ? 'rgb(72, 200, 118)'
            : ''
        
        const xmlBody = `
            <OrderResult>
                <ReferenceTestID>${referenceId}</ReferenceTestID>
                <OrderResultID>${testResult}</OrderResultID>
                <OrderStatusID>${testStatus}</OrderStatusID>
            </OrderResult>
            `
        const testRequest = await request.post(`${this.apiUrlWeb}/da-test/response`, {
            headers: {
                'Content-Type': 'application/xml', // Set the context type to xml
            },
            data: xmlBody
        })

        expect.soft(testRequest.status()).toEqual(200)

        await this.page.reload()
        /**row validation */
        await expect.soft(this.page.locator('mat-row .status-chip span')).toHaveText(testResult ? testResult : testStatus)
        await expect.soft(this.page.locator('mat-row .status-chip')).toHaveCSS('background-color', `${statusColor}`)

        /**modal validation */
        await this.page.locator('mat-row').click()
        await this.page.locator('.right-modal').waitFor({ state: 'visible' });
        await expect.soft(this.page.locator('.right-modal .status-chip span')).toHaveText(testResult ? testResult : testStatus)
        await expect.soft(this.page.locator('.right-modal .status-chip')).toHaveCSS('background-color', `${statusColor}`)
        await this.page.locator('button.close').click()
        await expect.soft(this.page.locator('button.close')).not.toBeVisible() 


        
    }

}
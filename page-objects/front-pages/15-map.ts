import { Page, expect, APIRequestContext, BrowserContext, Browser,} from "@playwright/test";
import { HelperBase } from "../helperBase";

export class DriversMapPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request

    }

    async checkDriverOnMapAfterCreation(driverCredentials: string){
        const initials = driverCredentials.split(' ').map(name => name.charAt(0).toUpperCase()).join('')
        await expect.soft(this.page.locator('app-avatar', {hasText: initials})).toBeVisible()
    }

    async checkDriverLocationUpdateOnMap(driverCredentials: string){
        const initials = driverCredentials.split(' ').map(name => name.charAt(0).toUpperCase()).join('')
        // const hour = updateTime.split(' ')[0]
        // const format = updateTime.split(' ')[1].toLocaleLowerCase()
        await this.page.locator('.drivers-list').waitFor({state: 'visible'})
        await this.page.locator('app-avatar', {hasText: initials}).click()
        await expect.soft(this.page.getByRole('button', {name: driverCredentials})).toBeVisible()
        await this.page.getByRole('button', {name: driverCredentials}).click()
        const driverModal = this.page.locator('map-info-window', {hasText: driverCredentials})
        await expect.soft(driverModal).toBeVisible()
        const lastUpdateValue = await driverModal.locator('.info-card__driver-last-updated', {hasText: 'last update'})
            .locator('.info-card__driver-values').textContent();
        const lastUpdateSeconds = lastUpdateValue?.split(' ')[1]
        expect(Number(lastUpdateSeconds)).toBeGreaterThan(0)
        // await expect.soft(driverModal.locator('.info-card__driver-last-updated', {hasText: 'last update'})
        //     .locator('.info-card__driver-values')).toHaveText(' Just now ')
        // const updateTime = await driverModal.locator('.info-card__driver-last-updated', {hasText: 'last update'})
        //     .locator('.info-card__driver-values').textContent()
        // console.log(updateTime);
        // const updateTimeValue = updateTime?.split(' ')[0]
        // console.log(updateTimeValue);
        // expect.soft(Number(updateTimeValue)).toBeGreaterThan(1)
    }
    async checkDriverLocationOnGoogleMaps(coordinates: string){
        const [googleMapsPage] = await Promise.all([
            this.page.waitForEvent('popup'),
            this.page.locator('map-info-window a mat-icon').click()
        ])
        await googleMapsPage.waitForLoadState('domcontentloaded')
        await googleMapsPage.locator('[class="bwoZTb fontBodyMedium"]').waitFor({state: 'visible'})
        await expect.soft(googleMapsPage.locator('[class="bwoZTb fontBodyMedium"] span')).toHaveText(coordinates)
    }
}

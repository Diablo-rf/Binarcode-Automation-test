import { APIRequestContext, Page, expect } from "@playwright/test";
import { HelperBase } from "../helperBase";
import { ur } from "@faker-js/faker";


export class BackDashboardPage extends HelperBase {

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

    async navigateTo(pageTitle: string) {
        const url: { [key: string]: string } = {
            'Companies': 'company/index',
            'Ew Services': 'ew-service/index',
            'Da Applications': 'da-application/index',
            'Suggested Trainings': 'suggested-training/index',
            'default': ''
        }
        const urlSelector = url[pageTitle] || 'default'
        await this.page.goto(`${this.backUrl}${urlSelector}`)
        await expect(this.page.locator('.box-header')).toHaveText(pageTitle)

    } 

    async navigateToCompaniesPage() {
        await this.page.goto(`${this.backUrl}company/index`)
        // await expect(this.page.locator('.lead')).toHaveText('Panoul de administrare EasyWay-stage')
        // await this.page.locator('li', { hasText: 'Entities' }).hover()
        // await expect(this.page.locator('.dropdown-menu li').filter({ hasText: 'Companies' })).toBeVisible()
        // await this.page.locator('.dropdown-menu li').filter({ hasText: 'Companies' }).click()
        await expect(this.page.locator('.box-header')).toHaveText('Companies')

    }
    async navigateToEwServicesPage() {
        await this.page.goto(`${this.backUrl}ew-service/index`)
        // await expect(this.page.locator('.lead')).toHaveText('Panoul de administrare EasyWay-stage')
        // await this.page.locator('li', { hasText: 'EW Service' }).hover()
        // await expect(this.page.locator('.dropdown-menu li').filter({ hasText: 'Ew-services' })).toBeVisible()
        // await this.page.locator('.dropdown-menu li').filter({ hasText: 'Ew-services' }).click()
        await expect(this.page.locator('.box-header')).toHaveText('Ew Services')

    }
    async navigateToDaApplicationsPage() {
        await this.page.goto(`${this.backUrl}da-application/index`)
        // await expect(this.page.locator('.lead')).toHaveText('Panoul de administrare EasyWay-stage')
        // await this.page.getByRole('link', { name: 'Tools' }).hover()
        // await expect(this.page.locator('.dropdown-menu li').filter({ hasText: 'Drug&Alcohol' })).toBeVisible()
        // await this.page.locator('.dropdown-menu li').filter({ hasText: 'Drug&Alcohol' }).hover()
        // await expect(this.page.getByText('Da-applications')).toBeVisible()
        // await this.page.getByText('Da-applications').click()
        await expect(this.page.locator('.box-header')).toHaveText('Da Applications')

    }
    async navigateToSuggestedTrainingsPage() {
        await this.page.goto(`${this.backUrl}suggested-training/index`)
        // await expect(this.page.locator('.lead')).toHaveText('Panoul de administrare EasyWay-stage')
        // await this.page.getByRole('link', { name: 'Tools' }).hover()
        // await expect(this.page.locator('.dropdown-menu li').filter({ hasText: 'Drug&Alcohol' })).toBeVisible()
        // await this.page.locator('.dropdown-menu li').filter({ hasText: 'Drug&Alcohol' }).hover()
        // await expect(this.page.getByText('Da-applications')).toBeVisible()
        // await this.page.getByText('Da-applications').click()
        await expect(this.page.locator('.box-header')).toHaveText('Suggested Trainings')

    }

}
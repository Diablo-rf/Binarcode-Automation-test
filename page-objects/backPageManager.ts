import { APIRequestContext, Browser, BrowserContextOptions, expect, Page } from "@playwright/test";
import { BackDashboardPage } from "./back-pages/01-dashboard";
import { CompaniesPage } from "./back-pages/02-companies";
import { EwServicesPage } from "./back-pages/03-ewServices";
import { DaApplicationsPage } from "./back-pages/04-daApplications";
import { SuggestedTrainingsPage } from "./back-pages/05-suggestedTrainings";

export class BackPageManager {
    readonly page: Page
    readonly browser: Browser
    readonly request: APIRequestContext
    readonly storageState: BrowserContextOptions

    readonly backUrl: string
    readonly backAuthToken: string
    readonly apiUrlWeb: string
    readonly apiUrlMobile: string
    readonly backStorageState: string

    private dashboardPage: BackDashboardPage
    private companiesPage: CompaniesPage
    private ewServicesPage: EwServicesPage
    private daApplicationPage: DaApplicationsPage
    private suggestedTrainingsPage: SuggestedTrainingsPage
    
    private createPage<T>(PageClass: new (...args: any[]) => T): T {
        return new PageClass(this.page, this.request, this.backUrl, this.backAuthToken, this.apiUrlWeb, this.apiUrlMobile);
    }

    constructor(page: Page, browser: Browser, request: APIRequestContext, backUrl: string, backStorageState: string, backAuthToken: string, apiUrlWeb: string, apiUrlMobile: string) {
        this.page = page
        this.browser = browser
        this.request = request

        this.backUrl = backUrl
        this.backAuthToken = backAuthToken
        this.apiUrlWeb = apiUrlWeb
        this.apiUrlMobile = apiUrlMobile
        this.backStorageState = backStorageState

        this.dashboardPage = this.createPage(BackDashboardPage)
        this.companiesPage = this.createPage(CompaniesPage)
        this.ewServicesPage = this.createPage(EwServicesPage)
        this.daApplicationPage = this.createPage(DaApplicationsPage)
        this.suggestedTrainingsPage = this.createPage(SuggestedTrainingsPage)
        
    }

    async loginOnBackoffice() {
        await this.page.goto(this.backUrl)
        await this.page.getByRole('textbox', { name: 'Email' }).fill(`${process.env.BACKOFFICE_EMAIL}`)
        await this.page.getByRole('textbox', { name: 'Password' }).fill(`${process.env.BACKOFFICE_PASSWORD}`)
        await this.page.getByRole('button', { name: 'sign in' }).click()
        await this.page.waitForResponse('**/site/websocket-uri')
        await expect(this.page.locator('.lead')).toHaveText('Panoul de administrare EasyWay-stage')

    }

    async setBackofficeContext() {
        const context = await this.browser.newContext({storageState: this.backStorageState})
        //console.log('back storage state: '+ this.backStorageState);
        const backofficePage = await context.newPage()
        
        this.dashboardPage.setPage(backofficePage)
        this.companiesPage.setPage(backofficePage)
        this.ewServicesPage.setPage(backofficePage)
        this.daApplicationPage.setPage(backofficePage)
        this.suggestedTrainingsPage.setPage(backofficePage)
    }

    get onDashboardPage() {
        return this.dashboardPage
    }
    get onCompaniesPage() {
        return this.companiesPage
    }
    get onEwServicesPage() {
        return this.ewServicesPage
    }
    get onDaApplicationPage() {
        return this.daApplicationPage
    }
    get onSuggestedTrainingsPage() {
        return this.suggestedTrainingsPage
    }

}
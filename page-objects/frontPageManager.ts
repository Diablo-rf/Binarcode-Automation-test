import { APIRequestContext, Browser, BrowserContextOptions, expect, Page } from "@playwright/test";
import { LoginPage } from './front-pages/01-loginPage'
import { CompanyCreationPage } from "./front-pages/02-companyCreationPage";
import { SetPasswordPage } from "./front-pages/03-setPasswordPage";
import { DashboardPage } from "./front-pages/04-dashboard";
import { ActiveDriversPage, DriverChecklistTab, DriverDocumentsTab, DriverProfilePage, DrugAndAlcoholTab, PreviousEmployerTab, RoadsideInspectionsTab } from "./front-pages/05-drivers";
import { PaymentHistoryPage, PaymentRequestsPage } from "./front-pages/20-payments";
import { ActiveTrucksPage, TruckChecklistTab, TruckDocumentsTab, TruckPhotosTab, TruckPreventiveMaintenanceTab, TruckServiceTab, TruckViewPage } from "./front-pages/06-trucks";
import { ActiveTrailersPage, TrailerChecklistTab, TrailerDocumentsTab, TrailerPhotosTab, TrailerServiceTab, TrailerViewPage } from "./front-pages/07-trailers";
import { CompanyChecklistTab, CompanyDocumentsTab, CompanyViewPage } from "./front-pages/08-company";
import { ActiveMembersPage, MemberChecklistTab, MemberCreationPage, MemberDocumentsTab, MemberProfilePage } from "./front-pages/09-team";
import { SuggestionsPage } from "./front-pages/10-suggestions";
import { ActiveTrainingsPage, EasyWayTrainingsPage } from "./front-pages/11-trainings";
import { AccidentRegisterPage } from "./front-pages/12-accident";
import { DrugAndAlcoholPage } from "./front-pages/13-consortium";
import { TasksPage } from "./front-pages/14-tasks";
import { DriversMapPage } from "./front-pages/15-map";
import { CredentialsPage } from "./front-pages/16-credentials";
import { ChatPage } from "./front-pages/21-chat";
import { LoadsPage } from "./front-pages/22-loads";
import { MyCompanyPage } from "./front-pages/23-mycompany";


export class FrontPageManager {
    readonly page: Page
    readonly browser: Browser
    readonly request: APIRequestContext
    readonly storageState: BrowserContextOptions

    readonly apiUrlWeb: string
    readonly apiUrlMobile: string

    private readonly loginPage: LoginPage
    private readonly companyCreationPage: CompanyCreationPage
    private readonly setPasswordPage: SetPasswordPage
    private readonly dashboardPage: DashboardPage
    /** Drivers */
    private readonly activeDriversPage: ActiveDriversPage
    private readonly driverProfilePage: DriverProfilePage
    private readonly driverDocumemntsTab: DriverDocumentsTab
    private readonly driverChecklistTab: DriverChecklistTab
    private readonly previousEmployerTab: PreviousEmployerTab
    private readonly roadsideInspectionsTab: RoadsideInspectionsTab
    private readonly drugAndAlcoholTab: DrugAndAlcoholTab
    /** Trucks */
    private readonly activeTrucksPage: ActiveTrucksPage
    private readonly truckViewPage: TruckViewPage
    private readonly truckDocumemntsTab: TruckDocumentsTab
    private readonly truckChecklistTab: TruckChecklistTab
    private readonly truckPreventiveMaintenanceTab: TruckPreventiveMaintenanceTab
    private readonly truckPhotosTab: TruckPhotosTab
    private readonly truckServiceTab: TruckServiceTab
    /** Trailers */
    private readonly activeTrailersPage: ActiveTrailersPage
    private readonly trailerViewPage: TrailerViewPage
    private readonly trailerDocumentsTab: TrailerDocumentsTab
    private readonly trailerChecklistTab: TrailerChecklistTab
    private readonly trailerPhotosTab: TrailerPhotosTab
    private readonly trailerServiceTab: TrailerServiceTab
    /** Company */
    private readonly companyViewPage: CompanyViewPage
    private readonly companyDocumentsTab: CompanyDocumentsTab
    private readonly companyChecklistTab: CompanyChecklistTab
    /** Team */
    private readonly memberCreationPage: MemberCreationPage
    private readonly activeMembersPage: ActiveMembersPage
    private readonly memberProfilePage: MemberProfilePage
    private readonly memberDocumemntsTab: MemberDocumentsTab
    private readonly memberChecklistTab: MemberChecklistTab
    /** Suggestions */
    private readonly suggestionsPage: SuggestionsPage
     /** Active Trainings */
    private readonly activeTrainingsPage: ActiveTrainingsPage
    private readonly ewTrainingsPage: EasyWayTrainingsPage
    /** Accident Register */
    private readonly accidentRegisterPage: AccidentRegisterPage
    /** Drug And Alcohol */
    private readonly drugAndAlcoholPage: DrugAndAlcoholPage
    /** Tasks */
    private readonly tasksPage: TasksPage
    /** Map */
    private readonly driversMapPage: DriversMapPage
    /** Credentials */
    private readonly credentialsPage: CredentialsPage
    /** Payments */
    private readonly paymentRequestsPage: PaymentRequestsPage
    private readonly paymentHistoryPage: PaymentHistoryPage
    /** Chat */
    private readonly chatPage: ChatPage
    /** Loads */
    private readonly loadsPage: LoadsPage

    private readonly myCompanyPage: MyCompanyPage


    constructor(page: Page, browser: Browser, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        this.page = page
        this.browser = browser
        this.request = request

        this.apiUrlWeb = apiUrlWeb
        this.apiUrlMobile = apiUrlMobile

        this.loginPage = new LoginPage(this.page)
        this.companyCreationPage = new CompanyCreationPage(this.page, this.browser, this.apiUrlWeb, this.apiUrlMobile)
        this.setPasswordPage = new SetPasswordPage(this.page, this.browser, this.apiUrlWeb, this.apiUrlMobile)
        this.dashboardPage = new DashboardPage(this.page, this.apiUrlWeb)
        /**Drivers */
        this.activeDriversPage = new ActiveDriversPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.driverProfilePage = new DriverProfilePage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.driverDocumemntsTab = new DriverDocumentsTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.driverChecklistTab = new DriverChecklistTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.previousEmployerTab = new PreviousEmployerTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.roadsideInspectionsTab = new RoadsideInspectionsTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.drugAndAlcoholTab = new DrugAndAlcoholTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        /**Trucks */
        this.activeTrucksPage = new ActiveTrucksPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.truckViewPage = new TruckViewPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.truckDocumemntsTab = new TruckDocumentsTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.truckChecklistTab = new TruckChecklistTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.truckPreventiveMaintenanceTab = new TruckPreventiveMaintenanceTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.truckPhotosTab = new TruckPhotosTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.truckServiceTab = new TruckServiceTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        /**Trailers */
        this.activeTrailersPage = new ActiveTrailersPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.trailerViewPage = new TrailerViewPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.trailerDocumentsTab = new TrailerDocumentsTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.trailerChecklistTab = new TrailerChecklistTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.trailerPhotosTab = new TrailerPhotosTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.trailerServiceTab = new TrailerServiceTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        /**Company */
        this.companyViewPage = new CompanyViewPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.companyDocumentsTab = new CompanyDocumentsTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.companyChecklistTab = new CompanyChecklistTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        /**Team */
        this.memberCreationPage = new MemberCreationPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile, this.browser)
        this.activeMembersPage = new ActiveMembersPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.memberProfilePage = new MemberProfilePage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.memberDocumemntsTab = new MemberDocumentsTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.memberChecklistTab = new MemberChecklistTab(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        /** Suggestions */
        this.suggestionsPage = new SuggestionsPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        /** Active Trainings */
        this.activeTrainingsPage = new ActiveTrainingsPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        this.ewTrainingsPage = new EasyWayTrainingsPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        /** Accident Register */
        this.accidentRegisterPage = new AccidentRegisterPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        /** Drug And Alcohol */
        this.drugAndAlcoholPage = new DrugAndAlcoholPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        /** Tasks page */
        this.tasksPage = new TasksPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        /** Map page */
        this.driversMapPage = new DriversMapPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        /** Map page */
        this.credentialsPage = new CredentialsPage(this.page, this.request, this.apiUrlWeb, this.apiUrlMobile)
        /** Payments page */
        this.paymentRequestsPage = new PaymentRequestsPage(this.page, this.apiUrlWeb, this.apiUrlMobile)
        this.paymentHistoryPage = new PaymentHistoryPage(this.page, this.apiUrlWeb, this.apiUrlMobile)
        /** Chat page */
        this.chatPage = new ChatPage(this.page, this.apiUrlWeb, this.apiUrlMobile)
        /** Loads page */
        this.loadsPage = new LoadsPage(this.page, this.apiUrlWeb, this.apiUrlMobile)
        this.myCompanyPage = new MyCompanyPage(this.page, this.apiUrlWeb, this.apiUrlMobile)

    }

    get onLoginPage() {
        return this.loginPage
    }
    get onSetPasswordPage() {
        return this.setPasswordPage
    }
    get onCompanyCreationPage() {
        return this.companyCreationPage
    }
    get onDashboardPage() {
        return this.dashboardPage
    }
    /**Drivers*/
    get onActiveDriversPage() {
        return this.activeDriversPage
    }
    get onDriverProfilePage() {
        return this.driverProfilePage
    }
    get onDriverDocumentsTab() {
        return this.driverDocumemntsTab
    }
    get onDriverChecklistsTab() {
        return this.driverChecklistTab
    }
    get onPreviousEmployerTab() {
        return this.previousEmployerTab
    }
    get onRoadsideInspectionsTab() {
        return this.roadsideInspectionsTab
    }
    get onDrugAndAlcoholTab() {
        return this.drugAndAlcoholTab
    }
    /**Trucks */
    get onActiveTrucksPage() {
        return this.activeTrucksPage
    }
    get onTruckViewPage() {
        return this.truckViewPage
    }
    get onTruckDocumentsTab() {
        return this.truckDocumemntsTab
    }
    get onTruckChecklistTab() {
        return this.truckChecklistTab
    }
    get onTruckPreventiveMaintenanceTab() {
        return this.truckPreventiveMaintenanceTab
    }
    get onTruckPhotosTab() {
        return this.truckPhotosTab
    }
    get onTruckServiceTab() {
        return this.truckServiceTab
    }
    /**Trailers */
    get onActiveTrailersPage() {
        return this.activeTrailersPage
    }
    get onTrailerViewPage() {
        return this.trailerViewPage
    }
    get onTrailerDocumentsTab() {
        return this.trailerDocumentsTab
    }
    get onTrailerChecklistTab() {
        return this.trailerChecklistTab
    }
    get onTrailerPhotosTab() {
        return this.trailerPhotosTab
    }
    get onTrailerServiceTab() {
        return this.trailerServiceTab
    }
    /**Company */
    get onCompanyViewPage() {
        return this.companyViewPage
    }
    get onCompanyDocumentsTab() {
        return this.companyDocumentsTab
    }
    get onCompanyChecklistTab() {
        return this.companyChecklistTab
    }
    /** Team */
    get onMemberCreationPage() {
        return this.memberCreationPage
    }
    get onActiveMembersPage() {
        return this.activeMembersPage
    }
    get onMemberProfilePage() {
        return this.memberProfilePage
    }
    get onMemberDocumentsTab() {
        return this.memberDocumemntsTab
    }
    get onMemberChecklistTab() {
        return this.memberChecklistTab
    }
    /** Suggestions */
    get onSuggestionsPage() {
        return this.suggestionsPage
    }

    get onPaymentRequestsPage() {
        return this.paymentRequestsPage
    }
    get onPaymentHistoryPage() {
        return this.paymentHistoryPage
    }
    /** Active Trainings */
    get onActiveTrainingsPage() {
        return this.activeTrainingsPage
    }
    get onEasyWayTrainingsPage() {
        return this.ewTrainingsPage
    }
    /** Accident Register */
    get onAccidentRegisterPage() {
        return this.accidentRegisterPage
    }
    /** Drug And Alcohol */
    get onDrugAndAlcoholPage() {
        return this.drugAndAlcoholPage
    }
    /** Tasks */
    get onActiveTasksPage() {
        return this.tasksPage
    }
    /** Map */
    get onDriversMapPage() {
        return this.driversMapPage
    }
    /** Credentials */
    get onCredentialsPage() {
        return this.credentialsPage
    }
    /** Chat */
    get onChatPage() {
        return this.chatPage
    }
    /** Loads */
    get onLoadsPage() {
        return this.loadsPage
    }
        get onMyCompanyPage() {
        return this.myCompanyPage
    }

    async navigateToFront() {
        let agreeButton = false
        await this.page.goto('/')
        await expect(this.page.locator('app-register-form')).toContainText(' Try EasyWay. No credit card required. Cancel anytime. ')
        agreeButton = await this.page.locator('button', {hasText: 'agree'}).isVisible()
        if (agreeButton) {
            await this.page.getByRole('button', { name: 'AGREE' }).click()
        }
    }

}
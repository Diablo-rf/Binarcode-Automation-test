import { APIRequestContext, test as base, Browser, Page } from '@playwright/test'
import { FrontPageManager } from './page-objects/frontPageManager'
import { BackPageManager } from './page-objects/backPageManager'
import { Mailbox } from './page-objects/mailbox-pages/mailbox'
import { faker } from '@faker-js/faker'
import { HelperBase } from './page-objects/helperBase'

const companyIdFilePath = './test_data/test_artifacts/companyID.json'

export type TestOptions = {
    apiUrlMobile: string
    apiUrlWeb: string
    backAuthToken: string
    backUrl: string
    backStorageState: string
    userEmail: string
    userPassword: string

    front: FrontPageManager
    back: BackPageManager
    mailBox: Mailbox
    helperBase: HelperBase

    newCompanyData: {
        companyEmail: string;
        confirmEmailLink: string;
        companyIdKey: string;
        companyName: string;
        companyId: string;
    }
    newCompanyDataWithoutCache: {
        companyEmail: string;
        confirmEmailLink: string;
        companyIdKey: string;
        companyName: string;
        companyId: string;
    }
    paymentsTestCompany: {
        companyEmail: string;
        confirmEmailLink: string;
        companyIdKey: string;
        companyName: string;
        companyId: string;
    }

    inviteRandomDriver: {
        credentials: string
        id: any
        driverEmail: string
    }
    createActiveRandomDriver: {
        credentials: string
        id: any
        driverEmail: string
        token: string
    }
    mvrDriverData: {
        driverFirstName: string
        driverLastName: string
        driverId: string
    }
    pspDriverData: {
        driverFirstName: string
        driverLastName: string
        driverId: string
    }
    createRandomTruck: {
        truckBrand: string
        truckUnitNumber: string
        id: any
    }
    createRandomTrailer: {
        trailerBrand: string
        trailerUnitNumber: string
        id: any
    }
    inviteRandomDriverWithMandatoryFields: string;
    inviteRandomMember: {
        credentials: string
        id: any
        memberEmail: string
    }
    createEwTraining: {
        trainingTitle: string
        price: string
        id: any
    }

}

let newCompanyDataCache: TestOptions['newCompanyData'] | null = null
let payCompCache: TestOptions['paymentsTestCompany'] | null = null


export const test = base.extend<TestOptions>({
    apiUrlMobile: ['', { option: true }],
    apiUrlWeb: ['', { option: true }],
    backAuthToken: ['', { option: true }],
    backUrl: ['', { option: true }],
    backStorageState: ['', { option: true }],
    userEmail: ['', { option: true }],
    userPassword: ['', { option: true }],

    front: async ({ page, browser, request, apiUrlWeb, apiUrlMobile }, use) => {

        const frontPageManager = new FrontPageManager(page, browser, request, apiUrlWeb, apiUrlMobile)
        await use(frontPageManager)
    },
    back: async ({ page, browser, request, backUrl, backAuthToken, apiUrlWeb, apiUrlMobile, backStorageState }, use) => {

        const backPageManager = new BackPageManager(page, browser, request, backUrl, backStorageState, backAuthToken, apiUrlWeb, apiUrlMobile)
        await backPageManager.setBackofficeContext()
        await use(backPageManager)

    },
    mailBox: async ({ page, browser, apiUrlWeb, apiUrlMobile }, use) => {

        const mailbox = new Mailbox(page, browser, apiUrlWeb, apiUrlMobile)
        const context = await browser.newContext({ storageState: './playwright/.auth/gmailAuth.json' })
        const mailboxPage = await context.newPage()
        mailbox.setPage(mailboxPage)

        await use(mailbox)
    },
    helperBase: async ({ page, apiUrlWeb, apiUrlMobile }, use) => {
        const helperBase = new HelperBase(page, apiUrlWeb, apiUrlMobile)
        await use(helperBase)
    },

    newCompanyData: async ({ browser, request, backUrl, backStorageState, backAuthToken, apiUrlWeb, apiUrlMobile }, use) => {
        if (!newCompanyDataCache) {
            newCompanyDataCache = await createNewCompany(browser, request, backUrl, backStorageState, backAuthToken, apiUrlWeb, apiUrlMobile)
        }
        await use(newCompanyDataCache)
    },
    paymentsTestCompany: async ({ browser, request, backUrl, backStorageState, backAuthToken, apiUrlWeb, apiUrlMobile}, use) => {
        if (!payCompCache) {
            payCompCache = await createNewCompany(browser, request, backUrl, backStorageState, backAuthToken, apiUrlWeb, apiUrlMobile, true)
        }
        await use(payCompCache)
    },
    newCompanyDataWithoutCache: async ({ browser, request, backUrl, backStorageState, backAuthToken, apiUrlWeb, apiUrlMobile }, use) => {
        const newCompanyData = await createNewCompany(browser, request, backUrl, backStorageState, backAuthToken, apiUrlWeb, apiUrlMobile)
        await use(newCompanyData)
    },
    mvrDriverData: async ({ browser, request, apiUrlWeb, apiUrlMobile, userEmail }, use) => {
        const inviteMvrDataCache = await inviteMvrDriver(
            browser, request, apiUrlWeb, apiUrlMobile, userEmail, `${process.env.COMPANY_ID}`, `${process.env.FRONT_PASSWORD}`)
        await use(inviteMvrDataCache)
    },
    pspDriverData: async ({ browser, request, apiUrlWeb, apiUrlMobile, userEmail }, use) => {
        const invitePspDataCache = await invitePspDriver(
            browser, request, apiUrlWeb, apiUrlMobile, userEmail, `${process.env.COMPANY_ID}`, `${process.env.FRONT_PASSWORD}`)
        await use(invitePspDataCache)
    },
    inviteRandomDriver: async ({ request, helperBase, userEmail }, use) => {
        const driverEmail = `driverowner.easyways+driver${faker.number.int(10000)}@gmail.com`;
        const driverFirstName = `${faker.person.firstName()}`;
        const driverLastName = `${faker.person.lastName()}`;
        const driverCredentials = `${driverFirstName} ${driverLastName}`;
        const driverId = await helperBase.inviteDriverByApi(
            `${userEmail}`,
            `${process.env.FRONT_PASSWORD}`,
            '1',
            driverEmail,
            `${process.env.COMPANY_ID}`,
            driverFirstName,
            driverLastName,
            request
        );
        const driverData = {
            id: driverId,
            credentials: driverCredentials,
            driverEmail: driverEmail
        };

        await use(driverData);

        await helperBase.deleteEntityByApi(`${userEmail}`, `${process.env.FRONT_PASSWORD}`, 'driver', driverId, `${process.env.COMPANY_ID}`, request)
    },
    createActiveRandomDriver: async ({ request, helperBase, userEmail, mailBox }, use) => {
        let accessToken: string
        const driverEmail = `driverowner.easyways+driver${faker.number.int(10000)}@gmail.com`
        console.log('created driver email: ' + driverEmail);
        const driverFirstName = `${faker.person.firstName()}`
        const driverLastName = `${faker.person.lastName()}`
        const driverId = await helperBase.inviteDriverByApi(userEmail, `${process.env.FRONT_PASSWORD}`, '1', driverEmail, `${process.env.COMPANY_ID}`, driverFirstName, driverLastName, request)
        const driverCredentials = `${driverFirstName} ${driverLastName}`;
        await mailBox.openInboxPage()
        await mailBox.checkDriverInvitationEmail(driverEmail, driverFirstName)
        accessToken = await helperBase.submitDriverInvitationCodeByApi(driverEmail, request)
        await helperBase.acceptDriverAgreementByApi(accessToken, request)
        await helperBase.updateDriverPasswordByApi(accessToken, request)

        const driverData = {
            id: driverId,
            credentials: driverCredentials,
            driverEmail: driverEmail,
            token: accessToken
        };

        await use(driverData);

        await helperBase.deleteEntityByApi(`${userEmail}`, `${process.env.FRONT_PASSWORD}`, 'driver', driverId, `${process.env.COMPANY_ID}`, request)
    },
    inviteRandomDriverWithMandatoryFields: async ({ request, helperBase, inviteRandomDriver, userEmail }, use) => {
        const { id: driverId, credentials: driverCredentials, driverEmail: driverEmail } = inviteRandomDriver;

        await helperBase.updateDriverByApi(
            `${userEmail}`,
            `${process.env.FRONT_PASSWORD}`,
            driverId,
            'AK',
            '12345678910111213141',
            '1985-12-02',
            request
        );

        await use(driverCredentials);

    },
    createRandomTruck: async ({ request, helperBase, userEmail }, use) => {
        const makeName = 'Volvo';
        const unitNumber = `${faker.number.int(1000)}`;
        const truckId = await helperBase.createTruckByApi(
            `${userEmail}`,
            `${process.env.FRONT_PASSWORD}`,
            `${process.env.COMPANY_ID}`,
            makeName,
            unitNumber,
            '10',
            'TEST1234',
            'diesel',
            request
        );
        const truckData = { id: truckId, truckBrand: makeName, truckUnitNumber: unitNumber };
        await use(truckData);
        await helperBase.deleteEntityByApi(`${userEmail}`, `${process.env.FRONT_PASSWORD}`, 'truck', truckId, `${process.env.COMPANY_ID}`, request)
    },
    createRandomTrailer: async ({ request, helperBase, userEmail }, use) => {
        const makeName = 'Heil Trailer International';
        const unitNumber = `${faker.number.int(1000)}`;
        const trailerId = await helperBase.createTrailerByApi(
            `${userEmail}`,
            `${process.env.FRONT_PASSWORD}`,
            `${process.env.COMPANY_ID}`,
            makeName,
            unitNumber,
            'TEST1234',
            request
        );
        const trailerData = { id: trailerId, trailerBrand: makeName, trailerUnitNumber: unitNumber };
        await use(trailerData);
        await helperBase.deleteEntityByApi(`${userEmail}`, `${process.env.FRONT_PASSWORD}`, 'trailer', trailerId, `${process.env.COMPANY_ID}`, request)
    },
    inviteRandomMember: async ({ request, helperBase, userEmail }, use) => {
        const memberEmail = `driverowner.easyways+member${faker.number.int(10000)}@gmail.com`;
        const memberFirstName = `${faker.person.firstName()}`;
        const memberLastName = `${faker.person.lastName()}`;
        const memberCredentials = `${memberFirstName} ${memberLastName}`;
        const memberId = await helperBase.inviteMemberByApi(
            `${userEmail}`,
            `${process.env.FRONT_PASSWORD}`,
            'Safety manager',
            memberEmail,
            `${process.env.COMPANY_ID}`,
            memberFirstName,
            memberLastName,
            request
        );
        const memberData = {
            id: memberId,
            credentials: memberCredentials,
            memberEmail: memberEmail
        };

        await use(memberData);

        await helperBase.decomissionEntityByApi(`${userEmail}`, `${process.env.FRONT_PASSWORD}`, 'customer', memberId, request)
    },
    createEwTraining: async ({ request, back }, use) => {
        let trainingId: any
        const trainingData = {
            trainingTitle: `Random training with ID:${faker.number.int(1000)}`,
            price: `${faker.number.int(1000)}`,
            id: trainingId
        }
        await back.onDashboardPage.navigateToSuggestedTrainingsPage()
        const returnedId = await back.onSuggestedTrainingsPage.createEwTrainingFixture({
            title: trainingData.trainingTitle,
            price: trainingData.price
        })
        trainingData.id = returnedId
        await use(trainingData)
        await back.onSuggestedTrainingsPage.deleteTrainingByApi(request, returnedId)
    }

})
async function createNewCompany(browser: Browser, request: APIRequestContext, backUrl: string, backStorageState: string, backAuthToken: string, apiUrlWeb: string, apiUrlMobile: string, paymentsTest?: boolean) {
    test.slow()
    const companyEmail = `driverowner.easyways+${faker.number.int(10000)}@gmail.com`
    const confirmEmailLink = `${companyEmail}-confirm_email_link`
    const companyIdKey = `CompanyID_${faker.number.int(10000)}`
    const companyName = `${faker.person.lastName()}&${faker.person.lastName()} Company${faker.number.int(1000)} Ltd.`

    const frontContext = await browser.newContext();
    const frontPage = await frontContext.newPage();
    const front = new FrontPageManager(frontPage, browser, request, apiUrlWeb, apiUrlMobile);
    const helperBase = new HelperBase(frontPage, apiUrlWeb, apiUrlMobile)

    const backContext = await browser.newContext({ storageState: backStorageState });
    const backPage = await backContext.newPage();
    const back = new BackPageManager(backPage, browser, request, backUrl, backStorageState, backAuthToken, apiUrlWeb, apiUrlMobile);

    const mailContext = await browser.newContext({ storageState: './playwright/.auth/gmailAuth.json' });
    const mailPage = await mailContext.newPage();
    const mailBox = new Mailbox(mailPage, browser, apiUrlWeb, apiUrlMobile);

    await front.navigateToFront()
    await front.onLoginPage.signUpTheEmail(companyEmail)
    await mailBox.openInboxPage()
    await mailBox.getEmailConfirmationLink(companyEmail, confirmEmailLink)
    await front.onCompanyCreationPage.createNewCompanyWithValidData(companyName, confirmEmailLink)
    await mailBox.checkAccountVerificationEmail(companyEmail)
    await back.onDashboardPage.navigateToCompaniesPage()
    await back.onCompaniesPage.verifyCompanyStatusAndDataAfterCreation(companyName, companyIdKey)
    const companyId = await helperBase.readFromFile(companyIdKey, companyIdFilePath)
    await back.onDashboardPage.navigateToCompaniesPage()
    await back.onCompaniesPage.approveCompany(companyName, companyIdKey)
    await mailBox.checkAccountReadyEmail(companyEmail)
    if (paymentsTest) {
        await inviteMvrDriver(browser, request, apiUrlWeb, apiUrlMobile, companyEmail,
            companyId, `${process.env.COMPANY_PASSWORD}`)
        await invitePspDriver(browser, request, apiUrlWeb, apiUrlMobile, companyEmail,
            companyId, `${process.env.COMPANY_PASSWORD}`)
        await helperBase.addPaymentCardByApi(companyEmail, `${process.env.COMPANY_PASSWORD}`, request)
        await helperBase.toggleAutopayByApi(
            companyEmail, `${process.env.COMPANY_PASSWORD}`, request, companyId, true)
    }

    return { companyEmail, confirmEmailLink, companyIdKey, companyName, companyId }
}
async function inviteMvrDriver(
    browser: Browser, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string, userEmail: string, companyId: string,
    companyPassword: string) {
    const frontContext = await browser.newContext();
    const frontPage = await frontContext.newPage();
    const helperBase = new HelperBase(frontPage, apiUrlWeb, apiUrlMobile)

    const driverEmail = `driverowner.easyways+mvr${faker.number.int(10000)}@gmail.com`;
    const driverFirstName = 'John'
    const driverLastName = 'Doe';
    const driverId = await helperBase.inviteDriverByApi(
        `${userEmail}`,
        companyPassword,
        '1',
        driverEmail,
        companyId,
        driverFirstName,
        driverLastName,
        request
    );
    await helperBase.updateDriverByApi(
        `${userEmail}`,
        companyPassword,
        driverId,
        'AZ',
        'Z24202003',
        '1990-06-04',
        request
    );

    return { driverFirstName, driverLastName, driverId }

}
async function invitePspDriver(
    browser: Browser, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string, userEmail: string, companyId: string,
    companyPassword: string) {
    const frontContext = await browser.newContext();
    const frontPage = await frontContext.newPage();
    const helperBase = new HelperBase(frontPage, apiUrlWeb, apiUrlMobile)

    const driverEmail = `driverowner.easyways+psp${faker.number.int(10000)}@gmail.com`;
    const driverFirstName = 'Jose'
    const driverLastName = 'Davis';
    const driverId = await helperBase.inviteDriverByApi(
        `${userEmail}`,
        companyPassword,
        '1',
        driverEmail,
        companyId,
        driverFirstName,
        driverLastName,
        request
    );
    await helperBase.updateDriverByApi(
        `${userEmail}`,
        companyPassword,
        driverId,
        'VA',
        'T123456789',
        '1975-11-6',
        request
    );
    return { driverFirstName, driverLastName, driverId }
}

import { test } from '/Binarcode-Automation-test/test-options'
import { HelperBase } from '../page-objects/helperBase';
import { FrontPageManager } from '/Binarcode-Automation-test/page-objects/frontPageManager';


test.describe('Billings', () => {

  let front: FrontPageManager
  let helperBase: HelperBase

  test.beforeAll(async ({ browser, request, apiUrlWeb, apiUrlMobile }) => {
    const frontContext = await browser.newContext();
    const frontPage = await frontContext.newPage();
    front = new FrontPageManager(frontPage, browser, request, apiUrlWeb, apiUrlMobile);
    helperBase = new HelperBase(frontPage, apiUrlWeb, apiUrlMobile)

    await front.onDashboardPage.openMyCompanyPage()

  })

  test('Top-up balance by $100', { tag: ['@billing', '@regression'] }, async ({ }) => {

      await front.onMyCompanyPage.openTab('Billing')
      await front.onMyCompanyPage.topUpBalance(100)
     
    })


})


















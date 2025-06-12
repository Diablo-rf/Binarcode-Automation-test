import { Page, expect, APIRequestContext, Locator, Browser} from "@playwright/test";
import { HelperBase} from "../helperBase";

const emailLinksFile = './test_data/test_artifacts/emailLinks.json'

interface MemberCreationOptions {
    regLink: string
    firstName: string
    lastName: string
    password: string
    memberRole: string
}
export class MemberCreationPage extends HelperBase {
    readonly request: APIRequestContext
    readonly browser: Browser

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string, browser: Browser) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request
        this.browser = browser

    }
    async createNewMemberWithValidData({regLink, firstName, lastName, password, memberRole}: MemberCreationOptions) {
        const context = await this.browser.newContext({ storageState: { cookies: [], origins: [] }})
        const registrationPage = await context.newPage()
        const confirmEmailLink = await this.readFromFile(regLink, emailLinksFile)

        //YOUR PROFILE page
        const confirmEmail = registrationPage.waitForResponse(response => response.url().includes('/v1/customer/confirm-email?token=') && response.request().method() === 'GET', {timeout: 40000})
        await registrationPage.goto(`${confirmEmailLink}`)
        const response = await confirmEmail
        expect.soft(response.status()).toEqual(200)

        await expect.soft(registrationPage.locator('app-adding-personal-data div h1')).toHaveText(' YOUR PROFILE ')
        await registrationPage.getByRole('button', { name: 'AGREE' }).click()

        const input = registrationPage.locator('input[type="file"]') // #file
        await input.setInputFiles('C:/Binarcode-Automation-test/test_data/customerAvatar.jpg')
        expect.soft(await registrationPage.locator('app-avatar img').getAttribute('src')).toContain('data:image/jpeg')

        await expect.soft(registrationPage.getByRole('textbox', { name: 'first name' })).toHaveValue(firstName)
        await expect.soft(registrationPage.getByRole('textbox', { name: 'last name' })).toHaveValue(lastName)

        await registrationPage.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
        await registrationPage.getByRole('textbox', { name: 'Repeat Password', exact: true }).fill(password)

        await registrationPage.getByRole('button', { name: 'Next' }).click()

        const personalData = await registrationPage.waitForResponse(response => response.url().includes('/v1/customer/add-personal-data?token='))
        const profileComplete = await registrationPage.waitForResponse(response => response.url().includes('/v1/customer/profile-complete-level?token=') && response.request().method() === 'GET')
        expect.soft(personalData.status()).toEqual(200)
        expect.soft(profileComplete.status()).toEqual(200)
        await expect.soft(registrationPage.locator('app-notification-bar .text')).toHaveText(' Your personal data was saved successfully. ')
        await expect.soft(registrationPage.locator('.text-appointment span')).toHaveText('REGISTRATION IS COMPLETE! WELCOME ABOARD. GET READY FOR AN AMAZING JOURNEY WITH US.')
        await registrationPage.getByRole('button', {name: 'done'}).click()
        await registrationPage.locator('mat-toolbar-row', {hasText: 'Dashboard'}).waitFor({state: 'visible'})
        await expect.soft(registrationPage.locator('.full_name')).toHaveText(`${firstName} ${lastName}`)
        await expect.soft(registrationPage.locator('.function')).toHaveText(memberRole)
    }

}

interface InviteMemberOptions {
    firstName: string
    lastName: string
    email: string
    memberRole: string
}
export class ActiveMembersPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request

    }

    async openInviteMemberModal() {
        await this.page.locator('mat-icon', { hasText: 'add_circle_outline' }).waitFor({state: 'visible', timeout: 30000})
        await this.page.locator('mat-icon', { hasText: 'add_circle_outline' }).hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Invite a team member' })).toBeVisible()
        await this.page.locator('mat-icon', { hasText: 'add_circle_outline' }).click()
        await expect.soft(this.page.locator('.invite__header h3')).toHaveText('Invite a team member')

    }
    async openMemberProfile(memberCredentials: string) {
        await this.page.locator('.card__title', { hasText: memberCredentials }).click()
        await expect.soft(this.page.locator('.breadcrumbs__item', { hasText: memberCredentials })).toBeVisible()

    }
    async inviteMember({firstName, lastName, email, memberRole}: InviteMemberOptions, memberId?: string[]) {
        await this.page.waitForTimeout(1000)
        await this.page.getByRole('textbox', { name: 'first name' }).fill(firstName)
        await this.page.getByRole('textbox', { name: 'last name' }).fill(lastName)
        await this.page.getByRole('textbox', { name: 'email' }).fill(email)
        await this.page.locator('app-invite-customer .mat-mdc-select-trigger').click()
        await this.page.locator('mat-option', {hasText: memberRole}).waitFor({state: 'visible'})
        expect.soft(await this.page.getByRole('combobox', { name: 'role' }).getAttribute('aria-expanded')).toEqual('true')
        await this.page.getByRole('option', { name: memberRole }).click()

        await this.page.getByRole('button', { name: 'invite' }).click()
        const responsePromise = await this.page.waitForResponse(response => response.url().includes(`${this.apiUrlWeb}/customer/invite`) && response.request().method() === 'POST')

        const entityResponseBody = await responsePromise.json()
        expect.soft(responsePromise.status()).toEqual(200)
        if (responsePromise.status() === 200) memberId?.push(entityResponseBody.data.id)

        await expect.soft(this.page.locator('app-notification-bar .text')).toHaveText(" An email was sent to your employee's email address! ")
        console.log('Invited driver email: ' + email);

        const memberCard = this.page.locator('mat-card .card__wrap', { hasText: firstName }).filter({ hasText: lastName })
        await memberCard.locator('.avatar__status').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Unconfirmed Email' })).toBeVisible()
        await expect.soft(memberCard.locator('.card__subtitle div')).toHaveText(memberRole)

        await memberCard.locator('.avatar__initials').click()
        await this.page.locator('.card-wrapper').waitFor({ state: 'attached' })

        const driverPanel = this.page.locator('.card-wrapper')
        await expect.soft(driverPanel.locator('.entity-name', { hasText: firstName })).toBeVisible()
        await expect.soft(driverPanel.locator('.entity-name', { hasText: lastName })).toBeVisible()
        await expect.soft(driverPanel.locator('.entity-subtitle')).toHaveText(memberRole)
        await expect.soft(driverPanel.locator('.status-chip span')).toHaveText('Unconfirmed Email')
        await expect.soft(driverPanel.locator('[data-mat-icon-name="resend-email"]')).toBeVisible()
        await expect.soft(driverPanel.locator('[class="row my-2 mat-gray info-row"]', { hasText: email })).toBeVisible()
        
        return entityResponseBody.data.id
    }
    async checkMemberAfterRegistration(firstName: string, lastName: string) {
        const memberCard = this.page.locator('mat-card .card__wrap', { hasText: firstName }).filter({ hasText: lastName })
        await memberCard.locator('.avatar__status').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Active' })).toBeVisible()
        await memberCard.locator('.avatar__inner').click()
        await this.page.locator('.card-wrapper').waitFor({ state: 'attached' })

        const driverPanel = this.page.locator('.card-wrapper')
        await expect.soft(driverPanel.locator('.status-chip span')).toHaveText('Active')

    }

}
export class MemberProfilePage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request


    }

    async editMemberInfo(memberCredentials: string, memberAvatarFileName: string, onHold: boolean, memberEmail: string) {
        await this.page.locator('.options-button').click()
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()

        await this.page.locator('.addit-title').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('.addit-title')).toContainText(memberCredentials)

        if (memberAvatarFileName) {
            await this.page.locator('input[type="file"]').setInputFiles(`./test_data/${memberAvatarFileName}`)
            expect.soft(await this.page.locator('app-team-member-addit app-avatar img').getAttribute('src')).toContain('data:image/')
        }

        await this.page.getByRole('textbox', { name: 'first name' }).fill('EditedFirstName')
        await this.page.getByRole('textbox', { name: 'last name' }).fill('EditedLastName')
        await this.page.locator('app-phone-number', {hasText: ' Phone Number '}).getByPlaceholder('(201) 555-0123').fill('(201) 555-0155')
        await this.page.getByRole('textbox', { name: 'Address' }).pressSequentially('Astoria', { delay: 100 })
        await this.page.locator('.pac-item').first().waitFor({state: 'visible'})
        await this.page.locator('.pac-item').first().click()
        await expect.soft(this.page.getByRole('textbox', { name: 'zip code' })).toHaveValue('97103')
        await this.page.getByRole('textbox', { name: 'apt' }).fill('118')

        await this.page.locator('[formcontrolname="hire_date"]').click()
        await expect.soft(this.page.locator('.mat-calendar ')).toBeVisible()
        await this.page.locator('[aria-current="date"]').click()
        const hireDate = await this.page.locator('[formcontrolname="hire_date"]').inputValue()

        await this.page.locator('[formcontrolname="birth_date"]').click()
        await expect.soft(this.page.locator('.mat-calendar ')).toBeVisible()
        await this.page.getByRole('gridcell', { name: '2000' }).click()
        await this.page.getByRole('gridcell', { name: 'Dec' }).click()
        await this.page.locator('button span:text-is("2")').click()

        await this.page.getByRole('textbox', {name: 'ssn'}).fill('564-81-486')

        if (onHold) {
            await this.page.getByRole('combobox', { name: 'on hold' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'on hold' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: 'Yes' }).click()
        }

        await this.page.getByRole('combobox', { name: 'gender' }).click()
        await this.page.getByRole('option', { name: 'female' }).click()

        await this.page.locator('app-phone-number', {hasText: ' Emergency contact phone '}).getByPlaceholder('(201) 555-0123').fill('(201) 555-0156')
        await this.page.getByRole('textbox', {name: 'emergency'}).fill('Milda Johnson')

        await this.page.getByRole('textbox', { name: 'comment' }).fill('This is a member edit test')
        await this.page.getByRole('button', { name: 'save' }).click()
        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Team Member was updated successfully! ' })).toBeVisible()
        /**Side panel validation */
        if (memberAvatarFileName)
            expect.soft(await this.page.locator('app-team-profile-info app-avatar img').getAttribute('src')).toContain(memberAvatarFileName);
        await expect.soft(this.page.locator('.entity-name').nth(0)).toHaveText('EditedFirstName')
        await expect.soft(this.page.locator('.entity-name').nth(1)).toHaveText('EditedLastName')
        await expect.soft(this.page.locator('.text-break').first()).toHaveText('place Astoria, OR 97103, USA, Astoria Oregon 97103, 118 ')
        await expect.soft(this.page.locator('.info-row', {hasText: 'birth date'}).locator('.text-right')).toHaveText(' 12-02-2000')
        await expect.soft(this.page.locator('.info-row', {hasText: 'email'}).locator('.text-right')).toHaveText(memberEmail)
        await expect.soft(this.page.locator('.info-row', {hasText: 'phone'}).locator('.text-right')).toHaveText(' +1 (201) 555-0155 ')
        await expect.soft(this.page.locator('.info-row', {hasText: 'ssn'}).locator('.text-right')).toHaveText(' 564-81-486 ')
        await expect.soft(this.page.locator('.info-row .other-info')).toHaveText('This is a member edit test')
        /** modal validation */
        await this.page.locator('.options-button').click({ timeout: 30000 })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()
        await expect.soft(this.page.locator('.addit-title', { hasText: 'EditedFirstName EditedLastName' })).toBeVisible()

        expect.soft(await this.page.locator('app-team-member-addit app-avatar img').getAttribute('src')).toContain(memberAvatarFileName)
        await expect.soft(this.page.getByRole('textbox', { name: 'first name' })).toHaveValue('EditedFirstName')
        await expect.soft(this.page.getByRole('textbox', { name: 'last name' })).toHaveValue('EditedLastName')
        await expect.soft(this.page.locator('app-phone-number', {hasText: ' Phone Number '}).getByPlaceholder('(201) 555-0123')).toHaveValue('(201) 555-0155')
        await expect.soft(this.page.getByRole('textbox', { name: 'Address' })).toHaveValue('Astoria, OR 97103, USA')
        await expect.soft(this.page.getByRole('textbox', { name: 'zip code' })).toHaveValue('97103')
        await expect.soft(this.page.getByRole('textbox', { name: 'apt' })).toHaveValue('118')
        await expect.soft(this.page.locator('[formcontrolname="hire_date"]')).toHaveValue(`${hireDate}`)
        await expect.soft(this.page.locator('[formcontrolname="birth_date"]')).toHaveValue('Saturday, Dec 2, 2000')
        await expect.soft(this.page.getByRole('textbox', { name: 'ssn' })).toHaveValue('564-81-486')
        await expect.soft(this.page.getByRole('combobox', { name: 'on hold' }).locator('span span')).toHaveText(onHold ? 'Yes' : 'No')
        await expect.soft(this.page.getByRole('combobox', { name: 'gender' }).locator('span span')).toHaveText('Female')
        await expect.soft(this.page.locator('app-phone-number', {hasText: ' Emergency contact phone '}).getByPlaceholder('(201) 555-0123')).toHaveValue('(201) 555-0156')
        await expect.soft(this.page.getByRole('textbox', { name: 'contact name' })).toHaveValue('Milda Johnson')
        await expect.soft(this.page.getByRole('textbox', { name: 'comment' })).toHaveValue('This is a member edit test')

        await this.page.locator('button.close').click()

        await this.page.locator('.ew-team').click()
        await expect.soft(this.page.locator('app-team-card-item .card__title div', {hasText: 'EditedFirstName EditedLastName'})).toBeVisible()

    }
}    

interface CreateDocumentOptions {
    folderTitle?: string;
    docTitle: string;
    daysFromCurrentDate?: number;
    addFilesFileName?: string;
    description?: string;
}

export class MemberDocumentsTab extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request

    }

    tooltip(text: string) {
        return this.page.locator('.mdc-tooltip__surface', { hasText: text })
    }

    async createDocument({
        folderTitle,
        docTitle,
        daysFromCurrentDate,
        addFilesFileName,
        description,
    }: CreateDocumentOptions, documentId?: string[]) {
        const redstyleAttributeColor = 'color: rgb(232, 44, 63);'
        const orangestyleAttributeColor = 'color: rgb(255, 173, 32);'

        await this.page.getByLabel('Documents').getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Add new item' })).toBeVisible()
        /**entity creation */
        await this.page.getByLabel('Documents').getByText('add_circle_outline').click()
        await this.page.getByRole('menuitem', { name: 'Add new item' }).click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Document' })).toBeVisible()
        await this.page.getByRole('textbox', { name: 'Title' }).fill(docTitle)

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
        /** row validation */
        await docRow.getByText(docTitle).hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: docTitle })).toBeVisible()
        if (addFilesFileName)
            await expect.soft(docRow.locator('.file-number-container span')).toHaveText('1');
        await expect.soft(docRow.locator('mat-icon', { hasText: addFilesFileName ? 'attach_file' : 'help_outline' })).toBeVisible()

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
        
        if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 4) {
            await expect.soft(docUploadedTime).toHaveText('Expire Soon')
            expect.soft(await docUploadedTime.getAttribute('style')).toEqual(redstyleAttributeColor)
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 31) {
            await expect.soft(docUploadedTime).toHaveText('Expire Soon')
            expect.soft(await docUploadedTime.getAttribute('style')).toEqual(orangestyleAttributeColor)
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate > 30) {
            await expect.soft(docUploadedTime).toHaveText('Complied')
        } else if (!addFilesFileName) {
            await expect.soft(docUploadedTime).toHaveText('No file')
        }

        /**Modal validation */
        await docRow.click();
        await this.page.locator('.right-modal').waitFor({ state: 'visible' });
        await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(` ${docTitle} `);

        if (addFilesFileName) {
            await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addFilesFileName}.pdf `);
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible();
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible();
        };
        if (daysFromCurrentDate !== undefined)
            await expect.soft(this.page.locator('.right-modal__label-value')).toHaveText(expirationDate);
        if (description)
            await expect.soft(this.page.locator('.right-modal__description-value', { hasText: description })).toBeVisible();


        await this.page.locator('.close').click()

        return docRow.getAttribute('id')

    }

    async createDocumentFolder(docFolderTitle: string, folderId?: string[]) {
        await this.page.getByLabel('Documents').getByText('add_circle_outline').click()
        await this.page.getByRole('menuitem', { name: 'New Folder' }).click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Folder' })).toBeVisible()
        await this.page.getByRole('textbox', { name: 'Title' }).fill(docFolderTitle)
        await this.page.getByRole('button', { name: 'Save' }).click()

        const responsePromise = await this.page.waitForResponse(
            response => response.url() === `${this.apiUrlWeb}/document-folder/create` && response.request().method() === 'POST')
        const entityResponseBody = await responsePromise.json()
        expect.soft(responsePromise.status()).toEqual(200)
        
        if (responsePromise.status() === 200) folderId?.push(entityResponseBody.data.id)

        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ` Folder was created successfully! ` })).toBeVisible()
        await this.page.locator('app-notification-bar .close-btn').click()
        const docFolderRow = this.page.locator('app-document-folder-row', { hasText: docFolderTitle })
        await docFolderRow.getByText(docFolderTitle).hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: docFolderTitle })).toBeVisible()
        await expect(docFolderRow.locator('.number-of-docs')).toHaveText(' no files ')

        return await docFolderRow.locator('mat-expansion-panel').getAttribute('data-folder-id')

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
        daysFromCurrentDate,
        addFilesFileName,
        description,
    }: CreateDocumentOptions, documentId?: string[]) {
        const docColors = {
            red: 'color: rgb(232, 44, 63);',
            orange: 'color: rgb(255, 173, 32);',
            green: 'color: rgb(72, 200, 118);',
            blue: 'color: rgb(120, 185, 228);',
            ocean: 'color: rgb(86, 168, 221);',
            grey: 'color: rgb(218, 218, 218);',
        };

        const docFolderRow = this.page.locator('app-document-folder-row', { hasText: folderTitle })
        await docFolderRow.click()
        expect.soft(await docFolderRow.locator('mat-expansion-panel-header').getAttribute('aria-expanded')).toEqual('true')
        /** entity creation */
        await docFolderRow.getByText('Add file').click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Document' })).toBeVisible()
        await this.page.getByRole('textbox', { name: 'Title' }).fill(docTitle)

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
        }
        if (description) {
            await this.page.getByRole('textbox', { name: 'description' }).fill(description)
        }

        await this.page.getByRole('button', { name: 'Save' }).click()

        const responsePromise = await this.page.waitForResponse(
            response => response.url() === `${this.apiUrlWeb}/document/create` && response.request().method() === 'POST')
        const entityResponseBody = await responsePromise.json()
        expect.soft(responsePromise.status()).toEqual(200)
        if (responsePromise.status() === 200) documentId?.push(entityResponseBody.data.id);

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Document was created successfully! ' })).toBeVisible()
        await this.page.locator('app-document-row', { hasText: docTitle }).waitFor({ state: 'attached' })
        /** row validation */
        const numberOfFiles = await docFolderRow.locator('app-document-row').count()
        await expect.soft(docFolderRow.locator('.number-of-docs')).toHaveText(` ${numberOfFiles} files `)
        const docRow = docFolderRow.locator('app-document-row', { hasText: docTitle })
        await docRow.getByText(docTitle).hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: docTitle })).toBeVisible()

        if (addFilesFileName)
            await expect.soft(docRow.locator('.file-number-container span')).toHaveText('1');
        await expect.soft(docRow.locator('mat-icon', { hasText: addFilesFileName ? 'attach_file' : 'help_outline' })).toBeVisible()

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

        if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 4) {
            await this.checkFolderStatusAndTooltip('Expire Soon', docColors.red, docUploadedTime, folderStatus, docColors.red)
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 31) {
            await this.checkFolderStatusAndTooltip('Expire Soon', docColors.orange, docUploadedTime, folderStatus, docColors.orange)
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate > 30) {
            await this.checkFolderStatusAndTooltip('Complied', docColors.green, docUploadedTime, folderStatus)
        } else if (!addFilesFileName) {
            await this.checkFolderStatusAndTooltip('No file', docColors.grey, docUploadedTime, folderStatus)
        }
        /** modal validation */
        await docRow.click()
        await this.page.locator('.right-modal__body').waitFor({ state: 'visible' })
        await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(` ${docTitle} `)

        if (addFilesFileName) {
            await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addFilesFileName}.pdf `)
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        }
        if (daysFromCurrentDate !== undefined) 
            await expect.soft(this.page.locator('.right-modal__label-value')).toHaveText(expirationDate)
        if (description) 
            await expect.soft(this.page.getByRole('textbox', {name: 'description'})).toHaveValue(description)
        
        await this.page.locator('.close').click()

        return docRow.getAttribute('id')
    }


}

interface CreateChecklistItemOptions {
    checklistTitle: string;
    checklistItemTitle: string;
    addFilesFileName?: string;
    description?: string;
}

export class MemberChecklistTab extends HelperBase {
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
        /** entity creation */
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
        /** row validation */
        const checklistFolderRow = this.page.locator('app-checklist-row', { hasText: checklistTitle })
        await checklistFolderRow.getByText(checklistTitle).hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: checklistTitle })).toBeVisible()
        await expect.soft(checklistFolderRow.locator('.number-of-checklist-item')).toHaveText(' 0 Items ')
        await expect.soft(checklistFolderRow.locator('.check__created')).toHaveText(` Created ${await this.currentDate('-')} `)

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

        return checklistResponseBody.data.id
    }
    async addChecklistItem({ checklistTitle, checklistItemTitle, addFilesFileName, description }: CreateChecklistItemOptions) {
        const checklistFolderRow = this.page.locator('app-checklist-row', { hasText: checklistTitle })
        await checklistFolderRow.click()
        expect.soft(await checklistFolderRow.locator('mat-expansion-panel-header').getAttribute('aria-expanded')).toEqual('true')
        await checklistFolderRow.getByText('Add Field').click()

        await this.page.getByRole('textbox', { name: 'Title' }).fill(checklistItemTitle)

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

        await checklistItemRow.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'open' }).click()

        await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(checklistItemTitle);

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

    async checkChecklistItemByCheckbox({ checklistTitle, checklistItemTitle }: CreateChecklistItemOptions) {
        const checklistFolderRow = this.page.locator('app-checklist-row', { hasText: checklistTitle })
        const checklistItemRow = checklistFolderRow.locator('app-checklist-item-row', { hasText: checklistItemTitle })

        await checklistItemRow.getByRole('checkbox').click()
        await expect.soft(this.page.locator('mat-dialog-container h1', { hasText: 'Check item as DONE' })).toBeVisible()

        await expect.soft(this.page.locator('mat-dialog-content').first()).toHaveText(` Are you sure you want to check the ${checklistItemTitle} checklist item as DONE? `);
        await this.page.getByRole('button', { name: 'check' }).click();

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
        } else if (uncheckedCheckboxes) {
            await expect.soft(checklistFolderRow.locator('.status-circle[style="background-color: rgb(218, 218, 218);"]')).toHaveText(` ${uncheckedCheckboxes} `)
        }
    }

}

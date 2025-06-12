import { Page, expect, APIRequestContext, Locator } from "@playwright/test";
import { HelperBase} from "../helperBase";


export class CompanyViewPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request

    }

}

interface CreateDocumentOptions {
    folderTitle?: string;
    docTitle: string;
    visibleToDriver?: boolean;
    daysFromCurrentDate?: number;
    addFilesFileName?: string;
    description?: string;
}

export class CompanyDocumentsTab extends HelperBase {
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
        visibleToDriver,
        daysFromCurrentDate,
        addFilesFileName,
        description,
    }: CreateDocumentOptions, documentId?: string[]) {
        const redstyleAttributeColor = 'color: rgb(232, 44, 63);'
        const orangestyleAttributeColor = 'color: rgb(255, 173, 32);'

        await this.page.getByLabel('Documents').getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Add new item' })).toBeVisible()
        await this.page.getByLabel('Documents').getByText('add_circle_outline').click()
        await this.page.getByRole('menuitem', { name: 'Add new item' }).click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Document' })).toBeVisible()
        await this.page.getByRole('textbox', { name: 'Title' }).fill(docTitle)


        if (visibleToDriver) {
            await this.page.getByRole('switch', { name: 'visible to driver' }).click()
            expect.soft(this.page.locator('mat-error')).toHaveText(' One of these fields is required ')
            expect.soft(this.page.locator(`[formcontrolname="visible_to_driver"]`).getByRole('switch', { checked: true })).toBeTruthy()
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
        if (visibleToDriver) {
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
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 4) {
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
        visibleToDriver,
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

        await docFolderRow.getByText('Add file').click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Document' })).toBeVisible()
        await this.page.getByRole('textbox', { name: 'Title' }).fill(docTitle)


        if (visibleToDriver) {
            await this.page.getByRole('switch', { name: 'visible to driver' }).click()
            expect.soft(this.page.locator('mat-error')).toHaveText(' One of these fields is required ')
            expect.soft(this.page.locator(`[formcontrolname="visible_to_driver"]`).getByRole('switch', { checked: true })).toBeTruthy()
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
        }
        if (description) {
            await this.page.getByRole('textbox', { name: 'description' }).fill(description)
        }

        await this.page.getByRole('button', { name: 'Save' }).click()
        // After SAVE

        const responsePromise = await this.page.waitForResponse(response => response.url() === `${this.apiUrlWeb}/document/create` && response.request().method() === 'POST')
        const entityResponseBody = await responsePromise.json()
        expect.soft(responsePromise.status()).toEqual(200)
        if (responsePromise.status() === 200) documentId?.push(entityResponseBody.data.id);

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Document was created successfully! ' })).toBeVisible()
        await this.page.locator('app-document-row', { hasText: docTitle }).waitFor({ state: 'attached' })
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

        if (visibleToDriver) {
            await expect.soft(docRow.locator('mat-icon', { hasText: 'folder_shared' })).toBeVisible()
            await docRow.locator('mat-icon', { hasText: 'folder_shared' }).hover()
            await expect.soft(this.tooltip('Shared with driver')).toBeVisible()
        }
        if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 4) {
            await this.checkFolderStatusAndTooltip('Expire Soon', docColors.red, docUploadedTime, folderStatus, docColors.red)
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate < 31) {
            await this.checkFolderStatusAndTooltip('Expire Soon', docColors.orange, docUploadedTime, folderStatus, docColors.orange)
        } else if (daysFromCurrentDate !== undefined && daysFromCurrentDate > 30) {
            await this.checkFolderStatusAndTooltip('Complied', docColors.green, docUploadedTime, folderStatus)
        } else if (!addFilesFileName) {
            await this.checkFolderStatusAndTooltip('No file', docColors.grey, docUploadedTime, folderStatus)
        }

        await docRow.click()
        await this.page.locator('.right-modal').waitFor({ state: 'visible' })
        await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(` ${docTitle} `)

        if (addFilesFileName) {
            await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addFilesFileName}.pdf `)
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        }

        if (daysFromCurrentDate !== undefined) {
            await expect.soft(this.page.locator('.right-modal__label-value')).toHaveText(expirationDate)
        }

        if (description) {
            await expect.soft(this.page.locator('.right-modal__description-value', { hasText: description })).toBeVisible()
        }

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

export class CompanyChecklistTab extends HelperBase {
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

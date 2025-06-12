import { Page, expect, APIRequestContext, Locator } from "@playwright/test";
import { HelperBase} from "../helperBase";



interface AddTrailerOptions {
    trailerAvatarFileName?: string,
    makeName: string,
    unitNumber: string,
    plateNumber: string,
    owner?: string,
    onHold?: string,
    type?: string,
    vin?: string,
    length?: string,
    emptyWeight?: string,
    axles?: string,
    tireSize?: string,
    color?: string,
    year?: string,
    otherInfo?: string,
}

export class ActiveTrailersPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request

    }
    async addTrailer({ trailerAvatarFileName, makeName, unitNumber, plateNumber, owner, onHold, type, vin, length, emptyWeight, axles, tireSize, color, year, otherInfo }: AddTrailerOptions, trailerId?: string[]) {
        const trailerModal = this.page.locator('app-trailer-addit')
        const trailerCard = this.page.locator('mat-card .card__wrap', { hasText: `UNIT ${unitNumber}` }).filter({ hasText: makeName })

        await this.page.locator('mat-icon', { hasText: 'add_circle_outline' }).hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Add Trailer' })).toBeVisible()
        await this.page.locator('mat-icon', { hasText: 'add_circle_outline' }).click()
        await expect.soft(trailerModal).toBeVisible()

        /**Creation part*/
        if (trailerAvatarFileName) {
            await this.page.locator('input[type="file"]').setInputFiles(`./test_data/${trailerAvatarFileName}`)
            expect.soft(await this.page.locator('app-trailer-addit app-avatar img').getAttribute('src')).toContain('data:image/')
        }
        await trailerModal.getByRole('textbox', { name: 'make name' }).fill(makeName)
        await trailerModal.getByRole('textbox', { name: 'unit number' }).fill(unitNumber)
        await trailerModal.getByRole('textbox', { name: 'plate number' }).fill(plateNumber)
        await trailerModal.getByRole('textbox', { name: 'owner' }).fill(owner ? owner : '')
        if (onHold) {
            await this.page.getByRole('combobox', { name: 'on hold' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'on hold' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: onHold }).click()
        }
        if (type) {
            await this.page.getByRole('combobox', { name: 'Type' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'Type' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: type }).click()
        }
        await trailerModal.getByRole('textbox', { name: 'vin' }).fill(vin ? vin : '')
        await trailerModal.getByRole('textbox', { name: 'length' }).fill(length ? length : '');
        await trailerModal.getByRole('textbox', { name: 'empty weight' }).fill(emptyWeight ? emptyWeight : '');
        await trailerModal.getByRole('textbox', { name: 'axles' }).fill(axles ? axles : '');
        await trailerModal.getByRole('textbox', { name: 'tire Size' }).fill(tireSize ? tireSize : '');
        /** @Todo add file color if the shadow-root will be opened */
        await trailerModal.getByRole('textbox', { name: 'year' }).fill(year ? year : '');
        await trailerModal.getByRole('textbox', { name: 'other' }).fill(otherInfo ? otherInfo : '');

        await this.page.getByRole('button', { name: 'save' }).click();
        const entityResponse = await this.page.waitForResponse(response => response.url().includes(`${this.apiUrlWeb}/trailer/create`) && response.request().method() === 'POST');
        const entityResponseBody = await entityResponse.json();
        expect(entityResponse.status()).toEqual(200);
        if (entityResponse.status() === 200) trailerId?.push(entityResponseBody.data.id);


        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Trailer was created successfully! ' })).toBeVisible()

        /**Card validation */
        if (trailerAvatarFileName)
            expect.soft(await trailerCard.locator('app-avatar img').getAttribute('src')).toContain(trailerAvatarFileName)
        await trailerCard.locator('app-avatar').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: `Open Trailer : ${makeName}` })).toBeVisible()

        /**Side panel validation */
        await trailerCard.locator('app-avatar').click()
        await this.page.locator('.card-wrapper').waitFor({ state: 'attached' })

        await expect.soft(this.page.locator('.entity-name')).toHaveText(makeName)
        await expect.soft(this.page.locator('.entity-subtitle')).toHaveText(`UNIT ${unitNumber}`)
        if (onHold === 'Yes') {
            expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'on hold' }).getByRole('switch', { checked: true })).toBeTruthy()
        } else if (onHold === 'No') {
            expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'on hold' }).getByRole('switch', { checked: false })).toBeTruthy()
        }
        await expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'no driver' })).toBeVisible()
        await expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'no truck' })).toBeVisible()
        await expect.soft(this.page.locator('.info-row', { hasText: 'owner' }).locator('.text-right')).toHaveText(owner ? ` ${owner} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'year' }).locator('.text-right')).toHaveText(year ? ` ${year} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'vin' }).locator('.text-right')).toHaveText(vin ? ` ${vin} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'plate number' }).locator('.text-right')).toHaveText(plateNumber ? ` ${plateNumber} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'length' }).locator('.text-right')).toHaveText(length ? ` ${length} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'weight' }).locator('.text-right')).toHaveText(emptyWeight ? ` ${emptyWeight} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'axles' }).locator('.text-right')).toHaveText(axles ? ` ${axles} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'tire' }).locator('.text-right')).toHaveText(tireSize ? ` ${tireSize} ` : '')
        /** @Todo if color  */
        await expect.soft(this.page.locator('.other-info')).toHaveText(otherInfo ? ` ${otherInfo} ` : '')

        return entityResponseBody.data.id
    }
    async openTrailerkProfile(makeName: string, unitNumber: string) {
        await this.page.locator('mat-card .card__wrap', { hasText: `UNIT ${unitNumber}` }).filter({ hasText: makeName }).locator('app-avatar').click()
        await this.page.locator('.card-wrapper').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('.entity-name')).toHaveText(makeName)
        await expect.soft(this.page.locator('.entity-subtitle')).toHaveText(`UNIT ${unitNumber}`)
    }

}
export class TrailerViewPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request


    }

    async editTrailerInfo({ trailerAvatarFileName, makeName, unitNumber, plateNumber, owner, onHold, type, vin, length, emptyWeight, axles, tireSize, color, year, otherInfo }: AddTrailerOptions) {
        const trailerModal = this.page.locator('app-trailer-addit')

        await this.page.locator('.options-button').click()
        await expect(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()

        await this.page.locator('.addit-title').waitFor({ state: 'attached' })

        /**Creation part*/
        if (trailerAvatarFileName) {
            await this.page.locator('input[type="file"]').setInputFiles(`./test_data/${trailerAvatarFileName}`)
            expect.soft(await this.page.locator('app-trailer-addit app-avatar img').getAttribute('src')).toContain('data:image/')
        }
        await trailerModal.getByRole('textbox', { name: 'make name' }).fill(makeName)
        await trailerModal.getByRole('textbox', { name: 'unit number' }).fill(unitNumber)
        await trailerModal.getByRole('textbox', { name: 'plate number' }).fill(plateNumber)
        await trailerModal.getByRole('textbox', { name: 'owner' }).fill(owner ? owner : '')
        if (onHold) {
            await this.page.getByRole('combobox', { name: 'on hold' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'on hold' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: onHold }).click()
        }
        if (type) {
            await this.page.getByRole('combobox', { name: 'type' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'type' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: type }).click()
        }
        await trailerModal.getByRole('textbox', { name: 'vin' }).fill(vin ? vin : '')
        await trailerModal.getByRole('textbox', { name: 'length' }).fill(length ? length : '');
        await trailerModal.getByRole('textbox', { name: 'empty weight' }).fill(emptyWeight ? emptyWeight : '');
        await trailerModal.getByRole('textbox', { name: 'axles' }).fill(axles ? axles : '');
        await trailerModal.getByRole('textbox', { name: 'tire Size' }).fill(tireSize ? tireSize : '');
        /** @Todo add file color if the shadow-root will be opened */
        await trailerModal.getByRole('textbox', { name: 'year' }).fill(year ? year : '');
        await trailerModal.getByRole('textbox', { name: 'other' }).fill(otherInfo ? otherInfo : '');

        await this.page.getByRole('button', { name: 'save' }).click();

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' });
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Trailer was updated successfully! ' })).toBeVisible();

        /**Validation part 1 */
        if (trailerAvatarFileName)
            expect.soft(await this.page.locator('app-trailer-info app-avatar img').getAttribute('src')).toContain(trailerAvatarFileName)
        if (onHold === 'Yes') {
            expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'on hold' }).getByRole('switch', { checked: true })).toBeTruthy()
        } else if (onHold === 'No') {
            expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'on hold' }).getByRole('switch', { checked: false })).toBeTruthy()
        }
        await expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'no driver' })).toBeVisible()
        await expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'no truck' })).toBeVisible()
        await expect.soft(this.page.locator('.info-row', { hasText: 'owner' }).locator('.text-right')).toHaveText(owner ? ` ${owner} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'year' }).locator('.text-right')).toHaveText(year ? ` ${year} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'vin' }).locator('.text-right')).toHaveText(vin ? ` ${vin} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'plate number' }).locator('.text-right')).toHaveText(plateNumber ? ` ${plateNumber} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'length' }).locator('.text-right')).toHaveText(length ? ` ${length} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'weight' }).locator('.text-right')).toHaveText(emptyWeight ? ` ${emptyWeight} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'axles' }).locator('.text-right')).toHaveText(axles ? ` ${axles} ` : '')
        await expect.soft(this.page.locator('.info-row', { hasText: 'tire' }).locator('.text-right')).toHaveText(tireSize ? ` ${tireSize} ` : '')
        /** @Todo if color */
        await expect.soft(this.page.locator('.other-info')).toHaveText(otherInfo ? ` ${otherInfo} ` : '')

        /**Validation part 2 */
        await this.page.locator('.options-button').click()
        await expect(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()

        await this.page.locator('.addit-title').waitFor({ state: 'attached' })
        await expect(this.page.locator('.addit-title')).toHaveText(makeName)

        expect.soft(await this.page.locator('app-trailer-addit app-avatar img').getAttribute('src')).toContain(trailerAvatarFileName)
        await expect.soft(trailerModal.getByRole('textbox', { name: 'make name' })).toHaveValue(makeName)
        await expect.soft(trailerModal.getByRole('textbox', { name: 'unit number' })).toHaveValue(unitNumber)
        await expect.soft(trailerModal.getByRole('textbox', { name: 'plate number' })).toHaveValue(plateNumber)
        await expect.soft(trailerModal.getByRole('textbox', { name: 'owner' })).toHaveValue(owner ? owner : '')
        await expect.soft(this.page.getByRole('combobox', { name: 'on hold' })).toHaveText(onHold === 'Yes' ? 'Yes' : 'No')
        await expect.soft(trailerModal.getByRole('combobox', { name: 'type' })).toHaveText(type ? type : '');
        await expect.soft(trailerModal.getByRole('textbox', { name: 'vin' })).toHaveValue(vin ? vin : '')
        await expect.soft(trailerModal.getByRole('textbox', { name: 'length' })).toHaveValue(length ? length : '');
        await expect.soft(trailerModal.getByRole('textbox', { name: 'empty weight' })).toHaveValue(emptyWeight ? emptyWeight : '');
        await expect.soft(trailerModal.getByRole('textbox', { name: 'axles' })).toHaveValue(axles ? axles : '');
        await expect.soft(trailerModal.getByRole('textbox', { name: 'tire Size' })).toHaveValue(tireSize ? tireSize : '');
        /** @Todo add file color if the shadow-root will be opened */
        await expect.soft(trailerModal.getByRole('textbox', { name: 'year' })).toHaveValue(year ? year : '');
        await expect.soft(trailerModal.getByRole('textbox', { name: 'other' })).toHaveValue(otherInfo ? otherInfo : '');

        await this.page.locator('button.close').click()

    }
    async disableOnHold(makeName: string, unitNumber: string) {
        const trailerCard = this.page.locator('mat-card .card__wrap', { hasText: `UNIT ${unitNumber}` }).filter({ hasText: makeName })
        expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'on hold' }).getByRole('switch', { checked: true })).toBeTruthy()
        await expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'on hold (enable on hold automation test)' })).toBeVisible()

        this.page.locator('[class="row my-2"]', { hasText: 'on hold' }).getByRole('switch', { checked: true }).click()

        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' On hold was disabled successfully! ' })).toBeVisible()
        expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'on hold' }).getByRole('switch', { checked: false })).toBeTruthy()
        await expect.soft(this.page.locator('.info-row', { hasText: '(enable on hold automation test)' })).not.toBeVisible()

        await this.page.locator('.options-button').click()
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()
        await expect.soft(this.page.getByRole('combobox', { name: 'hold' })).toHaveText('No')
        await this.page.locator('button.close').click()

        await this.page.locator('a i.ew-trailer').click()
        await expect.soft(this.page.locator('app-header .breadcrumbs__item', { hasText: 'Trailers' })).toBeVisible()
        await trailerCard.waitFor({ state: 'attached' })
        await expect.soft(trailerCard.locator('mat-icon[color="warn"]')).not.toBeVisible()

    }
    async enableOnHold(makeName: string, unitNumber: string) {
        const trailerCard = this.page.locator('mat-card .card__wrap', { hasText: `UNIT ${unitNumber}` }).filter({ hasText: makeName })
        const switchState = await this.page.locator('[class="row my-2"]', { hasText: 'on hold' }).getByRole('switch').getAttribute('aria-checked')

        if (switchState === 'true') {
            this.page.locator('[class="row my-2"]', { hasText: 'on hold' }).getByRole('switch', { checked: true }).click()
            await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' On hold was disabled successfully! ' })).toBeVisible()
        }
        await this.page.locator('[class="row my-2"]', { hasText: 'on hold' }).getByRole('switch', { checked: false }).click()
        await expect.soft(this.page.locator('.modal-dialog__content', { hasText: `Are you sure you want to activate on hold trailer ${unitNumber}` })).toBeVisible()
        await this.page.getByRole('textbox').fill('enable on hold automation test')
        await this.page.getByRole('button', { name: 'confirm' }).click()

        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' On hold was activated successfully! ' })).toBeVisible()
        expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'on hold' }).getByRole('switch', { checked: true })).toBeTruthy()
        await expect.soft(this.page.locator('[class="row my-2"]', { hasText: 'on hold (enable on hold automation test)' })).toBeVisible()

        await this.page.locator('.options-button').click()
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'edit' }).click()
        await expect.soft(this.page.getByRole('combobox', { name: 'hold' })).toHaveText('Yes')
        await this.page.locator('button.close').click()

        await this.page.locator('a i.ew-trailer').click()
        await expect.soft(this.page.locator('app-header .breadcrumbs__item', { hasText: 'Trailers' })).toBeVisible()
        await trailerCard.waitFor({ state: 'attached' })
        await trailerCard.locator('mat-icon[color="warn"]').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'On hold. Reason - enable on hold automation test' })).toBeVisible()
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

export class TrailerDocumentsTab extends HelperBase {
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

        return docRow.getAttribute('id')


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

        const responsePromise = await this.page.waitForResponse(response => response.url() === `${this.apiUrlWeb}/document/create` && response.request().method() === 'POST')
        const entityResponseBody = await responsePromise.json()
        expect.soft(responsePromise.status()).toEqual(200)
        if (responsePromise.status() === 200) documentId?.push(entityResponseBody.data.id);
        // After SAVE

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

export class TrailerChecklistTab extends HelperBase {
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
        expect(checklistResponse.status()).toEqual(200);
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
interface AddPhotoOptions {
    description?: string
    fileName: string,
};
export class TrailerPhotosTab extends HelperBase {
    readonly request: APIRequestContext;

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile);
        this.request = request;

    };

    async addPhoto({ description, fileName }: AddPhotoOptions, photoId?: string[]) {
        
        await this.page.getByLabel('photos').getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Add photo' })).toBeVisible()
        /** Photo Creation */
        await this.page.getByLabel('photos').getByText('add_circle_outline').click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'New Photo' })).toBeVisible()
        
        await this.page.getByRole('textbox', { name: 'description' }).fill(description ? description : '')

        await this.page.locator('[type="file"]').setInputFiles(`./test_data/${fileName}`)
        await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
        
        await this.page.getByRole('button', { name: 'SAVE' }).click()

        const photoResponse = await this.page.waitForResponse(response => response.url().includes(`${this.apiUrlWeb}/photo/create`) && response.request().method() === 'POST')
        const photoResponseBody = await photoResponse.json()
        expect(photoResponse.status()).toEqual(200);
        if (photoResponse.status() === 200) photoId?.push(photoResponseBody.data.id);

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Photo was created successfully! ' })).toBeVisible()

        /** Card validation */
        await expect.soft(this.page.locator('app-photo-card-item', {hasText: description})).toBeVisible()
        expect.soft(await this.page.locator('app-photo-card-item', {hasText: description}).locator('img').getAttribute('src')).toContain(fileName)
        /** Modal validation */
        await this.page.locator('app-photo-card-item', {hasText: description}).click()
        await expect.soft(this.page.locator('.right-modal__title span', { hasText: description })).toBeVisible()
        await this.page.locator('.right-modal__body').waitFor({ state: 'attached' })

        expect.soft(await this.page.locator('.right-modal__docs img').getAttribute('src')).toContain(fileName)
        await expect.soft(this.page.locator('.file__info .title')).toHaveText(` ${fileName} `)
        await expect.soft(this.page.locator('app-file mat-icon', {hasText: 'remove_red_eye'})).toBeVisible()
        await expect.soft(this.page.locator('app-file mat-icon', {hasText: 'download'})).toBeVisible()
        await expect.soft(this.page.locator('.right-modal__description-value')).toHaveText(` ${description} `)
        await expect.soft(this.page.getByRole('button', {name: 'edit'})).toBeVisible()
        await this.page.locator('button.close').click()

        return photoResponseBody.data.id
    }

}

interface AddServiceOptions {
    serviceTitle: string,
    category: string,
    miles?: string,
    location: string,
    serviceDate: number,
    addFilesFileName?: string,
    description?: string
};
export class TrailerServiceTab extends HelperBase {
    readonly request: APIRequestContext;

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile);
        this.request = request;

    };

    async addService({ serviceTitle, category, miles, location, serviceDate, addFilesFileName, description }: AddServiceOptions, serviceId?: string[]) {
        /** Creation part */
        await this.page.getByLabel('Service').getByText('add_circle_outline').hover();
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Add service' })).toBeVisible();
        await this.page.getByLabel('Service').getByText('add_circle_outline').click();
        await expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Add new' })).toBeVisible();

        await this.page.getByRole('textbox', { name: 'Title' }).fill(serviceTitle);

        await this.page.getByRole('combobox', { name: 'Category' }).click();
        expect.soft(await this.page.getByRole('combobox', { name: 'Category' }).getAttribute('aria-expanded')).toEqual('true');
        await this.page.locator('mat-option', { hasText: category }).locator('mat-pseudo-checkbox').click();
        await this.page.getByRole('button', { name: 'ok' }).click();
        if (miles)
            await this.page.locator('[formcontrolname="miles"]').fill(miles);
        await this.page.getByRole('textbox', { name: 'Location' }).pressSequentially(location, { delay: 100 })
        await this.page.locator('.pac-item').first().waitFor({state: 'visible'})
        await this.page.locator('.pac-item').first().click()
        let expectedDate = ''
        await this.page.locator('[formcontrolname="date"]').click();
        await expect.soft(this.page.locator('.mat-calendar ')).toBeVisible();
        expectedDate = await this.selectDaysFromCurrentDate(serviceDate, false, 'date');

        if (addFilesFileName) {
            await this.page.locator('mat-expansion-panel', { hasText: 'add files' }).click()
            await this.page.locator('[type="file"]').setInputFiles(`./test_data/${addFilesFileName}.pdf`)
            await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
        }
        await this.page.locator('[formcontrolname="description"]').fill(description ? description : '');

        await this.page.getByRole('button', { name: 'save' }).click()

        const serviceResponse = await this.page.waitForResponse(response => response.url().includes(`${this.apiUrlWeb}/trailer-service/create`) && response.request().method() === 'POST')
        const serviceResponseBody = await serviceResponse.json()
        expect(serviceResponse.status()).toEqual(200);
        if (serviceResponse.status() === 200) serviceId?.push(serviceResponseBody.data.id);

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' });
        //await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Trailer Service was created successfully! ' })).toBeVisible();
        /** Entity row validation */
        const serviceRow = this.page.locator('tbody tr', { hasText: serviceTitle })
        await serviceRow.locator('.maintenance-table__title .text-ellipsis').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: serviceTitle })).toBeVisible()
        await expect.soft(serviceRow.locator('.mat-column-service_categories .text-ellipsis span')).toHaveText(category)
        await expect.soft(serviceRow.locator('.mat-column-miles')).toHaveText(miles ? ` ${miles} ` : ` 0 `)
        await expect.soft(serviceRow.locator('.mat-column-date')).toHaveText(` ${expectedDate} `)
        /** Modal validation */
        this.page.locator('tbody tr', { hasText: serviceTitle }).click()
        await expect.soft(this.page.locator('.right-modal__title span', { hasText: serviceTitle })).toBeVisible()
        await this.page.locator('.right-modal__body').waitFor({ state: 'attached' })
    
        if (addFilesFileName) {
            await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${addFilesFileName}.pdf `);
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' inventory_2 ' })).toBeVisible();
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible();
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible();
        }
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Categories' }).locator('.right-modal__label-value li')).toHaveText(category)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Miles' }).locator('.right-modal__label-value')).toHaveText(miles ? ` ${miles} ` : ` 0 `)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Location' }).locator('.right-modal__label-value')).toContainText(` ${location} `)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Date' }).locator('.right-modal__label-value')).toHaveText(` ${expectedDate} `)
        if(description)
            await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Description' }).locator('.right-modal__label-value')).toHaveText(description)
        await expect.soft(this.page.getByRole('button', { name: 'edit' })).toBeVisible()
        await this.page.locator('button.close').click()

        return serviceResponseBody.data.id
    }
}


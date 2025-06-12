import { Page, expect, APIRequestContext, BrowserContext, Browser,} from "@playwright/test";
import { HelperBase } from "../helperBase";

interface CredentialsOptions{
    title: string,
    username: string,
    password: string,
    link?: string,
    expDate?: number,
    viewer?: string,
    editor?: boolean,
    comment?: string,
}

export class CredentialsPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request

    }

    async createCredential({title, username, password, link, expDate, viewer, editor, comment}: CredentialsOptions, credId?: string[]) {
        const credentialRow = this.page.locator('mat-row', { hasText: title });
        
        await this.page.getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Add new credential' })).toBeVisible()
        await this.page.getByText('add_circle_outline').click()
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(' New Credential ')
        /** credential creation */
        await this.page.getByRole('textbox', { name: 'title' }).fill(title)
        await this.page.getByRole('textbox', { name: 'username' }).fill(username)
        await this.page.getByRole('textbox', { name: 'password' }).fill(password)
        await this.page.getByRole('textbox', { name: 'link' }).fill(link ? link : '')
        let dateToAssert = ''
        if (expDate !== undefined) {
            await this.page.waitForTimeout(500)
            await this.page.getByRole('button', {name: 'calendar'}).click()
            await expect.soft(this.page.locator('.mat-calendar')).toBeVisible()
            dateToAssert = await this.selectDaysFromCurrentDate(expDate, true, 'password_expiration_date')
        }
        if(!expDate) await this.page.waitForTimeout(2000);
        if (viewer){
            const viewerOption = this.page.getByRole('option', { name: viewer})
            await this.page.getByRole('combobox', { name: 'Viewer' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'viewer' }).getAttribute('aria-expanded')).toEqual('true')
            await viewerOption.click()
            if (editor) {
                await viewerOption.getByRole('switch').click()
                expect.soft(viewerOption.getByRole('switch', {checked: true})).toBeTruthy()
            }
         }
        await this.page.keyboard.press('Escape')
        expect.soft(await this.page.getByRole('combobox', { name: 'viewer' }).getAttribute('aria-expanded')).toEqual('false')
        await this.page.getByRole('textbox', { name: 'comment' }).fill(comment ? comment : '')
        await this.page.getByRole('button', {name: 'save'}).click({force: true})

        const entityCopyPromise = await this.page.waitForResponse(response => response.url()
            .includes(`${this.apiUrlWeb}/credential/create?company_ids=`) && response.request().method() === 'POST');
        const entityResponseBody = await entityCopyPromise.json()
        expect.soft(entityCopyPromise.status()).toEqual(200)
        if (entityCopyPromise.status() === 200) credId?.push(`${entityResponseBody.data.id}`)
        
        await expect.soft(this.page.locator('app-notification-bar .text')).toHaveText(" The credential was created successfully! View")
        await this.page.locator('app-notification-bar .close-btn').click()

        /** row validation */
        await this.page.locator('mat-row', { hasText: title }).waitFor({state: 'visible'})
        await expect.soft(credentialRow.locator('.title-cell')).toHaveText(` ${title} `)
        await expect.soft(credentialRow.locator('.mat-column-username')).toHaveText(` ${username} `)
        await expect.soft(credentialRow.locator('.mat-column-username .ew-copy')).toBeVisible()
        await credentialRow.locator('.mat-column-password .ew-eye').click()
        await expect.soft(credentialRow.locator('.mat-column-password')).toHaveText(` ${password} `)
        await expect.soft(credentialRow.locator('.mat-column-password .ew-copy')).toBeVisible()
        if (link) {
            await expect.soft(credentialRow.locator('.mat-column-link')).toContainText(` ${link} `)
            await expect.soft(credentialRow.locator('.mat-column-link .ew-copy')).toBeVisible()
            await expect.soft(credentialRow.locator('.mat-column-link .open-link')).toBeVisible()
        }
        await expect.soft(credentialRow.locator('.mat-column-expireDate')).toHaveText(expDate ? ` ${dateToAssert} ` : ' - ')
        await expect.soft(credentialRow.locator('.status-chip span')).toHaveText('Active')
        await expect.soft(credentialRow.locator('.status-chip')).toHaveCSS('background-color', 'rgb(72, 200, 118)')
        /** modal validation */
        await credentialRow.hover()
        await credentialRow.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'Details' }).click()

        await this.page.locator('.right-modal').waitFor({ state: 'visible' })
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(` ${title} `)

        await expect.soft(this.page.locator('.right-modal .status-chip span')).toHaveText('Active')
        await expect.soft(this.page.locator('.right-modal .status-chip')).toHaveCSS('background-color', 'rgb(72, 200, 118)')
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'username' }).locator('.right-modal__label-value'))
            .toHaveText(username);
        await this.page.locator('.right-modal .display-password').click()
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'password' }).locator('.right-modal__label-value'))
            .toHaveText(` ${password} `);
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'link' }).locator('.right-modal__label-value'))
            .toHaveText(link ? link : '');
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Customers' }).locator('.right-modal__label-value'))
            .toHaveText(viewer ? viewer : '');
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'comment' }).locator('.right-modal__label-value'))
            .toHaveText(comment ? comment : '-');
        await expect.soft(this.page.getByRole('button', { name: 'edit' })).toBeVisible()
        await this.page.locator('button.close').click()


    }

}

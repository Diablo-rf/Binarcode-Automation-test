import { Page, expect } from "@playwright/test";
import { HelperBase } from "../helperBase";

interface MessageOptions {
    credentials: string,
    messageText?: string,
    file?: string,
    messageTime?: string

}
export class ChatPage extends HelperBase {

    constructor(page: Page, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)

    }

    async addContact(credentials: string) {
        await this.page.locator('.add-contact').click()
        await this.page.locator('app-search-popover').waitFor({state: 'visible'})
        await this.page.getByRole('menuitem', {name: credentials}).click()
        await this.page.getByRole('progressbar').first().waitFor({ state: 'detached' })
        await expect.soft(this.page.locator('app-contacts app-chat-item', {hasText: credentials})).toBeVisible()
        await expect.soft(this.page.locator('app-messenger app-chat-item .contact-name')).toHaveText(` ${credentials} `)
        await expect.soft(this.page.locator('.messages-row')).toHaveText(' There are no messages yet. ')

    }
    async sendMessage({credentials, messageText}: MessageOptions) {
        const messageSender = await this.page.locator('app-header .__user-tab .full_name').textContent()
        await this.page.locator('app-contacts app-chat-item', {hasText: credentials}).click()
        await this.page.getByRole('progressbar').first().waitFor({ state: 'detached' })

        if (messageText)
            await this.page.locator('app-messenger').getByRole('textbox').pressSequentially(messageText, {delay: 50});
        await this.page.locator('app-messenger').getByRole('button', {name: 'send'}).click()
        await expect.soft(this.page.locator('app-message-item', {hasText: messageText})).toBeVisible()
        return messageSender
    }
    async sendfile({credentials, file}: MessageOptions) {
        const fileSender = await this.page.locator('app-header .__user-tab .full_name').textContent() || ''
        await this.page.locator('app-contacts app-chat-item', {hasText: credentials}).click()
        await this.page.getByRole('progressbar').first().waitFor({ state: 'detached' })
        await this.page.locator('app-messenger mat-icon', {hasText: 'attach_file'}).click()
        await this.page.locator('app-messenger app-file-select-mini [type="file"]').setInputFiles(`./test_data/${file}`)
        await this.page.waitForTimeout(3000)
        await expect.soft(this.page.locator('app-messenger .cross-file-delete mat-icon', {hasText: 'cancel'})).toBeVisible()
        await expect.soft(this.page.locator('app-messenger .file-counter-indicator')).toHaveText(' 1 ')
        await this.page.locator('app-messenger').getByRole('button', {name: 'send'}).click()
        const messageTime = await this.currentTime() || ''
        const fileMessage = this.page.locator('app-message-item', {hasText: messageTime})
        await fileMessage.locator('app-file').waitFor({state: 'visible'})
        await expect.soft(fileMessage.locator('app-file .title')).toHaveText(` ${file} `)
        await expect.soft(fileMessage.locator('app-file .file__icon', {hasText: 'remove_red_eye'})).toBeVisible()
        await expect.soft(fileMessage.locator('app-file .file__icon', {hasText: 'file_download'})).toBeVisible()
        return {sender: fileSender, time: messageTime} 
    }
    async checkChat({credentials, messageText, file, messageTime}: MessageOptions) {
        await this.page.waitForTimeout(1000)
        await expect.soft(this.page.locator('app-contacts app-chat-item', {hasText: credentials})
            .locator('.unread-indicator')).toBeVisible()
        await this.page.locator('app-contacts app-chat-item', {hasText: credentials}).click()
        await this.page.getByRole('progressbar').first().waitFor({ state: 'detached' })
        const fileMessage = this.page.locator('app-message-item', {hasText: messageTime})
        if (messageText) {
            await expect.soft(this.page.locator('app-message-item', {hasText: messageText})).toBeVisible()
        }else {
            await expect.soft(fileMessage.locator('app-file', {hasText: file})).toBeVisible()
            await expect.soft(fileMessage.locator('app-file .file__icon', {hasText: 'remove_red_eye'})).toBeVisible()
            await expect.soft(fileMessage.locator('app-file .file__icon', {hasText: 'file_download'})).toBeVisible()

        }
    }
}
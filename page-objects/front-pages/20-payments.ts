import { Page, expect } from "@playwright/test";
import { HelperBase } from "../helperBase";

function purposeDetails(purpose: string, amount?: string) {
    const purposeText =
        purpose === 'SAS Service' ? `Easy Way subscription. Calculated for: ${amount} driver(s)`
            : purpose === 'Easyway Service' ? `Easy Way Consulting service. Calculated for: ${amount} driver(s)`
                : purpose === 'PSP Report' ? `PSP report for Jose Davis`
                    : purpose === 'MVR Report' ? `MVR report for John Doe`
                        : purpose === 'QD Order Test' ? `Drug test for John Doe`
                            : 'Easy Way training: DOT Drug and Alcohol'

    return purposeText
}

interface PaymentsOptions {
    paymentPurpose: string
    amount: string
    user: string
    expectedPRstatus?: string
    paymentId?: string
    expectedPHstatus?: string
    drivers?: string
}

export class PaymentRequestsPage extends HelperBase {

    constructor(page: Page, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)

    }

    async checkPaymentRequest({ paymentPurpose, amount, user, expectedPRstatus, paymentId, expectedPHstatus, drivers }: PaymentsOptions) {
        const purposeArray = ['QD Order Test', 'SAS Service', 'Easyway Service']
        
        await this.page.getByRole('tab', { name: 'Payment Requests' }).click()
        await this.page.getByRole('progressbar').waitFor({ state: 'detached' })
        /** row validation */
        const paymentRow = this.page.locator('mat-table mat-row').filter({ hasText: `${paymentPurpose}` })
        if (paymentId)
            await expect.soft(paymentRow.locator('.cdk-column-code div')).toHaveText(` #${paymentId} `);
        await expect.soft(paymentRow.locator('.cdk-column-created_by div')).toHaveText(` ${user} `)
        //if (paymentPurpose === 'QD Order Test' || 'SAS Service')
        if (purposeArray.includes(paymentPurpose)) {
            await expect.soft(paymentRow.locator('.cdk-column-dueDate div'))
            .toHaveText( paymentPurpose === 'QD Order Test' ? ` ${await this.currentDate('-', 4)} ` : ` ${await this.currentDate('-', 5)} `);
        } else {
            await expect.soft(paymentRow.locator('.cdk-column-dueDate div'))
            .toHaveText(' - ')
        }
        await expect.soft(paymentRow.locator('.cdk-column-amount')).toHaveText(` $ ${amount} `)
        await expect.soft(paymentRow.locator('.status-chip span')).toHaveText(`${expectedPRstatus}`)
        /**  modal validation */
        await paymentRow.hover()
        await paymentRow.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'details' }).click()

        await this.page.locator('.right-modal').waitFor({ state: 'visible' });
        await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(` ${paymentPurpose} `);
        await this.page.getByRole('progressbar').waitFor({ state: 'detached' })
        await expect.soft(this.page.locator('.right-modal .status-chip span').first()).toHaveText(expectedPRstatus ? expectedPRstatus : '')
        if (paymentId) {
            await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Code' })
                .locator('.right-modal__label-value')).toHaveText(` #${paymentId} `)
        }
        if (purposeArray.includes(paymentPurpose)) {
            await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Due Date' }).locator('.right-modal__label-value'))
            .toHaveText( paymentPurpose === 'QD Order Test' ? ` ${await this.currentDate('-', 4)} ` : ` ${await this.currentDate('-', 5)} `);
        } else {
            await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Due Date' }).locator('.right-modal__label-value'))
            .toHaveText('')
        }
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Created by' })
            .locator('.right-modal__label-value')).toHaveText(user)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Amount' })
            .locator('.right-modal__label-value')).toHaveText(` $ ${amount} `)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Purpose' })
            .locator('.right-modal__label-value')).toHaveText(` ${purposeDetails(paymentPurpose, drivers)} `)
        await expect.soft(this.page.locator('.payment-status .status-chip span')).toHaveText(`${expectedPHstatus}`)

        await this.page.getByRole('tab', { name: 'activity' }).click()
        await this.page.getByRole('progressbar').waitFor({ state: 'detached' })
        await expect.soft(this.page.locator('.activity__item', { hasText: `${user} created new entry` })
            .locator('.activity__date')).toContainText(`${await this.currentDate('-')}`)
        await expect.soft(this.page.locator('.activity__item', { hasText: `${user} accepted the payment request` })
            .locator('.activity__date')).toContainText(`${await this.currentDate('-')}`)

        await this.page.locator('button.close').click()

    }
}

export class PaymentHistoryPage extends HelperBase {

    constructor(page: Page, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)

    }
    async checkPayment({ paymentPurpose, amount, user, expectedPHstatus, drivers }: PaymentsOptions) {
        await this.page.getByRole('tab', { name: 'Payment History' }).click()
        await this.page.getByRole('progressbar').waitFor({ state: 'detached' })
        /** row validation */
        const paymentRow = this.page.locator('mat-table mat-row').filter({ hasText: `${paymentPurpose}` })
        await expect.soft(paymentRow.locator('.cdk-column-paid_by div')).toHaveText(` ${user} `)
        await expect.soft(paymentRow.locator('.cdk-column-paid_date div')).toHaveText(` ${await this.currentDate('-')} `)
        await expect.soft(paymentRow.locator('.cdk-column-amount')).toHaveText(` $ ${amount} `)
        if (paymentPurpose !== 'QD Order Test') {
            await expect.soft(paymentRow.locator('mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible({ timeout: 10000 })
            await expect.soft(paymentRow.locator('mat-icon', { hasText: ' download ' })).toBeVisible()
        } else {
            await paymentRow.locator('mat-icon', { hasText: ' info ' }).hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'The amount will be captured when subject will arrive at the lab' })).toBeVisible()
        }
        await expect.soft(paymentRow.locator('.status-chip span')).toHaveText(`${expectedPHstatus}`)
        /** modal validation */
        await paymentRow.hover()
        await paymentRow.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'details' }).click()

        await this.page.locator('.right-modal').waitFor({ state: 'visible' });
        await expect.soft(this.page.locator('app-right-modal-title h3 span')).toHaveText(` ${paymentPurpose} `);
        await this.page.getByRole('progressbar').waitFor({ state: 'detached' })
        await expect.soft(this.page.locator('.right-modal .status-chip span')).toHaveText(expectedPHstatus ? expectedPHstatus : '')
        if (paymentPurpose !== 'QD Order Test') {
            await expect.soft(this.page.locator('.right-modal app-file .title', { hasText: 'invoice' })).toBeVisible()
            await expect.soft(this.page.locator('.right-modal mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
            await expect.soft(this.page.locator('.right-modal mat-icon', { hasText: ' download ' })).toBeVisible()
        }
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Paid by' })
            .locator('.right-modal__label-value')).toHaveText(`${user}`)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Paid Date' })
            .locator('.right-modal__label-value')).toHaveText(`${await this.currentDate('-')}`)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Amount' })
            .locator('.right-modal__label-value')).toHaveText(`$ ${amount}`)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Card Details' })
            .locator('.right-modal__label-value')).toHaveText(' Visa****4242 ')
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Purpose' })
            .locator('.right-modal__label-value')).toHaveText(`${purposeDetails(paymentPurpose, drivers)}`)

        await this.page.getByRole('tab', { name: 'activity' }).click()
        await this.page.getByRole('progressbar').waitFor({ state: 'detached' })
        await expect.soft(this.page.locator('.activity__item', { hasText: `${user} created new entry` })
            .locator('.activity__date')).toContainText(`${await this.currentDate('-')}`)
        if (paymentPurpose !== 'QD Order Test') {
            const invoiceActivity = this.page.locator('.activity__item', { hasText: 'Invoice generated' })
            await expect.soft(invoiceActivity.locator('.activity__date')).toContainText(`${await this.currentDate('-')}`)
            await expect.soft(invoiceActivity.locator('app-file .title', { hasText: 'invoice' })).toBeVisible()
            await expect.soft(invoiceActivity.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible()
            await expect.soft(invoiceActivity.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible()
        }

        await this.page.locator('button.close').click()


    }

}
export class PaymentSetupPage {
    readonly page: Page

    constructor(page: Page) {
        this.page = page
    }


}
import { Page, expect } from "@playwright/test";
import { HelperBase } from "../helperBase";

function currencyToString(input: string, amountToAdd: number): string {
    const numericValue = parseFloat(input.replace(/[$,]/g, ''));
    const updatedValue = numericValue + amountToAdd;
    return `$${updatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export class MyCompanyPage extends HelperBase {

    constructor(page: Page, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)

    }

    async openTab(tabName: string) {
        await this.page.getByRole('tab', { name: tabName }).click()
        await expect.soft(this.page.locator('button', { hasText: tabName })).toHaveAttribute('aria-selected', 'true')
    }

    async topUpBalance(topUpAmount: number) {
        const balanceText = await this.page.locator('[class="flex gap-8"]', { hasText: 'balance' }).locator('p', { hasText: '$' })
            .textContent() || ''
        console.log('initial balance: '+balanceText);
        await this.page.locator('label', { hasText: '100' }).click()
        await expect.soft(this.page.locator('label', { hasText: '100' }).locator('button')).toHaveAttribute('aria-checked', 'true')
        await this.page.getByRole('button', { name: 'top-up' }).click()
        await expect.soft(this.page.locator('[role="alertdialog"] .mb-4')).toHaveText(`You are about to add $${topUpAmount}.00 to your balance.`)
        await this.page.getByRole('button', { name: 'yes' }).click()
        const responsePromise = await this.page.waitForResponse(response => 
            response.url() === `${this.apiUrlWeb}/restify/tenants/actions?action=topup` && response.request().method() === 'POST')
        expect.soft(responsePromise.status()).toEqual(200)
        await this.page.getByRole('status').waitFor({ state: 'visible' })
        await expect.soft(this.page.getByRole('status').first()).toContainText('Top-up successful.')
        
        const balanceToAssert = currencyToString(balanceText, topUpAmount)
        await expect(this.page.locator('[class="flex gap-8"]', { hasText: 'balance' }).locator('p', { hasText: '$' }))
            .toHaveText(balanceToAssert)
        console.log(`balance after top-up by ${topUpAmount}: `+balanceToAssert);
    }
}
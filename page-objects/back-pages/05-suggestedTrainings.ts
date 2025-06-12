import { APIRequestContext, Page, expect } from "@playwright/test";
import { HelperBase } from "../helperBase";

interface AddEwTrainingOptions {
    title: string,
    price: string,
    difficulty?: string,
    cover?: string,
    category?: string,
    fileName?: string,
    about?: string, 
    description?: string,
    youTubeUrl?: string, 
}
export class SuggestedTrainingsPage extends HelperBase {

    readonly request: APIRequestContext
    backUrl: string
    backAuthToken: string

    constructor(page: Page, request: APIRequestContext, backUrl: string, backAuthToken: string, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request
        this.backUrl = backUrl
        this.backAuthToken = backAuthToken

    }

    setPage(page: Page) {
        this.page = page;
    }
    
    async createEwTraining({title, price, difficulty, cover, category, fileName, about, description, youTubeUrl}: AddEwTrainingOptions, trainingId?: string[]) {
        const aboutFrameLocator = this.page.frameLocator('#suggestedtraining-about_ifr')
        const descriptionFrameLocator = this.page.frameLocator('#suggestedtraining-description_ifr')
        
        await this.page.locator('[data-original-title="Add new"]').click()
        if (about || description)
            await this.page.waitForResponse('https://stageback.easyway.pro/assets/eb1af097/skins/content/default/content.css', {timeout: 20000})
        await expect.soft(this.page.locator('.box-title')).toHaveText('Create Suggested Training')
        /** creation part */
        await this.page.getByRole('textbox', {name: 'title'}).fill(title)
        await this.page.locator('.field-suggestedtraining-price input').fill(price)
        await this.page.locator('select', {hasText: 'easy'}).selectOption(difficulty ? difficulty : 'easy')
        
        if (cover)
            await this.page.locator('[type="file"]#suggestedtraining-cover').setInputFiles(`./test_data/${cover}`)
        await this.page.locator('select', {hasText: 'Security'}).selectOption(category ? category : 'Security and Emergency Response')
        if (fileName)
            await this.page.locator('[type="file"]#suggestedtraining-files').setInputFiles(`./test_data/${fileName}`)
        if (about)
            await aboutFrameLocator.locator('body[data-id="suggestedtraining-about"] p').evaluate((element, aboutText) => {
            element.textContent = aboutText
        }, about)
        if (description)
            await descriptionFrameLocator.locator('body[data-id="suggestedtraining-description"] p').evaluate((element, descriptionText) => {
            element.textContent = descriptionText
        }, description)
        await this.page.getByRole('textbox', {name: 'youtube'}).fill(youTubeUrl ? youTubeUrl : '')
        
        const updateId = this.page.waitForResponse(response => response.url().includes(`${this.backUrl}suggested-training/update?id=`) && response.status() === 200)
        await this.page.getByRole('button', {name: 'save'}).click()

        const updateIdResponse = await updateId
        const updateIdBody = updateIdResponse.url()
        const urlParams = new URLSearchParams(updateIdBody.split('?')[1]); // Extract query params
        const id = urlParams.get('id')
        if (updateIdResponse.status() === 200) trainingId?.push(id ? id : 'id not pushed');
    
        /** page validation */
        await expect.soft(this.page.locator('.box-title', {hasText: `Update Suggested Training: ${title}`})).toBeVisible()
        await expect.soft(this.page.locator('.alert-success', {hasText: 'Changes successfully saved.'})).toBeVisible()
        if (about || description)
            await this.page.waitForResponse('https://stageback.easyway.pro/assets/eb1af097/skins/content/default/content.css', {timeout: 20000})

        await expect.soft(this.page.getByRole('textbox', {name: 'title'})).toHaveValue(title)
        await expect.soft(this.page.locator('.field-suggestedtraining-price input')).toHaveValue(`${price}.00`)
        if (difficulty)
            expect.soft(await this.page.locator(`#suggestedtraining-difficulty option`, {hasText: difficulty}).getAttribute('selected')).toBe('')
        if (category)
            expect.soft(await this.page.locator(`#suggestedtraining-training_category_id option`, {hasText: category}).getAttribute('selected')).toBe('')
        if (about)
            await expect.soft(aboutFrameLocator.locator('body p')).toHaveText(about)
        if (description)
            await expect.soft(descriptionFrameLocator.locator('body p')).toHaveText(description)
        if (cover)    
            expect.soft(await this.page.locator('fieldset', {hasText: 'cover'}).locator('img').getAttribute('src')).toContain('data:image')
        if (fileName)
            expect.soft(await this.page.locator('fieldset', {hasText: 'files'}).locator('td a', {hasText: fileName})).toBeVisible()
        if (youTubeUrl)
            await expect.soft(this.page.getByRole('textbox', {name: 'youtube'})).toHaveValue(youTubeUrl)

        return urlParams.get('id')

    }
    async createEwTrainingFixture({title, price, difficulty, cover, category, fileName, about, description, youTubeUrl}: AddEwTrainingOptions) {
        const aboutFrameLocator = this.page.frameLocator('#suggestedtraining-about_ifr')
        const descriptionFrameLocator = this.page.frameLocator('#suggestedtraining-description_ifr')
        
        await this.page.locator('[data-original-title="Add new"]').click()
        if (about || description)
            await this.page.waitForResponse('https://stageback.easyway.pro/assets/eb1af097/skins/content/default/content.css', {timeout: 20000})
        await expect.soft(this.page.locator('.box-title')).toHaveText('Create Suggested Training')
        /** creation part */
        await this.page.getByRole('textbox', {name: 'title'}).fill(title)
        await this.page.locator('.field-suggestedtraining-price input').fill(price)
        await this.page.locator('select', {hasText: 'easy'}).selectOption(difficulty ? difficulty : 'easy')
        
        if (cover)
            await this.page.locator('[type="file"]#suggestedtraining-cover').setInputFiles(`./test_data/${cover}`)
        await this.page.locator('select', {hasText: 'Security'}).selectOption(category ? category : 'Security and Emergency Response')
        if (fileName)
            await this.page.locator('[type="file"]#suggestedtraining-files').setInputFiles(`./test_data/${fileName}`)
        if (about)
            await aboutFrameLocator.locator('body[data-id="suggestedtraining-about"] p').evaluate((element, aboutText) => {
            element.textContent = aboutText
        }, about)
        if (description)
            await descriptionFrameLocator.locator('body[data-id="suggestedtraining-description"] p').evaluate((element, descriptionText) => {
            element.textContent = descriptionText
        }, description)
        await this.page.getByRole('textbox', {name: 'youtube'}).fill(youTubeUrl ? youTubeUrl : '')
        
        const updateId = this.page.waitForResponse(response => response.url().includes(`${this.backUrl}suggested-training/update?id=`) && response.status() === 200)
        await this.page.getByRole('button', {name: 'save'}).click()

        const updateIdResponse = await updateId
        const updateIdBody = updateIdResponse.url()
        const urlParams = new URLSearchParams(updateIdBody.split('?')[1]); // Extract query params

        return urlParams.get('id')

    }
    async deleteTrainingByApi(request: APIRequestContext, entity_id: string | null){
         const trainingDelete = await request.post(`${this.backUrl}suggested-training/delete?id=${entity_id}`, {
            headers: {
                Authorization: this.backAuthToken,
                Cookie: await this.phpSessidCookie()
            },
        }) 
        expect(trainingDelete.status()).toEqual(200)
    }

}
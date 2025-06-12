import { Page, expect, APIRequestContext, Locator} from "@playwright/test";
import { HelperBase} from "../helperBase";

interface AddTrainingOptions {
    title: string,
    category: string,
    fileName?: string,
    youtubeUrl?: string,
    description: string, 
    difficulty: string,
    about?: string,  
    price?: string,
}
interface AddDriversOptions {
    trainingName: string,
    driverCredentials: string,
    attendedBefore?: boolean
}
interface AddQuestionOptions {
    trainingName: string,
    question: string,
    answer1: string,
    answer1Correct?: boolean,
    answer2: string,
    answer2Correct?: boolean,
    addNewAnswer?: boolean,
    answer3?: string,
    answer3Correct?: boolean
}

export class ActiveTrainingsPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request
    }

    async createTraining({title, category, fileName, youtubeUrl, description, difficulty}: AddTrainingOptions, trainingId?: string[]) {

        await this.page.getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Add new training' })).toBeVisible()
        await this.page.getByText('add_circle_outline').click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Training' })).toBeVisible()
        /** entity creation */
        await this.page.getByRole('textbox', {name: 'training name'}).fill(title)

        await this.page.getByRole('combobox', {name: 'training category'}).click()
        expect.soft(await this.page.getByRole('combobox', { name: 'training category' }).getAttribute('aria-expanded')).toEqual('true')
        await this.page.getByRole('option', { name: category }).click()

        if (fileName) {
            await this.page.locator('mat-expansion-panel', { hasText: 'add files' }).click()
            await this.page.locator('[type="file"]').setInputFiles(`./test_data/${fileName}.pdf`)
            await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
        }
        await this.page.getByRole('textbox', {name: 'youtube'}).fill(youtubeUrl ? youtubeUrl : '')
        await this.page.getByRole('textbox', {name: 'description'}).fill(description)

        await this.page.getByRole('combobox', {name: 'difficulty'}).click()
        expect.soft(await this.page.getByRole('combobox', { name: 'difficulty' }).getAttribute('aria-expanded')).toEqual('true')
        await this.page.getByRole('option', { name: difficulty }).click()

        await this.page.getByRole('button', {name: 'save'}).click()

        const entityResponse = await this.page.waitForResponse(
            response => response.url() === `${this.apiUrlWeb}/training/create` && response.request().method() === 'POST')
        const entityResponseBody = await entityResponse.json()
        expect.soft(entityResponse.status()).toEqual(200)
        if (entityResponse.status() === 200) trainingId?.push(entityResponseBody.data.id);

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Training was created successfully! ' })).toBeVisible()

        /** row validation */
        const trainingRow = this.page.locator('app-active-training-row', {hasText: title})

        await expect.soft(trainingRow.locator('.ew-book')).toBeVisible()
        await expect.soft(trainingRow.locator('.title')).toHaveText(title)
        await expect.soft(trainingRow.locator('.number-of-trainings.space-left')).toHaveText(' No participation ')
        await expect.soft(trainingRow.locator('.number-of-trainings.d-block')).toHaveText(` Created : ${await this.currentDate('-')} `)

        await trainingRow.hover()
        await trainingRow.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'view' }).click()
        /** modal validation */
        if (fileName) {
            await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${fileName}.pdf `);
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' remove_red_eye ' })).toBeVisible();
            await expect.soft(this.page.locator('app-file mat-icon', { hasText: ' download ' })).toBeVisible();
        }
        const rightModalLabel = (label: string): Locator => {
            return this.page.locator('.right-modal__label', { hasText: label }).locator('.right-modal__label-value')
        }
        await expect.soft(rightModalLabel('Training name')).toHaveText(` ${title} `)
        await expect.soft(rightModalLabel('Training description')).toHaveText(description)
        await expect.soft(rightModalLabel('Training category')).toHaveText(` ${category} `)
        await expect.soft(rightModalLabel('Difficulty')).toHaveText(` ${difficulty} `)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'YouTube URL:' }).locator('.right-modal__label-value a')).toHaveText(` ${youtubeUrl} `)
        await expect.soft(rightModalLabel('questions')).toHaveText(` 0 `)
        await expect.soft(rightModalLabel('easyway training')).toHaveText(` No `)
        await expect.soft(this.page.getByRole('button', {name: 'edit'})).toBeVisible()

        await this.page.locator('button.close').click()
        return entityResponseBody.data.id
    }
    async addDriverToTraining({trainingName, driverCredentials, attendedBefore}: AddDriversOptions) {
        const trainingRow = this.page.locator('app-active-training-row', {hasText: trainingName})
        const manageDrivers = trainingRow.locator('mat-card', {hasText: 'Manage drivers'})
        const driverModalRow = this.page.locator('.right-modal mat-card', {hasText: driverCredentials})
        const driverRow = manageDrivers.locator('mat-card', {hasText: driverCredentials})
        
        await trainingRow.click()
        expect.soft(await trainingRow.locator('mat-expansion-panel-header').getAttribute('aria-expanded')).toEqual('true')
        await expect.soft(manageDrivers).toBeVisible()
        await manageDrivers.getByRole('button').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Manage drivers' })).toBeVisible()
        await manageDrivers.getByRole('button').click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Manage Drivers' })).toBeVisible()
        await this.page.locator('.right-modal__body').waitFor({state: 'visible'})
        /** adding driver */
        await driverModalRow.getByRole('button', {name: 'assign'}).hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Assign driver to this training' })).toBeVisible()
        await expect.soft(driverModalRow.locator('.driver__item-subtitle')).toHaveText(' Never attended this training ')
        await driverModalRow.getByRole('button', {name: 'assign'}).click()

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Driver was assigned successfully! ' })).toBeVisible()
        /** modal validation */
        await expect.soft(driverModalRow.locator('.driver__item-subtitle')).toContainText(' 1 Pending ')
        await expect.soft(driverModalRow.locator('.mdc-button__label span')).toHaveText(' Assigned ')
        await this.page.getByRole('button', {name: 'done'}).click()
        /** driver row validation */
        await expect.soft(driverRow).toBeVisible()
        await expect.soft(driverRow.locator('.status-chip span')).toHaveText('Pending')
        await expect.soft(driverRow.locator('.training__user-entity')).toHaveText(` Added at:  ${await this.currentDate('-')} `)
        await expect.soft(driverRow.locator('.status-chip')).toHaveCSS('background-color', 'rgb(255, 194, 88)')
        await this.page.reload() // delete after the bug with training status is fixed
        await trainingRow.waitFor({state: 'visible'}) // delete after the bug with training status is fixed
        /** training row validation */
        await expect.soft(trainingRow.locator('.number-of-trainings.space-left')).toHaveText(' 1 Participation ')
        await expect.soft(trainingRow.locator('.status-circle')).toHaveText(' 1 ')
        await expect.soft(trainingRow.locator('.status-circle')).toHaveCSS('background-color', 'rgb(255, 173, 32)')
    }
    async addQuestionToTraining({trainingName, question, answer1, answer1Correct, answer2, answer2Correct}: AddQuestionOptions) {
        const trainingRow = this.page.locator('app-active-training-row', {hasText: trainingName})
        const addQuestions = trainingRow.locator('mat-card', {hasText: 'Add questions'})
        
        await trainingRow.click()
        expect.soft(await trainingRow.locator('mat-expansion-panel-header').getAttribute('aria-expanded')).toEqual('true')
        await expect.soft(addQuestions).toBeVisible()
        await addQuestions.getByRole('button').hover()
        await expect.soft(this.page.locator('mat-tooltip-component', { hasText: 'Add question' })).toBeVisible()
        await addQuestions.getByRole('button').click()
        expect.soft(this.page.locator('.right-modal__title span', { hasText: 'Add question' })).toBeVisible()
        await this.page.locator('.right-modal__body').waitFor({state: 'visible'})
        /** adding question */
        await this.page.getByRole('textbox', {name: 'question'}).fill(question)
        await this.page.getByRole('textbox', {name: 'answer 1'}).fill(answer1)
        if (answer1Correct){
            await this.page.getByRole('checkbox').first().check()
            await expect(this.page.getByRole('checkbox').first()).toBeChecked()
        } 
        await this.page.getByRole('textbox', {name: 'answer 2'}).fill(answer2)
        if (answer2Correct){
            await this.page.getByRole('checkbox').nth(1).check()
            await expect(this.page.getByRole('checkbox').nth(1)).toBeChecked()
        }  
        await this.page.getByRole('button', {name: 'save'}).click()

        await this.page.locator('app-notification-bar').waitFor({ state: 'attached' })
        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' Training Question was created successfully! ' })).toBeVisible()
        /** row validation */
        await expect.soft(this.page.locator('.training__card--question', {hasText: question})).toBeVisible()
        await expect.soft(this.page.locator('.training__card--question .help-icon')).toBeVisible()
        await expect.soft(this.page.locator('.training__card--question .training__user-title')).toHaveText(` ${question} `)
        await this.page.locator('.training__card--question', {hasText: question}).click()
        /** modal validation */
        expect.soft(this.page.locator('.right-modal__title span', { hasText: question })).toBeVisible()
        await this.page.locator('.right-modal__body').waitFor({state: 'visible'})
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'title' }).locator('.right-modal__label-value')).toHaveText(` ${question} `)
        await expect.soft(this.page.locator('.answers-block', { hasText: 'answer 1' }).locator('.right-modal__label', {hasText: 'answer 1'}).locator('.right-modal__label-value')).toHaveText(` ${answer1} `)
        await expect.soft(this.page.locator('.answers-block', { hasText: 'answer 1' }).locator(answer1Correct ? '.correct-answer' : '.wrong-answer')).toHaveText(answer1Correct ? ' Yes ' : ' No ')
        await expect.soft(this.page.locator('.answers-block', { hasText: 'answer 2' }).locator('.right-modal__label', {hasText: 'answer 2'}).locator('.right-modal__label-value')).toHaveText(` ${answer2} `)
        await expect.soft(this.page.locator('.answers-block', { hasText: 'answer 2' }).locator(answer2Correct ? '.correct-answer' : '.wrong-answer')).toHaveText(answer2Correct ? ' Yes ' : ' No ')
        await expect.soft(this.page.getByRole('button', {name: 'edit'})).toBeVisible()

        await this.page.locator('button.close').click()
    }
    

}

export class EasyWayTrainingsPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request
    }

    async selectAnEwTraining(trainingTitle: string, unlocked: boolean){
        const trainingCard = this.page.locator('app-training-card', {hasText: trainingTitle}).first()
        await trainingCard.click()
        await expect.soft(trainingCard.locator('.status-icon mat-icon')).toHaveText(unlocked ? ' lock_open ' : ' lock_outlined ')
        await this.page.locator('.__suggested-training').waitFor({state: 'attached'})
        await expect.soft(this.page.locator('.training-title')).toHaveText(trainingTitle)
    }

    async unlockTraining(trainingTitle: string, expectedPrice: string){
        await this.page.locator('app-suggested-training-view').getByRole('button', {name: ` Unlock for only $${expectedPrice}.00 `}).click()
        await expect.soft(this.page.locator('.modal-dialog__title', { hasText: 'Training unlock' })).toBeVisible()
        await expect.soft(this.page.locator('mat-dialog-content b').nth(1)).toHaveText(`Price: ${expectedPrice}.00$`)
        const modalText = await this.page.locator('.modal-dialog__content').allTextContents()

        if (modalText[0].includes('This payment will be processed automatically')) {
            await this.page.getByRole('button', { name: 'confirm' }).click()
            const trainingResponse = await this.page.waitForResponse(response => response.url().includes(`${this.apiUrlWeb}/suggested-training/unlock?id=`) && response.request().method() === 'POST', { timeout: 60000 })
            const responseBody = await trainingResponse.json()
            expect(trainingResponse.status()).toEqual(200)
            await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' This payment request will be automatically accepted and paid! ' })).toBeVisible()
            await this.page.reload()
            return responseBody.data
        } else {
            /**
             * @Todo Write the flow of the manual payment
             */
        }
        await this.page.locator('app-training-card', {hasText: trainingTitle}).click()
        await expect.soft(this.page.locator('app-training-card', {hasText: trainingTitle}).locator('.status-icon mat-icon')).toHaveText(' lock_open ')
        await this.page.locator('.__suggested-training').waitFor({state: 'attached'})
        await expect.soft(this.page.locator('.training-title')).toHaveText(trainingTitle)
        await expect.soft(this.page.locator('app-suggested-training-view').getByRole('button')).toHaveText(' Copy to my trainings ')

    }
    async copyTraining(trainingTitle: string, trainingId?: string[]){
        const trainingRow = this.page.locator('app-active-training-row', {hasText: trainingTitle})
        await this.page.locator('app-suggested-training-view').getByRole('button', {name: 'Copy to my trainings'}).click()
        const trainingResponse = await this.page.waitForResponse(response => response.url().includes(`${this.apiUrlWeb}/trainings?page=`) && response.request().method() === 'GET')
        expect(trainingResponse.status()).toEqual(200)
        const trainingResponseBody = await trainingResponse.json()
        if (trainingResponse.status() === 200) trainingId?.push(trainingResponseBody.data[0].id);

        await expect.soft(this.page.locator('app-notification-bar .text', { hasText: ' The training was successfully copied to your training list. ' })).toBeVisible()
        await expect.soft(this.page.locator('app-breadcrumbs li', {hasText: 'Active Trainings'})).toBeVisible()
        /** training validation on active trainings */
        await expect.soft(trainingRow).toBeVisible()
        await expect.soft(trainingRow.locator('.number-of-trainings.d-block')).toHaveText(`  Created : ${await this.currentDate('-')} `)
        await trainingRow.hover()
        await trainingRow.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await expect.soft(this.page.getByRole('menuitem', { name: 'edit' })).not.toBeVisible()
        await this.page.getByRole('menuitem', { name: 'view' }).click()

        const rightModalLabel = (label: string): Locator => {
            return this.page.locator('.right-modal__label', { hasText: label }).locator('.right-modal__label-value')
        }
        await expect.soft(rightModalLabel('Training name')).toHaveText(` ${trainingTitle} `)
        await expect.soft(rightModalLabel('EasyWay training:')).toHaveText(' Yes ')
        await expect.soft(this.page.getByRole('button', {name: 'edit'})).not.toBeVisible()
        
        return trainingResponseBody.data[0].id
    }
}

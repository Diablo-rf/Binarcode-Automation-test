import { Page, expect, APIRequestContext} from "@playwright/test";
import { HelperBase} from "../helperBase";

function entityApi(category: string, inFolder?: boolean) {

    let entityApiValue = ''
    category === 'DOCUMENTS' && inFolder == undefined ? entityApiValue = 'suggested-document-folder' :
    category === 'DOCUMENTS' && inFolder != undefined ? entityApiValue = 'suggested-document' :
    category === 'CHECKLISTS' ? entityApiValue = 'suggested-checklist' : 
    category === 'PHOTOS' ? entityApiValue = 'suggested-photo' :    
    category === 'PREVENTIVE MAINTENANCES' ? entityApiValue = 'suggested-preventive-maintenance' : ''    
    
    return entityApiValue
}
interface AddSuggestionOptions {
    inFolder?: boolean
    folderName?: string
    fileName?: string
    category: string
}
interface CreateSuggestedTaskOptions {
    taskName: string
    subtaskName?: string
    proof?: boolean
    category?: string
    daysRenew?: string
    dueDate?: string
    description?: string
}
interface CopySuggestedTaskOptions {
    taskName: string,
    subtaskName?: string,
    responsible?: string,
    targetType?: string,
    targetValue?: string,
    dueDateDays?: number
    proof?: boolean
}

export class SuggestionsPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request


    }

    async addSuggestedFile(
        {inFolder, folderName, fileName, category}: AddSuggestionOptions, suggestedItems?: string[]){
        await this.page.getByLabel(category).getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Add EasyWay Suggestions' })).toBeVisible()

        await this.page.getByLabel(category).getByText('add_circle_outline').click()
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(` SUGGESTED ${category} `)
        await this.page.getByRole('progressbar').waitFor({state: 'detached'})
        await this.page.locator('.right__suggestions-body').waitFor({state: 'visible'})
        
        if (inFolder) {
            const folderRow = this.page.locator('app-documents-copy-sugg .__container mat-expansion-panel', {hasText: folderName})
            await folderRow.click()
            await expect.soft(folderRow.locator('.mat-expansion-panel-body')).toBeVisible()
        }

        const fileRow = this.page.locator('mat-card', {hasText: fileName})
        await fileRow.hover()
        await fileRow.locator('.action__btn--copy').waitFor({state: 'visible'})
        await fileRow.locator('.action__btn--copy').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: await this.suggestionTooltip(category, inFolder) }))
            .toBeVisible();
        await fileRow.locator('.action__btn--copy').click()
        
        const fileCopyPromise = await this.page.waitForResponse(
            response => response.url().includes(
                `${this.apiUrlWeb}/${entityApi(category, inFolder)}/copy-ew?id=`) && response.request().method() === 'POST'
            );
        const entityResponseBody = await fileCopyPromise.json()
        expect.soft(fileCopyPromise.status()).toEqual(200)
        
        if (fileCopyPromise.status() === 200){
            const fileId = entityResponseBody.data.id
            if (category === 'DOCUMENTS') suggestedItems?.push(`document-${fileId}`)
            else if (category === 'PHOTOS') suggestedItems?.push(`photo-${fileId}`)
            else if (category === 'PREVENTIVE MAINTENANCES') suggestedItems?.push(`maintenance-${fileId}`)
        }
        await expect.soft(this.page.locator('app-notification-bar .text'))
            .toHaveText(` Easy Way suggestion ${fileName} was copied successfully! `)
        await this.page.getByRole('button', {name: 'done'}).click()

        await expect.soft(this.page.locator('.list-item-row', {hasText: fileName})).toBeVisible()
        
    }
    async addSuggestedFolder({folderName, category}: AddSuggestionOptions, suggestedFolders?: string[]) {
        await this.page.getByLabel(category).getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Add EasyWay Suggestions' })).toBeVisible()

        await this.page.getByLabel(category).getByText('add_circle_outline').click()
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(` SUGGESTED ${category} `)
        await this.page.locator('.right__suggestions-body-inner').waitFor({ state: 'visible' })

        const folderRow = this.page.locator('.__container mat-expansion-panel', { hasText: folderName })

        const itemsValue = await folderRow.locator('.number-of-checklist-item').textContent()
        const numberOfitems = itemsValue?.split(' ')[0]
        
        await folderRow.click()
        await expect.soft(folderRow.locator('.mat-expansion-panel-body')).toBeVisible()
        const numberOfFilesInFolder = await folderRow.locator('mat-card').count()
        expect.soft(numberOfitems).toEqual(numberOfFilesInFolder.toString())

        await folderRow.locator('mat-expansion-panel-header').hover()
        await folderRow.locator('mat-expansion-panel-header .action__btn--copy').waitFor({ state: 'visible' })
        await folderRow.locator('mat-expansion-panel-header .action__btn--copy').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: await this.suggestionTooltip(category) })).toBeVisible()
        await folderRow.locator('mat-expansion-panel-header .action__btn--copy').click()

        const entityCopyPromise = await this.page.waitForResponse(
            response => response.url().includes(
                `${this.apiUrlWeb}/${entityApi(category)}/copy-ew?id=`) && response.request().method() === 'POST'
            )

        const entityResponseBody = await entityCopyPromise.json()
        expect.soft(entityCopyPromise.status()).toEqual(200)

        if (entityCopyPromise.status() === 200){
            const fileId = entityResponseBody.data.id
            if (category === 'DOCUMENTS') suggestedFolders?.push(`document-${fileId}`)
            else if (category === 'CHECKLISTS') suggestedFolders?.push(`checklist-${fileId}`)
        }

        await expect.soft(this.page.locator('app-notification-bar .text'))
            .toHaveText(` Easy Way suggestion ${folderName} was copied successfully! `) 
        await this.page.getByRole('button', {name: 'done'}).click()

        await expect.soft(this.page.locator('.list-item-row', {hasText: folderName})).toBeVisible()
        await expect.soft(this.page.locator('.list-item-row', {hasText: folderName}).locator('.title span', {hasText: 'items'}))
            .toHaveText(` ${numberOfitems} items`);
        await this.page.locator('.list-item-row', {hasText: folderName}).click()
        await this.page.locator('.list-item-row', {hasText: folderName}).locator('.mat-expansion-panel-body').waitFor({state: 'visible'})
        const expectedNumberOfFilesInFolder = await this.page.locator('.entity__scroll .mat-expansion-panel-body mat-card').count()
        expect(expectedNumberOfFilesInFolder).toEqual(numberOfFilesInFolder)
        
        return {numberOfFiles: numberOfFilesInFolder}
    }

    async createSuggestedTask({taskName, proof, category, daysRenew, dueDate, description}: CreateSuggestedTaskOptions, suggestedTask?: string[]) {
        await this.page.getByLabel('Tasks').getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Add Suggested Task' })).toBeVisible()
        /** task creation */
        await this.page.getByLabel('Tasks').getByText('add_circle_outline').click()
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(' New Task ')
        await this.page.getByRole('textbox', {name: 'task name'}).fill(taskName)
        if (proof) this.page.getByRole('checkbox', {name: 'request proof'}).check();
        if (category){
            await this.page.waitForTimeout(1000)
            await this.page.getByRole('combobox', { name: 'Category' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'Category' }).getAttribute('aria-expanded')).toEqual('true')
            //await this.page.getByRole('option', { name: category, exact: true }).waitFor({state: 'visible'})
            await this.page.getByRole('option', { name: category, exact: true }).click()
        }
        await this.page.getByRole('spinbutton', {name: 'renew'}).fill( daysRenew ? daysRenew : '0')
        await this.page.getByRole('spinbutton', {name: 'due date'}).fill( dueDate ? dueDate : '0')
        await this.page.getByRole('textbox', {name: 'description'}).fill( description ? description : '-')
        await this.page.getByRole('button', {name: 'save'}).click()

        const entityCopyPromise = await this.page.waitForResponse(response => response.url()
            .includes(`${this.apiUrlWeb}/suggested-task/create?expand=owner&company_ids=`) && response.request().method() === 'POST');
        const entityResponseBody = await entityCopyPromise.json()
        expect.soft(entityCopyPromise.status()).toEqual(200)

        if (entityCopyPromise.status() === 200){
            const taskId = entityResponseBody.data.id
            suggestedTask?.push(`suggested-${taskId}`)
        }

        await expect.soft(this.page.locator('app-notification-bar .text')).toHaveText(" Suggested task was created successfully! View") 
        await this.page.locator('app-notification-bar .close-btn').click()
        /** row validation */
        const taskPanel = this.page.locator('mat-expansion-panel', {hasText: taskName});
        await expect.soft(taskPanel.locator('.number-of-tasks')).toHaveText(' no subtasks ')
        await expect.soft(taskPanel.locator('.info-col .text-ellipsis')).toHaveText(proof ? ' Yes ' : ' No' )
        /** modal validation */
        await taskPanel.hover()
        await taskPanel.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'Open' }).click()

        await this.page.locator('app-suggested-task-view mat-tab-body').waitFor({state: 'visible'})
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(` ${taskName} `)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Code' }).locator('.right-modal__label-value'))
        .toHaveText(`${entityResponseBody.data.id}`);
        await expect.soft(this.page.locator('app-task-view-info .right-modal__label', {hasText: 'request proof'})
            .locator('.right-modal__label-value')).toHaveText(proof ? 'Yes' : 'No');
        await expect.soft(this.page.locator('app-task-view-info .right-modal__label', { hasText: 'category' })
            .locator('.right-modal__label-value', {hasText: category ? category : ' None '})).toBeVisible()
        await expect.soft(this.page.locator('.right-modal__label', {hasText: 'renew'}).locator('.right-modal__label-value'))
            .toHaveText(daysRenew ? daysRenew : '0');
        await expect.soft(this.page.locator('.right-modal__label', {hasText: 'due date'}).locator('.right-modal__label-value'))
            .toHaveText(dueDate ? dueDate : '0');
        await expect.soft(this.page.locator('.right-modal__label', {hasText: 'description'}).locator('.right-modal__label-value'))
            .toHaveText(description ? description : '-');
        await expect.soft(this.page.getByRole('button', {name: 'edit'})).toBeVisible()
        await this.page.locator('button.close').click()
    }
    async createSuggestedSubtask({taskName, subtaskName, proof, category, description}: CreateSuggestedTaskOptions, suggestedSubtask?: string[]) {
        const taskPanel = this.page.locator('mat-expansion-panel', {hasText: taskName})
        /** subtask creation */
        await taskPanel.click()
        await expect.soft(taskPanel.locator('.mat-expansion-panel-body')).toBeVisible()

        await this.page.locator('mat-expansion-panel', {hasText: taskName}).getByText('add suggested subtask').click()
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(` New Subtask for ${taskName} `)
        await this.page.getByRole('textbox', {name: 'task name'}).fill(subtaskName ? subtaskName : '')
        if(proof) this.page.getByRole('checkbox', {name: 'request proof'}).check();
        await this.page.waitForTimeout(500)
        if (category){
            await this.page.getByRole('combobox', { name: 'Category' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'Category' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: category, exact: true }).click()
        }
        await this.page.getByRole('textbox', {name: 'description'}).fill( description ? description : '')
        await this.page.getByRole('button', {name: 'save'}).click()

        const entityCopyPromise = await this.page.waitForResponse(response => response.url()
            .includes(`${this.apiUrlWeb}/suggested-task/create?expand=owner&company_ids=`) && response.request().method() === 'POST');
        const entityResponseBody = await entityCopyPromise.json()
        expect.soft(entityCopyPromise.status()).toEqual(200)

        if (entityCopyPromise.status() === 200){
            const subtaskId = entityResponseBody.data.id
            suggestedSubtask?.push(`suggested-${subtaskId}`)
        }

        await expect.soft(this.page.locator('app-notification-bar .text')).toHaveText(" Suggested task was created successfully! View") 
        await this.page.locator('app-notification-bar .close-btn').click()
        /** subtask row validation */
        const itemsValue = await taskPanel.locator('.number-of-tasks').textContent()
        const numberOfitems = itemsValue?.split(' ')[1]
        
        const numberOfFilesInFolder = await taskPanel.locator('mat-card').count()
        expect.soft(numberOfitems).toEqual(numberOfFilesInFolder.toString())
        const subtaskRow = this.page.locator('app-suggested-task-row', {hasText: subtaskName})
        await expect.soft(subtaskRow.locator('.text-ellipsis', {hasText: 'request proof'}))
            .toHaveText(proof ? ' Request proof:  Yes ' : ' Request proof:  No ' )
        await expect.soft(subtaskRow.locator('.text-ellipsis', {hasText: 'description'}))
            .toHaveText(description ? ` Description:   ${description} ` : '' )
        /** subtask modal validation */
        await subtaskRow.hover()
        await subtaskRow.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'Open' }).click()
        await this.page.locator('app-suggested-task-view mat-tab-body').waitFor({state: 'visible'})
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(` ${subtaskName} `)
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Code' }).locator('.right-modal__label-value'))
        .toHaveText(`${entityResponseBody.data.id}`);
        await expect.soft(this.page.locator('app-task-view-info .right-modal__label', {hasText: 'request proof'})
            .locator('.right-modal__label-value')).toHaveText(proof ? 'Yes' : 'No');
        await expect.soft(this.page.locator('app-task-view-info .right-modal__label', { hasText: 'category' })
        .locator('.right-modal__label-value', {hasText: category ? category : ' None '})).toBeVisible()
        await expect.soft(this.page.locator('.right-modal__label', {hasText: 'description'}).locator('.right-modal__label-value'))
            .toHaveText(description ? description : '');
        await expect.soft(this.page.getByRole('button', {name: 'edit'})).toBeVisible()
        await this.page.locator('button.close').click()

        return numberOfFilesInFolder
    }

    async copySuggestedTask({taskName, responsible, targetType, targetValue, dueDateDays, proof}
        : CopySuggestedTaskOptions, copiedTaskId?: string[] ) {
        const taskPanel = this.page.locator('mat-expansion-panel-header', {hasText: taskName})
        const userName = await this.page.locator('.full_name').textContent() || ''
        /** task copy */
        const itemsValue = await taskPanel.locator('.number-of-tasks').textContent()
        const numberOfitems = itemsValue?.split(' ')[1]

        await taskPanel.hover()
        await taskPanel.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'Copy' }).click()
        await this.page.locator('app-suggested-task-copy mat-tab-body').waitFor({state: 'visible', timeout: 10000})
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(taskName)
        await expect.soft(this.page.getByRole('combobox', {name: 'responsible'})).toContainText(userName)
        if (responsible) {
            //TODO add the responsible selection
        }
        if (targetType){
            await this.page.getByRole('combobox', { name: 'Target Type' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'Target Type' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: targetType, exact: true }).click()
        }
        if (targetType && targetValue) 
            await this.page.locator('mat-tab-body').getByRole('textbox').fill(targetValue)
        await this.page.getByRole('button', {name: 'save'}).click()

        const entityCopyPromise = await this.page.waitForResponse(response => response.url()
            .includes(`${this.apiUrlWeb}/suggested-task/copy?`) && response.request().method() === 'POST');
        const entityResponseBody = await entityCopyPromise.json()
        expect.soft(entityCopyPromise.status()).toEqual(200)

        if (entityCopyPromise.status() === 200){
            const TaskId = entityResponseBody.data.id
            copiedTaskId?.push(`task-${TaskId}`)
        }

        await expect.soft(this.page.locator('app-notification-bar .text')).toHaveText(` Suggested task was copied successfully! `) 

        await this.page.locator('a em.ew-suitcase').click()
        await expect(this.page.locator('app-header .breadcrumbs__item', {hasText: 'Active Tasks'})).toBeVisible()
        await this.page.waitForLoadState('networkidle');
        /** task row validation */
        await expect.soft(taskPanel.locator('.task__id')).toHaveText(` #${entityResponseBody.data.id} `)
        await expect.soft(taskPanel.locator('.number-of-tasks', {hasText: 'subtasks'})).toHaveText(` ${numberOfitems} subtasks `)
        await expect.soft(taskPanel.locator('.title--customer')).toHaveText(responsible ? ` ${responsible} ` : ` ${userName}  (Me) `)
        await expect.soft(taskPanel.locator('.info-col .d-flex', {hasText: 'due date'}).locator('.text-ellipsis')).toHaveText(dueDateDays ? ` ${await this.currentDate('-', dueDateDays)}` : ' - ' )
        await expect.soft(taskPanel.locator('.info-col .d-flex', {hasText: 'proof'})).toHaveText(proof ? ' Request proof:  Yes ' : ' Request proof:  No ' )
        if (targetType) {
            if (targetType === 'Plain Text') {
                await expect.soft(taskPanel.locator('.number-of-tasks', {hasText: 'Target data'}).locator('.text-ellipsis')).toHaveText(targetValue ? targetValue : '')
            } else {
                await expect.soft(taskPanel.locator('.number-of-tasks', {hasText: 'Target data'}).locator('a')).toHaveText(targetValue ? ` ${targetValue} ` : '')
            }
        } else {
            await expect.soft(taskPanel.locator('.number-of-tasks', {hasText: 'Target data'}).locator('a')).toHaveText(' Target Data:  - ')
        }
        if (Number(numberOfitems) > 0){
            await expect.soft(taskPanel.locator('.task-count .status-circle')).toHaveText(` ${numberOfitems} `);
            await taskPanel.locator('[class="title title--task text-ellipsis"]', {hasText: taskName}).click()
            await this.page.locator('mat-expansion-panel', {hasText: taskName}).locator('mat-card').waitFor({state: 'visible'})
            const numberOfFilesInFolder = await this.page.locator('mat-expansion-panel', {hasText: taskName}).locator('mat-card').count()
            expect.soft(numberOfitems).toEqual(numberOfFilesInFolder.toString())
        }

    }
    async copySuggestedSubtask({taskName, subtaskName, responsible, targetType, targetValue, dueDateDays, proof}
        : CopySuggestedTaskOptions, copiedTaskId?: string[] ) {
        const taskPanel = this.page.locator('mat-expansion-panel', {hasText: taskName})
        const subtaskPanel = this.page.locator('mat-expansion-panel', {hasText: subtaskName})
        const userName = await this.page.locator('.full_name').textContent() || ''
        /** task copy */
        const itemsValue = await taskPanel.locator('.number-of-tasks').textContent()
        const numberOfitems = itemsValue?.split(' ')[1]

        await taskPanel.locator('app-suggested-task-row').hover()
        await taskPanel.locator('app-suggested-task-row mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'Copy' }).click()
        await this.page.locator('app-suggested-task-copy mat-tab-body').waitFor({state: 'visible', timeout: 10000})
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(subtaskName ? subtaskName : '')
        await expect.soft(this.page.getByRole('combobox', {name: 'responsible'})).toContainText(userName)
        if (responsible) {
            //TODO add the responsible selection
        }
        if (targetType){
            await this.page.getByRole('combobox', { name: 'Target Type' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'Target Type' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: targetType, exact: true }).click()
        }
        if (targetType && targetValue) 
            await this.page.locator('mat-tab-body').getByRole('textbox').fill(targetValue)
        await this.page.getByRole('button', {name: 'save'}).click()

        const entityCopyPromise = await this.page.waitForResponse(response => response.url()
            .includes(`${this.apiUrlWeb}/suggested-task/copy?`) && response.request().method() === 'POST');
        const entityResponseBody = await entityCopyPromise.json()
        expect.soft(entityCopyPromise.status()).toEqual(200)

        if (entityCopyPromise.status() === 200){
            const TaskId = entityResponseBody.data.id
            copiedTaskId?.push(`task-${TaskId}`)
        }

        await expect.soft(this.page.locator('app-notification-bar .text')).toHaveText(` Suggested task was copied successfully! `) 

        await this.page.locator('a em.ew-suitcase').click()
        await expect(this.page.locator('app-header .breadcrumbs__item', {hasText: 'Active Tasks'})).toBeVisible()
        await this.page.waitForLoadState('networkidle');
        /** task row validation */
        await expect.soft(subtaskPanel.locator('.task__id')).toHaveText(` #${entityResponseBody.data.id} `)
        await expect.soft(subtaskPanel.locator('.number-of-tasks', {hasText: 'subtasks'})).toHaveText(` no subtasks `)
        await expect.soft(subtaskPanel.locator('.title--customer')).toHaveText(responsible ? ` ${responsible} ` : ` ${userName}  (Me) `)
        await expect.soft(subtaskPanel.locator('.info-col .d-flex', {hasText: 'due date'}).locator('.text-ellipsis')).toHaveText(dueDateDays ? ` ${await this.currentDate('-', dueDateDays)}` : ' - ' )
        await expect.soft(subtaskPanel.locator('.info-col .d-flex', {hasText: 'proof'})).toHaveText(proof ? ' Request proof:  Yes ' : ' Request proof:  No ' )
        if (targetType) {
            if (targetType === 'Plain Text') {
                await expect.soft(subtaskPanel.locator('.number-of-tasks', {hasText: 'Target data'}).locator('.text-ellipsis')).toHaveText(targetValue ? targetValue : '')
            } else {
                await expect.soft(subtaskPanel.locator('.number-of-tasks', {hasText: 'Target data'}).locator('a')).toHaveText(targetValue ? ` ${targetValue} ` : '')
            }
        } else {
            await expect.soft(subtaskPanel.locator('.number-of-tasks', {hasText: 'Target data'}).locator('a')).toHaveText(' Target Data:  - ')
        }
        await this.page.locator('.task-status-circle mat-icon').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Pending' })).toBeVisible()
        await expect.soft(this.page.locator('.task-status-circle mat-icon')).toHaveCSS('color', 'rgb(255, 173, 32)');

    }
}



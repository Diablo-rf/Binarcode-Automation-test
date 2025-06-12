import { Page, expect, APIRequestContext } from "@playwright/test";
import { HelperBase } from "../helperBase";

interface CreateTaskOptions {
    taskName: string
    subtaskName?: string
    proof?: boolean
    responsible?: string
    dueDate?: number
    fileName?: string
    category?: string
    daysRenew?: string
    targetType?: string
    targetValue?: string
    description?: string
}

interface MarkAsDoneParams {
    taskName: string
    subtaskName?: string
    dueDate?: boolean
    subtasks?: boolean
    daysRenew?: number
    modal?: boolean
}

export class TasksPage extends HelperBase {
    readonly request: APIRequestContext

    constructor(page: Page, request: APIRequestContext, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)
        this.request = request
    }

    async createTask({ taskName, proof, responsible, dueDate, fileName, category, daysRenew, targetType, targetValue, description
    }: CreateTaskOptions, taskId?: string[]) {
        const taskPanel = this.page.locator('mat-expansion-panel', { hasText: taskName });
        const userName = await this.page.locator('.full_name').textContent() || ''

        await this.page.getByLabel('Tasks').getByText('add_circle_outline').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Add Task' })).toBeVisible()
        /** task creation */
        await this.page.getByLabel('Tasks').getByText('add_circle_outline').click()
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(' New Task ')
        await this.page.getByRole('textbox', { name: 'task title' }).fill(taskName)
        if (proof) this.page.getByRole('checkbox', { name: 'request proof' }).check();
        if (responsible) {
            //TODO add the responsible selection
        }
        let dueDateToAssert = ''
        if (dueDate !== undefined) {
            await this.page.waitForTimeout(1000)
            await this.page.getByRole('button', {name: 'calendar'}).click()
            await expect.soft(this.page.locator('.mat-calendar')).toBeVisible()
            dueDateToAssert = await this.selectDaysFromCurrentDate(dueDate, true, 'due_date')
        }
        if (fileName) {
            await this.page.locator('mat-expansion-panel', { hasText: 'add files' }).click()
            await this.page.locator('[type="file"]').setInputFiles(`./test_data/${fileName}`)
            await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
        }
        if (category){
            await this.page.getByRole('combobox', { name: 'Category' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'Category' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: category, exact: true }).click()
        }
        await this.page.getByRole('spinbutton', { name: 'renew' }).fill(daysRenew ? daysRenew : '0')
        if (targetType) {
            await this.page.getByRole('combobox', { name: 'Target Type' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'Target Type' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: targetType, exact: true }).click()
        }
        if (targetType && targetValue)
            await this.page.locator('mat-tab-body').getByRole('textbox', {name: 'target data'}).fill(targetValue);
        await this.page.getByRole('textbox', { name: 'description' }).fill(description ? description : '')
        await this.page.getByRole('button', { name: 'save' }).click()

        const entityCopyPromise = await this.page.waitForResponse(response => response.url()
            .includes(`${this.apiUrlWeb}/task/create?expand=customer&company_ids=`) && response.request().method() === 'POST');
        const entityResponseBody = await entityCopyPromise.json()
        expect.soft(entityCopyPromise.status()).toEqual(200)

        if (entityCopyPromise.status() === 200) taskId?.push(`${entityResponseBody.data.id}`)

        await expect.soft(this.page.locator('app-notification-bar .text')).toHaveText(" Task was created successfully! View")
        await this.page.locator('app-notification-bar .close-btn').click()
        
        /** row validation */
        await expect.soft(taskPanel.locator('.task__id')).toHaveText(` #${entityResponseBody.data.id} `)
        await expect.soft(taskPanel.locator('.number-of-tasks', {hasText: 'no subtasks'})).toBeVisible()
        await expect.soft(taskPanel.locator('.title--customer')).toHaveText(responsible ? ` ${responsible} ` : ` ${userName}  (Me) `)
        await expect.soft(taskPanel.locator('.info-col .d-flex', {hasText: 'due date'}).locator('.text-ellipsis')).toHaveText(dueDate ? dueDateToAssert : ' - ' )
        await expect.soft(taskPanel.locator('.info-col .d-flex', {hasText: 'proof'})).toHaveText(proof ? ' Request proof:  Yes ' : ' Request proof:  No ' )
        if (targetType) {
            if (targetType === 'Plain Text') {
                await expect.soft(taskPanel.locator('.number-of-tasks', {hasText: 'Target data'}).locator('.text-ellipsis')).toHaveText(targetValue ? targetValue : '')
            } else {
                await expect.soft(taskPanel.locator('.number-of-tasks', {hasText: 'Target Data'}).locator('a')).toHaveText(targetValue ? ` ${targetValue} ` : '')
            }
        } else {
            await expect.soft(taskPanel.locator('.number-of-tasks', {hasText: 'Target data'})).toHaveText(' Target Data:  - ')
        }
        await expect.soft(taskPanel.locator('.task-status-circle mat-icon')).toHaveCSS('color', 'rgb(255, 173, 32)')
        /** modal validation */
        await taskPanel.hover()
        await taskPanel.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'Open' }).click()

        await this.page.locator('.right-modal').waitFor({ state: 'visible' })
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(` ${taskName} `)

        await expect.soft(this.page.locator('.status-chip span')).toHaveText('Pending')
        await expect.soft(this.page.locator('.status-chip')).toHaveCSS('background-color', 'rgb(255, 194, 88)')
        if (fileName) await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${fileName} `);
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Code' }).locator('.right-modal__label-value'))
        .toHaveText(`#${entityResponseBody.data.id}`);
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'due date' }).locator('.right-modal__label-value'))
        .toHaveText(dueDate ? dueDateToAssert : '');
        await expect.soft(this.page.locator('app-task-view .right-modal__label', { hasText: 'request proof' })
            .locator('.right-modal__label-value')).toHaveText(proof ? 'Yes' : 'No');
        await expect.soft(this.page.locator('app-task-view .right-modal__label', { hasText: 'created at' })
            .locator('.right-modal__label-value')).toHaveText(`${await this.currentDate('-')}`);
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'renew' }).locator('.right-modal__label-value'))
            .toHaveText(daysRenew ? daysRenew : '');
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'category' }).locator('.right-modal__label-value'))
            .toHaveText(category ? category : ' None ');
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'target type' }).locator('.right-modal__label-value'))
            .toHaveText(targetType ? targetType : ' - ');
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'target data' }).locator('.right-modal__label-value'))
            .toHaveText(targetValue ? targetValue : ' - ');
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'description' }).locator('.right-modal__label-value'))
            .toHaveText(description ? description : ' - ');
        await expect.soft(this.page.getByRole('button', { name: 'edit' })).toBeVisible()
        await expect.soft(this.page.getByRole('button', { name: 'MARK AS DONE', exact: true })).toBeVisible()
        await this.page.locator('button.close').click()
    }
    async createSubtask({ taskName, subtaskName, proof, dueDate, fileName, category, targetType, targetValue, description
    }: CreateTaskOptions, subtaskId?: string[]) {
        const taskPanel = this.page.locator('mat-expansion-panel', { hasText: taskName })
        /** subtask creation */
        await taskPanel.locator('.title--task').click()
        await expect.soft(taskPanel.locator('.mat-expansion-panel-body')).toBeVisible()

        await this.page.locator('mat-expansion-panel', { hasText: taskName }).getByText('add subtask').click()
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(` New Subtask for ${taskName} `)
        await this.page.getByRole('textbox', { name: 'task title' }).fill(subtaskName ? subtaskName : '')
        if (proof) this.page.getByRole('checkbox', { name: 'request proof' }).check();
        let dueDateToAssert = ''
        if (dueDate !== undefined) {
            await this.page.waitForTimeout(1000)
            await this.page.getByRole('button', {name: 'calendar'}).click()
            await expect.soft(this.page.locator('.mat-calendar')).toBeVisible()
            dueDateToAssert = await this.selectDaysFromCurrentDate(dueDate, true, 'due_date')
        }
        if (fileName) {
            await this.page.locator('mat-expansion-panel', { hasText: 'add files' }).click()
            await this.page.locator('[type="file"]').setInputFiles(`./test_data/${fileName}`)
            await expect.soft(this.page.locator('app-file-icon')).toBeAttached()
        }
        if (category){
            await this.page.getByRole('combobox', { name: 'Category' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'Category' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: category, exact: true }).click()
        }
        if (targetType) {
            await this.page.getByRole('combobox', { name: 'Target Type' }).click()
            expect.soft(await this.page.getByRole('combobox', { name: 'Target Type' }).getAttribute('aria-expanded')).toEqual('true')
            await this.page.getByRole('option', { name: targetType, exact: true }).click()
        }
        if (targetType && targetValue)
            await this.page.locator('mat-tab-body').getByRole('textbox', {name: 'target data'}).fill(targetValue);

        await this.page.getByRole('textbox', { name: 'description' }).fill(description ? description : '')
        await this.page.getByRole('button', { name: 'save' }).click()

        const entityCopyPromise = await this.page.waitForResponse(response => response.url()
            .includes(`${this.apiUrlWeb}/task/create?expand=customer&company_ids=`) && response.request().method() === 'POST');
        const entityResponseBody = await entityCopyPromise.json()
        expect.soft(entityCopyPromise.status()).toEqual(200)

        if (entityCopyPromise.status() === 200) subtaskId?.push(`${entityResponseBody.data.id}`)

        await expect.soft(this.page.locator('app-notification-bar .text')).toHaveText(" Task was created successfully! View")
        await this.page.locator('app-notification-bar .close-btn').click()

        /** subtask row validation */
        const itemsValue = await taskPanel.locator('.number-of-tasks', {hasText: 'subtasks'}).textContent()
        const numberOfitems = itemsValue?.split(' ')[1]

        const numberOfFilesInFolder = await taskPanel.locator('mat-card').count()
        expect.soft(numberOfitems).toEqual(numberOfFilesInFolder.toString())
        const subtaskRow = this.page.locator('app-task-row', { hasText: subtaskName })
        await expect.soft(subtaskRow.locator('.task__id')).toHaveText(` #${entityResponseBody.data.id} `)
        await expect.soft(subtaskRow.locator('.text-ellipsis').nth(2)).toHaveText(targetValue ? targetValue : '  ');
        if(description) 
            await expect.soft(subtaskRow.locator('.text-ellipsis').nth(3)).toHaveText(description);
        if(proof) 
            await expect.soft(subtaskRow.getByText('request proof')).toBeVisible();
        if (dueDate) await expect.soft(subtaskRow.locator('.text-ellipsis').nth(4)).toHaveText(dueDateToAssert);
        await expect.soft(subtaskRow.locator('.task-due-date')).toHaveText(' Pending ');
        await expect.soft(subtaskRow.locator('.task-due-date')).toHaveCSS('color', 'rgb(255, 173, 32)');
        await expect.soft(subtaskRow.locator('.task-status-circle mat-icon')).toHaveCSS('color', 'rgb(255, 173, 32)');

        /** subtask modal validation */
        await subtaskRow.hover()
        await subtaskRow.locator('mat-icon', { hasText: 'more_vert' }).click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'Open' }).click()
        await this.page.locator('.right-modal').waitFor({ state: 'visible' })

        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(` ${subtaskName} `)
        await expect.soft(this.page.locator('.status-chip span')).toHaveText('Pending')
        await expect.soft(this.page.locator('.status-chip')).toHaveCSS('background-color', 'rgb(255, 194, 88)')
        if (fileName) await expect.soft(this.page.locator('app-file .file__info div')).toHaveText(` ${fileName} `);
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'Code' }).locator('.right-modal__label-value'))
        .toHaveText(`#${entityResponseBody.data.id}`);
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'due date' }).locator('.right-modal__label-value'))
        .toHaveText(dueDate ? dueDateToAssert : '');
        await expect.soft(this.page.locator('app-task-view .right-modal__label', { hasText: 'request proof' })
            .locator('.right-modal__label-value')).toHaveText(proof ? 'Yes' : 'No');
        await expect.soft(this.page.locator('app-task-view .right-modal__label', { hasText: 'created at' })
            .locator('.right-modal__label-value')).toHaveText(`${await this.currentDate('-')}`);
        await expect.soft(this.page.locator('app-task-view .right-modal__label', { hasText: 'category' })
            .locator('.right-modal__label-value')).toHaveText(category ? category : ' None ');
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'target type' }).locator('.right-modal__label-value'))
            .toHaveText(targetType ? targetType : ' - ');
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'target data' }).locator('.right-modal__label-value'))
            .toHaveText(targetValue ? targetValue : ' - ');
        await expect.soft(this.page.locator('.right-modal__label', { hasText: 'description' }).locator('.right-modal__label-value'))
            .toHaveText(description ? description : ' - ');
        await expect.soft(this.page.getByRole('button', { name: 'edit' })).toBeVisible()
        await expect.soft(this.page.getByRole('button', { name: 'MARK AS DONE', exact: true })).toBeVisible()
        await this.page.locator('button.close').click()
    }

    async markTaskAsDone({taskName, daysRenew, dueDate, modal, subtasks}: MarkAsDoneParams, renewTaskId: string[]) {
        /** TODO add marking from menu */
        await this.page.getByRole('button', {name: 'automation'})

        const taskPanel = this.page.locator('mat-expansion-panel', { hasText: taskName });
        await taskPanel.locator('.title--task').click()
        const taskCodeString = await taskPanel.locator('.task__id').first().textContent()
        const taskCode = taskCodeString?.split('#')[1]
        const taskIdforRenew = subtasks ? Number(taskCode) + 2 : Number(taskCode) + 1;

        let dateToAdd = ''

        if (dueDate) {
            dateToAdd = await taskPanel.locator('.info-col .d-flex', {hasText: 'due date'}).locator('.text-ellipsis').textContent() || ''
        }
        await taskPanel.hover()
        await taskPanel.locator('mat-icon', { hasText: 'more_vert' }).first().click({ force: true })
        await expect.soft(this.page.getByRole('menu')).toBeVisible()
        await this.page.getByRole('menuitem', { name: 'Open' }).click()

        await this.page.locator('.right-modal button', {hasText: 'mark as done'}).waitFor({ state: 'visible' })
        await this.page.getByRole('button', { name: 'MARK AS DONE', exact: true }).click()
        await expect.soft(this.page.locator('mat-dialog-container')).toBeVisible()
        await expect.soft(this.page.locator('h1')).toHaveText('Done Task')
        await expect.soft(this.page.locator('mat-dialog-content')).toHaveText(`Are you sure you want to mark as done ${taskName} task?`)
        await this.page.getByRole('button', {name: 'done'}).click()
        await this.page.waitForResponse(
            response => response.url().includes(
                `${this.apiUrlWeb}/task/update?id=`) && response.request().method() === 'POST' && response.status() == 200);
        // after reload
        if (daysRenew) renewTaskId?.push(`${taskIdforRenew}`);
        await expect.soft(taskPanel.locator('.task-status-circle mat-icon').first()).toHaveCSS('color', 'rgb(72, 200, 118)')
        await taskPanel.locator('.task-status-circle mat-icon').first().hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Done' })).toBeVisible()
        if (subtasks) {
            await expect.soft(taskPanel.locator('.status-background-success')).toHaveCSS('background-color', 'rgb(72, 200, 118)')
            await taskPanel.locator('.status-circle').hover()
            await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Done, Subtasks' })).toBeVisible()
            await taskPanel.locator('.title--task').click()
            await expect.soft(taskPanel.locator('.mat-expansion-panel-body')).toBeVisible()
            const subtaskRow = taskPanel.locator('app-task-row')
            await expect.soft(subtaskRow.locator('.task-due-date')).toHaveText(' Done ')
            await expect.soft(subtaskRow.locator('.task-due-date')).toHaveCSS('color', 'rgb(72, 200, 118)')
            await expect.soft(subtaskRow.locator('.status-color-success', {hasText: 'fiber_manual'})).toHaveCSS('color', 'rgb(72, 200, 118)')
        }
        if (daysRenew) {
            await this.page.reload()
            await this.page.locator('app-active-task-subtasks-list').waitFor({state: 'visible'})
            // validating new task
            const taskPanelNew = this.page.locator('mat-expansion-panel', { hasText: taskIdforRenew.toString() });

            const expectedDate = await this.currentDate('-', daysRenew) || ''
            await expect.soft(taskPanelNew.locator('.info-col .d-flex', {hasText: 'due date'}).locator('.text-ellipsis')).toHaveText(expectedDate)
            if (subtasks) {
                await taskPanelNew.locator('.status-circle').hover()
                await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Pending, Subtasks' })).toBeVisible()
                await expect.soft(taskPanelNew.locator('.status-background-secondary')).toHaveCSS('background-color', 'rgb(255, 173, 32)')
            }
            await taskPanelNew.locator('.task-status-circle mat-icon').first().hover()
            await expect.soft(this.page.locator('#cdk-overlay-1').getByText('Pending')).toBeVisible()
            await expect.soft(taskPanelNew.locator('.task-status-circle mat-icon').first()).toHaveCSS('color', 'rgb(255, 173, 32)')
            if (subtasks) {
                await taskPanelNew.locator('.title--task').click()
                await expect.soft(taskPanelNew.locator('.mat-expansion-panel-body')).toBeVisible()
                const subtaskRowNew = taskPanelNew.locator('app-task-row')
                await expect.soft(subtaskRowNew.locator('.due-date span')).toHaveText(expectedDate)
                await expect.soft(subtaskRowNew.locator('.task-due-date')).toHaveText(' Pending ')
                await expect.soft(subtaskRowNew.locator('.task-due-date')).toHaveCSS('color', 'rgb(255, 173, 32)')
                await expect.soft(subtaskRowNew.locator('.status-color-secondary', {hasText: 'fiber_manual'})).toHaveCSS('color', 'rgb(255, 173, 32)')
            }
        }
    }
}



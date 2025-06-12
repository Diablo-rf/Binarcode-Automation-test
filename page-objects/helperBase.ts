import { Page, expect, APIRequestContext, APIResponse } from "@playwright/test";
import { promises as fs, link } from "fs";
import * as fileSync from 'fs'
import path from "path";

export let twoDigitDateFormat: string
export let stringDateFormat: string

let writeTofileData: any
let readFromfileData: any
const driverInvitationCodesFilePath = './test_data/test_artifacts/driverInvitationCodes.json'
let invitationCode: any

const { FRONT_PASSWORD, COMPANY_ID } = process.env

export class HelperBase {

    page: Page
    apiUrlWeb: string
    apiUrlMobile: string

    constructor(page: Page, apiUrlWeb: string, apiUrlMobile: string) {
        this.page = page
        this.apiUrlWeb = apiUrlWeb
        this.apiUrlMobile = apiUrlMobile
    }
    /**
     * This method will return the PHPSESSID cookie key and it's value
     * @returns `PHPSESSID=${cookieValue}`
     */
    async phpSessidCookie() {
        const pageCookies = await this.page.context().cookies()
        const cookieKey = pageCookies.find(cookie => cookie.name === 'PHPSESSID')
        const cookieValue = cookieKey?.value
        return `PHPSESSID=${cookieValue}`

    }

    async responseUrl(url: string, method: string) {
        const apiResponse = await this.page.waitForResponse(response =>
            response.url().includes(url) && response.request().method() === method)
        return apiResponse
    }

    async writeToFile(keyName: string, keyValue: string | null, filePath: string) {
        writeTofileData = JSON.parse(await fs.readFile(filePath, 'utf-8'))
        writeTofileData.push({ [keyName]: keyValue })
        fs.writeFile(filePath, JSON.stringify(writeTofileData, null, 2), 'utf-8')

    }
    /**
     * Thie method reads a key value from a json file.
     * Be aware that if used right after the "writeToFile" method, then it might not find the record (use a timeout).
     * @param keyName 
     * @param filePath 
     * @returns the value of the keyName
     */
    async readFromFile(keyName: string, filePath: string) {
        readFromfileData = JSON.parse(await fs.readFile(filePath, 'utf-8'))
        let keyValue = ''
        for (let value of readFromfileData) {
            if (value.hasOwnProperty(keyName)) {
                keyValue = value[keyName]
                break
            }
        }
        return keyValue

    }
    async frontAccessToken(username: string, password: string, request: APIRequestContext) {
        const loginResponse = await request.post(`${this.apiUrlWeb}/auth/login`, {
            data: {
                "username": username,
                "password": password,
                "rememberMe": false
            }
        })

        const loginResponseBody = await loginResponse.json()
        const token = loginResponseBody.data.token
        //console.log('Front Access token: ' + token);
        return `Bearer ${token}`

    }
    async mobileAccessToken(username: string, password: string, request: APIRequestContext) {
        const loginResponse = await request.post(`${this.apiUrlMobile}/auth/login`, {
            data: {
                "username": username,
                "password": password,
            }
        })

        const loginResponseBody = await loginResponse.json()
        const token = loginResponseBody.data.token
        console.log('Mobile Access token: ' + token);
        return `Bearer ${token}`

    }
    async inviteDriverByApi(username: string, password: string, driverType: string, email: string, companyID: string | undefined, driverFirstName: string, driverLastName: string, request: APIRequestContext) {
        const Token = await this.frontAccessToken(username, password, request)

        const driverInviteResponse = await request.post(`${this.apiUrlWeb}/driver/invite`, {
            headers: {
                Authorization: Token
            },
            data: {
                'entity_id': driverType,
                'email': email,
                'owner_company_id': companyID,
                'first_name': driverFirstName,
                'last_name': driverLastName
            }
        })

        expect(driverInviteResponse.status()).toEqual(200)
        const driverInviteResponseBody = await driverInviteResponse.json()
        console.log(`invited driver email: ${email}, driver id: ${driverInviteResponseBody.data.id}`);

        return driverInviteResponseBody.data.id

    }
    async updateDriverByApi(username: string, password: string, driverId: string, cdlState: string, cdlNumber: string, birthDate: string, request: APIRequestContext) {
        const Token = await this.frontAccessToken(username, password, request)

        const driverUpdateResponse = await request.put(`${this.apiUrlWeb}/driver/update?id=${driverId}&expand=truck,trailer`, {
            headers: {
                Authorization: Token
            },
            data: {
                'address': 'Astoria, OR 97103, USA',
                'zip': '97103',
                'phone': '+1 (201) 555-1231',
                'cdl_state_code': cdlState,
                'cdl': cdlNumber,
                'cdl_issue_date': '2024-05-06',
                'birth_date': birthDate,
            }
        })

        expect(driverUpdateResponse.status()).toEqual(200)

    }
    async createTruckByApi(username: string, password: string, companyID: string | undefined, makeName: string, unitNumber: string, currentMiles: string, plateNumber: string, fuelType: string, request: APIRequestContext) {
        const Token = await this.frontAccessToken(username, password, request)

        const truckCreationRequest = await request.post(`${this.apiUrlWeb}/truck/create`, {
            headers: {
                Authorization: Token
            },
            data: {
                'owner_company_id': companyID,
                'model_name': makeName,
                'unit_number': unitNumber,
                'current_miles': currentMiles,
                'plate_number': plateNumber,
                'engine_type': fuelType
            },
            timeout: 15000
        })

        expect(truckCreationRequest.status()).toEqual(200)
        const truckCreationResponseBody = await truckCreationRequest.json()
        console.log(`Created truck brand name: ${makeName}, unit number: ${unitNumber}, truck id: ${truckCreationResponseBody.data.id}`);

        return truckCreationResponseBody.data.id

    }
    async createTrailerByApi(username: string, password: string, companyID: string | undefined, makeName: string, unitNumber: string, plateNumber: string, request: APIRequestContext) {
        const Token = await this.frontAccessToken(username, password, request)

        const trailerCreationRequest = await request.post(`${this.apiUrlWeb}/trailer/create`, {
            headers: {
                Authorization: Token
            },
            data: {
                'owner_company_id': companyID,
                'model_name': makeName,
                'unit_number': unitNumber,
                'plate_number': plateNumber,
            },
            timeout: 15000
        })

        expect(trailerCreationRequest.status()).toEqual(200)
        const trailerCreationResponseBody = await trailerCreationRequest.json()
        console.log(`Created trailer brand name: ${makeName}, unit number: ${unitNumber}, trailer id: ${trailerCreationResponseBody.data.id}`);

        return trailerCreationResponseBody.data.id

    }
    async inviteMemberByApi(username: string, password: string, memberRole: string, email: string, companyID: string | undefined, memberFirstName: string, memberLastName: string, request: APIRequestContext) {
        const Token = await this.frontAccessToken(username, password, request)
        const entityID = memberRole === 'Safety manager' ? '3' : memberRole === 'Dispatcher' ? '4' : '5'
        const driverInviteResponse = await request.post(`${this.apiUrlWeb}/customer/invite`, {
            headers: {
                Authorization: Token
            },
            data: {
                'entity_id': entityID,
                'email': email,
                'owner_company_id': companyID,
                'first_name': memberFirstName,
                'last_name': memberLastName
            }
        })

        expect(driverInviteResponse.status()).toEqual(200)
        const driverInviteResponseBody = await driverInviteResponse.json()
        console.log(`invited member email: ${email}, member id: ${driverInviteResponseBody.data.id}`);

        return driverInviteResponseBody.data.id

    }
    async createTrainingByApi(
        username: string, password: string, companyID: string | undefined, title: string, category: string, 
            description: string, difficulty: string, request: APIRequestContext, trainingId?: string[]) {
        const Token = await this.frontAccessToken(username, password, request)
        const trainingResponse = await request.post(`${this.apiUrlWeb}/training/create`, {
            headers: {
                Authorization: Token
            },
            data: {
                'title': title,
                'training_category_id': category,
                'description': description,
                'difficulty': difficulty,
                'owner_company_id': companyID,

            }
        })

        expect(trainingResponse.status()).toEqual(200)
        const trainingResponseBody = await trainingResponse.json()
        if (trainingResponse.status() === 200) trainingId?.push(trainingResponseBody.data.id);
        console.log(`Training created: ${title}`);
    }
    async deleteEntityByApi(username: string, password: string, entityType: string, entityId: string | null | undefined, companyId: string | undefined, request: APIRequestContext) {
        const Token = await this.frontAccessToken(username, password, request)

        const entityResponse = 
        entityType.includes('suggested') ? await request.delete(`${this.apiUrlWeb}/${entityType}/delete?id=${entityId}`, {
            headers: {
                Authorization: Token
            }
        }) : await request.delete(`${this.apiUrlWeb}/${entityType}/delete?id=${entityId}&company_ids=${companyId}`, {
            headers: {
                Authorization: Token
            }
        })

        expect(entityResponse.status()).toEqual(200)
    }
    async decomissionEntityByApi(username: string, password: string, entityType: string, entityId: string | null, request: APIRequestContext) {
        const Token = await this.frontAccessToken(username, password, request)
        let entityResponse: APIResponse
        
        if (entityType === 'truck' || entityType === 'trailer' || entityType === 'driver') {
            entityResponse = await request.put(
                entityType === 'truck' ? `${this.apiUrlWeb}/${entityType}/update?id=${entityId}&expand=driver,trailer`
                    : entityType === 'trailer' ? `${this.apiUrlWeb}/${entityType}/update?id=${entityId}&expand=driver,truck`
                        : entityType === 'driver' ? `${this.apiUrlWeb}/${entityType}/update?id=${entityId}&expand=driver,truck` : '', {
                headers: {
                    Authorization: Token
                },
                data: {
                    'status': 'inactive'
                }
            })

        } else {
            entityResponse = await request.put(`${this.apiUrlWeb}/${entityType}/update?id=${entityId}`, {
                headers: {
                    Authorization: Token
                },
                data: {
                    'status': '0'
                }
            })
        }
        

        expect(entityResponse.status()).toEqual(200);
        console.log(`Decomissioned ${entityType} with id: ${entityId}`);
    }
    async changeMemberStatus(username: string, password: string, entityId: string | null, status: string, request: APIRequestContext) {
        const Token = await this.frontAccessToken(username, password, request)
        const statusValue = status === 'active' ? '1' : status === 'unconfirmed email' ? '2' : '';
        const entityResponse = await request.put(`${this.apiUrlWeb}/customer/update?id=${entityId}`, {
                headers: {
                    Authorization: Token
                },
                data: {
                    'status': statusValue
                }
            })

        expect(entityResponse.status()).toEqual(200);
        console.log(`The status of member with id ${entityId} was changed to ${status}`);
    }

    async submitDriverInvitationCodeByApi(email: string, request: APIRequestContext) {
        await this.page.waitForTimeout(500)
        invitationCode = await this.readFromFile(email, driverInvitationCodesFilePath)
        console.log('submitDriverInvitationCodeByApi: ' + invitationCode);
        const codeResponse = await request.post(`${this.apiUrlMobile}/driver/check-registration-code`, {
            data: {
                "code": invitationCode
            }
        })
        const responseBody = await codeResponse.json()
        const accessToken = responseBody.data.accessToken
        return `Bearer ${accessToken}`
    }
    async acceptDriverAgreementByApi(accessToken: string, request: APIRequestContext) {
        const acceptAgreement = await request.post(`${this.apiUrlMobile}/driver/accept-agreement`, {
            headers: {
                Authorization: accessToken
            }
        })
        expect.soft(acceptAgreement.status()).toEqual(200)
    }
    async selectDaysFromCurrentDate(daysFromCurrentDay: number = 0, future: boolean, formControlName: string) {
        let date = new Date()
        date.setDate(future ? date.getDate() + daysFromCurrentDay : date.getDate() - daysFromCurrentDay)
        const data = {
            expectedDate: date.getDate().toString(),
            twoDigitDay: date.toLocaleString('En-US', { day: '2-digit' }),
            expectedMonthLowerCase: date.toLocaleString('En-US', { month: 'short' }),
            expectedMonthUpperCase: date.toLocaleString('En-US', { month: 'short' }).toUpperCase(),
            twoDigitMonth: date.toLocaleString('En-US', { month: '2-digit' }),
            expectedYear: date.getFullYear(),
        }

        let calendarMonthAndYear = await this.page.locator('mat-calendar-header .mdc-button__label span').textContent()

        while (!calendarMonthAndYear?.includes(`${data.expectedMonthUpperCase} ${data.expectedYear}`)) {
            await this.page.getByRole('button', { name: future ? 'next month' : 'previous month' }).click()
            calendarMonthAndYear = await this.page.locator('mat-calendar-header .mdc-button__label span').textContent()
        }
        await this.page.locator('button').getByText(`${data.expectedDate}`, { exact: true }).click()
        let calendarDate = await this.page.locator(`[formcontrolname="${formControlName}"]`).inputValue()
        const calendarDateToAssert = calendarDate.replace(/^[^,]*, /, "")
        expect.soft(calendarDateToAssert).toEqual(`${data.expectedMonthLowerCase} ${data.expectedDate}, ${data.expectedYear}`)

        twoDigitDateFormat = `${data.twoDigitMonth}-${data.twoDigitDay}-${data.expectedYear}`
        stringDateFormat = `${data.expectedMonthLowerCase} ${data.expectedDate}, ${data.expectedYear}`

        if (formControlName == 'start_date' || formControlName == 'end_date' || formControlName == 'issue_date') {
            return `${data.expectedMonthLowerCase} ${data.expectedDate}, ${data.expectedYear}`
        } else {
            return `${data.twoDigitMonth}-${data.twoDigitDay}-${data.expectedYear}`
        }
    }
    async addDaysToDate(date: string, daysToAdd: number) {
        
        const datePattern = /(\d{2}-\d{2}-\d{4})/;
        const match = date.match(datePattern);
        if (!match) throw new Error("Invalid time format");

        const [_, dateString] = match;

        // Convert to a Date object
        const [month, day, year] = dateString.split('-').map(Number);
        const currentDate = new Date(year, month - 1, day);

        // Modify date and time as required
        if (daysToAdd) currentDate.setDate(currentDate.getDate() + daysToAdd);

        // Format the updated date as MM-DD-YYYY
        const updatedMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
        const updatedDay = String(currentDate.getDate()).padStart(2, '0');
        const updatedYear = currentDate.getFullYear();
        //const updatedDate = `${updatedMonth}/${updatedDay}/${updatedYear}`;
        const updatedDate = `${updatedMonth}-${updatedDay}-${updatedYear}`;
        console.log(updatedDate);
        return updatedDate;
    }
    /**
     * @returns For '-' : MM-DD-YYYY, For '.' MM.DD.YYYY
     */
    async currentDate(delimiter: string, addDays?: number) {
        let currentDate = new Date();
        
        if (addDays) {
            currentDate.setDate(currentDate.getDate() + addDays)
        }
        // const createdDay = currentDate.toLocaleString('En-US', { day: '2-digit' });
        // const createdMonth = currentDate.toLocaleString('En-US', { month: '2-digit' });
        // const createdYear = currentDate.getFullYear();
        const createdDay = currentDate.getUTCDate().toString().padStart(2, '0');
        const createdMonth = (currentDate.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
        const createdYear = currentDate.getUTCFullYear();

        if(delimiter === '-') {
            return `${createdMonth}-${createdDay}-${createdYear}`
        } else if (delimiter === '.') {
            return `${createdMonth}.${createdDay}.${createdYear}`
        }
    }
    async currentTime(minusHours?: number) {
        let currentTime = new Date();
        if (minusHours)
            currentTime.setHours(currentTime.getHours() - minusHours)
        return currentTime.toLocaleString('En-US', {timeStyle: 'short'})
    }
    /**
     * 
     * @param months The amount of months to be converted in days
     * @returns The amount of days from the amount of months
     */
    async getDaysFromMonths(months: number) {
        const currentDate = new Date();
        let totalDays = 0;

        for (let i = 0; i < months; i++) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + i; // Move month forward by 'i'

            // Calculate the next month and year taking into account year rollover
            const nextMonth = (month % 12) + 1; // Month is 1-indexed in Date constructor
            const nextYear = year + Math.floor(month / 12);

            // Get days in the next month
            const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();

            totalDays += daysInNextMonth;
        }

        return totalDays;
    }


    async updateDocumentAsDriverByApi(userName: string, password: string, docId: string | null, docType: string, fileName: string, request: APIRequestContext) {
        const filePath = path.resolve(__dirname, '..', 'test_data', fileName)
        const updateFileRequest = await request.post(`${this.apiUrlMobile}/document/upload-file?id=${docId}`, {
            headers: {
                Authorization: await this.mobileAccessToken(userName, password, request)
            },
            multipart: {
                'id': docId || '',
                'Content-Disposition': `form-data; name="${docType}"`,
                'files[]': fileSync.createReadStream(filePath)
            }
        })
        expect(updateFileRequest.status()).toEqual(200)
    }
    async updateDriverPasswordByApi(accessToken: string, request: APIRequestContext) {
        const updatePasswordRequest = await request.post(`${this.apiUrlMobile}/driver-location/create`, {
            headers: {
                Authorization: accessToken
            },
            data: {
                "password_hash": 'Test1234!',
                "password_hash_repeat": 'Test1234!'
            }
        })
        expect(updatePasswordRequest.status()).toEqual(200)
    }
    async updateDriverLocationByApi(accessToken: string, email: string, password: string, latitude: number, longitude: number, request: APIRequestContext) {
        const updateLocationRequest = await request.post(`${this.apiUrlMobile}/driver-location/create`, {
            headers: {
                Authorization: accessToken
            },
            data: {
                "lat": latitude,
                "long": longitude
            }
        })
        expect(updateLocationRequest.status()).toEqual(200)
        const updateDate = await this.currentDate('-')
        const updateTime = await this.currentTime()
        return { updateDate, updateTime}
    }
    async suggestionTooltip(category: string, inFolder?: boolean) {
        let tooltipValue = ''
        category === 'DOCUMENTS' && inFolder == undefined ? tooltipValue = 'Copy EasyWay Suggestion Folder' :
        category === 'DOCUMENTS' && inFolder != undefined ? tooltipValue = 'Copy EasyWay Suggestion File' :
        category === 'CHECKLIST' ? tooltipValue = 'Copy EasyWay Suggestion' : 
        category === 'PHOTOS' ? tooltipValue = 'Copy EasyWay Suggestion Photo' : 
        category === 'PREVENTIVE MAINTENANCES' ? tooltipValue = 'Copy Suggested Preventive Maintenance' : ''
        return tooltipValue
    }
    async switchToTab(tabName: string, truckService?: boolean) {
        await this.page.getByRole('tab', {name: tabName, exact: true}).click()
        await expect.soft(this.page.locator('app-breadcrumbs li', {hasText: 
            truckService !== undefined && truckService ? 'Truck Services' : truckService !== undefined && !truckService ? 'Trailer Services' : tabName})).toBeVisible()
        await this.page.waitForTimeout(1000)
    }
    async checkAddedSuggestedFile(fileName: string, category: string, inFolder?: boolean) {
        //await this.page.locator('button', {hasText: 'Add Suggestions'}).hover()
        await this.page.locator('mat-tab-body .ew-settings', {hasText: 'Add Suggestions'}).hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Add Suggestions' })).toBeVisible()

        await this.page.locator('mat-tab-body .ew-settings').click()
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(` SUGGESTED ${category} `)
        await this.page.locator('.right__suggestions-body-inner').waitFor({state: 'visible'})
        
        const fileRow = this.page.locator('mat-card', {hasText: fileName})
        await fileRow.hover()
        await fileRow.locator('.action__btn--copy').waitFor({state: 'visible'})
        await fileRow.locator('.action__btn--copy').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: await this.suggestionTooltip(category, inFolder) })).toBeVisible()
        await this.page.getByRole('button', {name: 'done'}).click()

    }
    async checkAddedSuggestedFolder(folderName: string, category: string, expectedNumberOfFiles: number) {
        const itemsLocator = 
            category === 'DOCUMENTS' || category === 'TASKS' ? '.title span' :
            category === 'CHECKLISTS' ? '.title div' : '' ;

        await this.page.locator('mat-tab-body .ew-settings', {hasText: 'Add Suggestions'}).hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: 'Add Suggestions' })).toBeVisible()

        await this.page.locator('mat-tab-body .ew-settings').click()
        await expect.soft(this.page.locator('app-right-modal-title h3 span ')).toHaveText(` SUGGESTED ${category} `)
        await this.page.locator('.right__suggestions-body-inner').waitFor({state: 'visible'})
        
        const folderRow = this.page.locator('.__container mat-expansion-panel', { hasText: folderName })
        await expect.soft(folderRow.locator(itemsLocator, {hasText: 'items'})).toHaveText(` ${expectedNumberOfFiles} items `)
 
        await folderRow.click()
        await expect.soft(folderRow.locator('.mat-expansion-panel-body')).toBeVisible()
        const numberOfFilesInFolder = await folderRow.locator('mat-card').count()
        expect.soft(numberOfFilesInFolder).toEqual(expectedNumberOfFiles)

        await folderRow.locator('mat-expansion-panel-header').hover()
        await folderRow.locator('mat-expansion-panel-header .action__btn--copy').waitFor({ state: 'visible' })
        await folderRow.locator('mat-expansion-panel-header .action__btn--copy').hover()
        await expect.soft(this.page.locator('.mdc-tooltip__surface', { hasText: await this.suggestionTooltip(category) })).toBeVisible()
        await this.page.getByRole('button', {name: 'done'}).click()
    }
    async deleteSuggestedItems(suggestedItems: string[], userEmail: string, request: APIRequestContext) {
        for (const suggestedItemId of suggestedItems) {
            const itemType =
                suggestedItemId.includes('document') ? 'suggested-document'
                    : suggestedItemId.includes('photo') ? 'suggested-photo'
                        : 'suggested-preventive-maintenance';

            const itemId = suggestedItemId.split('-')[1]
            await this.deleteEntityByApi(`${userEmail}`, `${process.env.FRONT_PASSWORD}`, itemType, itemId, `${process.env.COMPANY_ID}`, request)
        }
    }
    async deleteSuggestedFolders(suggestedFolders: string[], userEmail: string, request: APIRequestContext) {
        for (const suggestedFolderId of suggestedFolders) {
            const itemType =
                suggestedFolderId.includes('document') ? 'suggested-document-folder'
                    : suggestedFolderId.includes('suggested') ? 'suggested-task'
                        : suggestedFolderId.includes('task') ? 'task'
                            : 'suggested-checklist';
            const itemId = suggestedFolderId.split('-')[1]
            await this.deleteEntityByApi(`${userEmail}`, `${process.env.FRONT_PASSWORD}`, itemType, itemId, `${process.env.COMPANY_ID}`, request)
        }
    }
    async addPaymentCardByApi(username: string, password: string, request: APIRequestContext) {
        const Token = await this.frontAccessToken(username, password, request)

        const cardCreationRequest = await request.post(`${this.apiUrlWeb}/payment-card/create`, {
            headers: {
                Authorization: Token
            },
            data: {
                'data': 'NDI0MjQyNDI0MjQyNDI0Mn5UZXN0IENhcmR+MTJ+MjAyOH4zNjA='
            }
        })

        expect(cardCreationRequest.status()).toEqual(200)
        const driverInviteResponseBody = await cardCreationRequest.json()
        console.log(`card id: ${driverInviteResponseBody.data}`);

        return driverInviteResponseBody.data
    }
    async toggleAutopayByApi(username: string, password: string, request: APIRequestContext, companyId: string, autopay: boolean) {
        const Token = await this.frontAccessToken(username, password, request)
        const toogleValue = autopay ? 1 : 0

        const cardCreationRequest = await request.put(`${this.apiUrlWeb}/company/update?id=${companyId}`, {
            headers: {
                Authorization: Token
            },
            data: {
                'id': companyId,
                'auto_payment': toogleValue
            }
        })

        expect(cardCreationRequest.status()).toEqual(200)
    }

    
}
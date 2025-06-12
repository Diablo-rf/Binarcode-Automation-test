import { Page, expect } from "@playwright/test";
import { HelperBase } from "../helperBase";

interface LoadOptions {


}
export class LoadsPage extends HelperBase {

    constructor(page: Page, apiUrlWeb: string, apiUrlMobile: string) {
        super(page, apiUrlWeb, apiUrlMobile)

    }

}
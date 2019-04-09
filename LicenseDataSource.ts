import { RESTDataSource } from "apollo-datasource-rest";

    export class LicenseDataSource extends RESTDataSource {
        constructor() {
        super();
        this.baseURL = "https://viscientgateway.ddns.net:8899/";
    }

    async queryLicense(name: string) {
        var result = await this.post(
            'VLREST/v1/query_license',
            `{"company_name":"${name}"}`
        );
        var parsedResult = JSON.parse(result);
        return parsedResult;
    }

    async renewLicense(name: string, domain: string, numberOfDays: number) {
        //TODO
    }

    async activateLicense(name: string, domain: string, numberOfDays: number) {
        //TODO
    }
}

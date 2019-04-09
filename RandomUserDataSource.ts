import { RESTDataSource } from "apollo-datasource-rest";

export class RandomUserDataSource extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://viscientgateway.ddns.net:8899/";
    //this.baseURL = "https://api.randomuser.me/";
  }

  async getPerson() {
    const { results } = await this.get("");
    return results;
  }

  async queryLicense() {
    var test = await this.post(
      'VLREST/v1/query_license',
      //{ company_name: 'viscient' }
      `{"company_name":"viscient"}`
    );
    var zxc = JSON.parse(test);
    return zxc;
  }
}

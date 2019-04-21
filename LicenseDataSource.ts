import { RESTDataSource } from "apollo-datasource-rest";
import Credential from './models/Credential';
import History from './models/History';

export class LicenseDataSource extends RESTDataSource {
        constructor() {
        super();
        this.baseURL = "https://viscientgateway.ddns.net:8899/";
    }

    async queryLicense(username: string) {
        var result = await this.post(
            'VLREST/v1/query_license',
            `{"company_name":"${username}"}`
        );
        var parsedResult = JSON.parse(result);
        return parsedResult;
    }

    async renewLicense(name: string, domain: string, numberOfDays: number) {
        //TODO
    }

    async activateLicense(companyName: string, domainName: string, numberOfDays: number) {
        var result = await this.post(
            `/VLREST/v1/remote_activate_poc?company_name=${companyName}&company_name=${domainName}&number_of_days=${numberOfDays}`
        );
        var parsedResult = JSON.parse(result);
        return parsedResult;
    }

    async loginUser(username: string, password: string){
        var user = findUsers(username, password);
        if(user == null || user === null){
            return { 
                response: '404', 
                message: 'No such user found',
                username: username 
            }
            //throw new Error('No such user found')
        }
        return {
            response: '200',
            message: 'user found',
            username: username
        }
    }

    async findUser(username: string, password: string){
        const user = await Credential.find({username: username, password: password});
        if(user.length < 1){
            return {
                response: '404', 
                message: 'No such user found',
                username: username 
            }
        } else {
            return {
                response: '200',
                message: 'user found',
                username: username
            }
        }
    }

    async findHistory(username: string){
        const history = await History.find({username: username});
        if(history.length < 1){
            return{
                response: '404',
                message: 'No such user found in History collection',
                username: username
            }
        } else{
            return {
                response: '200',
                message: 'List of History found for this user',
                username: username,
                history: history
            }
        }
    }

    async insertHistory(username: string, actionType: string, domainName: string, numberOfDays: number){
        const newHistory = new History({
            username: username,
            actionType: actionType,
            domainName: domainName,
            dateCreated: new Date(),
            dateExpired: new Date().setDate(new Date().getDate() + numberOfDays)
        });

        History.collection.insertOne(newHistory)
            .then(a => 
                {console.log(a)})
                
            .catch(error => 
                {console.log(error)})
    }
    
}

function findUsers(username: string, password: string) {
    return users.find(u => u.username === username && u.password === password);
}

// async function testAsync(username: string, password: string){
//     const user = await User.find({username: username, password: password});
//     if(user.length <= 1){
//         return {
//             response: '404', 
//             message: 'No such user found',
//             username: username 
//         }
//     } else {
//         return {
//             response: '200',
//             message: 'user found',
//             username: username
//         }
//     }
// }

let users = [
    {
        username: 'viscient',
        password: 'viscient'
    },
    {
        username: 'victor',
        password: 'victor'
    }
];

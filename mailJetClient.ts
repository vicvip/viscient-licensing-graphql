import { connect } from 'node-mailjet';

export function sendAutomatedEmail(historyResult: any){
    console.log(historyResult)
    const connection = connect('a69cb7f74803eeeed3c31b28a62a8642', '1998b948eba95af112065aa042ceb838');

    const constructMessageSubject =    `A new "${historyResult.actionType}" has been triggered from ${historyResult.username}`

    const constructMessageBody =    `<h3>Automated Email Notification from Viscient BackEnd</h3>
                                    <p>A new "${historyResult.actionType}" has occured for "${historyResult.username}" on "${historyResult.domainName}".</p>
                                    <p>Date created: ${historyResult.dateCreated}</p>
                                    <p>Date expired: ${historyResult.dateExpired}</p>
                                    <br>
                                    <p>Cheers,</p>
                                    <p>Viscient BackEnd via MailJet</p>`;

    const sendAutomatedEmail = connection.post("send", {'version': 'v3.1'}).request({
        "Messages":[
                {
                        "From": {
                                "Email": "admin@viscientml.com",
                                "Name": "Automated Email"
                        },
                        "To": [
                                {
                                        "Email": "admin@viscientml.com",
                                        "Name": "You"
                                }
                        ],
                        "Subject": constructMessageSubject,
                        "TextPart": "Greetings from Mailjet!",
                        "HTMLPart": constructMessageBody
                }
        ]
    })

    sendAutomatedEmail
    .then((result:any ) => {
        console.log(result.body);
        return result.body.Messages[0].Status;
    })
    .catch((err:any) => {
        console.log(err.statusCode);
        return err.statusCode
    })
}




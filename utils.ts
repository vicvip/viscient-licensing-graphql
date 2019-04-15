// const jwt = require('jsonwebtoken')
// const APP_SECRET = 'GraphQL-is-aw3some'

// function getUserId(context) {
//   const Authorization = context.request.get('Authorization')
//   if (Authorization) {
//     const token = Authorization.replace('Bearer ', '')
//     const { userId } = jwt.verify(token, APP_SECRET)
//     return userId
//   }

//   throw new Error('Not authenticated')
// }

// module.exports = {
//   APP_SECRET,
//   getUserId,
// }

import  { verify } from 'jsonwebtoken';

export const APP_SECRET = 'GraphQL-is-aw3some'

export function getUserId(context: any){
    const Authorization = context.request.get('Authorization');
    if(Authorization){
        const token = Authorization.repalce('Bearer ', '');
        const username  = verify(token, APP_SECRET);
        return username;
    };
}

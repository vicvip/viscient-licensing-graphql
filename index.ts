import { ApolloServer, gql, IResolverObject, PubSub, withFilter  } from "apollo-server";
import fetch from "node-fetch";
import { RandomUserDataSource } from "./RandomUserDataSource";
import { LicenseDataSource } from "./LicenseDataSource";
import { DataSource } from "apollo-datasource";
import { APP_SECRET, getUserId} from './utils';
import { sign } from 'jsonwebtoken';
import { resultKeyNameFromField } from "apollo-utilities";
import mongoose from 'mongoose';
import {sendAutomatedEmail} from './mailJetClient';
import { isMainThread } from "worker_threads";

const typeDefs = gql`
  type Query {
    licenses(username: String): Licenses
    getCounter(username: String!): LoginPayload
    history(username: String!, accountType: String!): History
  }

  type Mutation {
    login(username: String!, password: String!): LoginPayload
    activation(companyName: String!, domainName: String!, numberOfDays: Int, accountType: String): ActivationPayload
    extension(companyName: String!, domainName: String!, numberOfDays: Int, accountType: String): ActivationPayload
  }

  type Subscription {
    pocCounterMutated: LoginPayload
    historyMutated(username: String, accountType: String): HistoryDetail
  }

  type Licenses {
    credit: Credit,
    license: License
  } 

  type History {
    response: String,
    message: String,
    username: String,
    historyDetail: [HistoryDetail]
  }

  type HistoryDetail {
    id: String,
    username: String,
    actionType: String,
    domainName: String,
    dateCreated: String,
    dateExpired: String
  }

  type Credit {
    VAppLPR: Int, 
    VAppStreamerWS: Int, 
    VBrainObject: Int, 
    VAppTrafficIntensity: Int, 
    VAppPeopleCounter: Int,
    VAppStreamerTornado: Int, 
    VAppIllegalPark: Int, 
    VAppCounter: Int, 
    VAppFP: Int, 
    VAppAnalyticsTornado: Int, 
    VAppStreamerEventPush: Int
  }

  type License {
    VAppLPR: Int, 
    VAppStreamerWS: Int, 
    VBrainObject: Int, 
    VAppTrafficIntensity: Int, 
    VAppPeopleCounter: Int,
    VAppStreamerTornado: Int, 
    VAppIllegalPark: Int, 
    VAppCounter: Int, 
    VAppFP: Int, 
    VAppAnalyticsTornado: Int, 
    VAppStreamerEventPush: Int
  }

  type LoginPayload {
    response: String,
    message: String,
    username: String,
    token: String,
    password: String,
    accountType: String,
    pocLicenseCounter: Int,
  }

  type ActivationPayload {
    response: String,
    message: String,
    companyName: String,
    mongoDbResponse: String,
    mailJetResponse: String,
    decrementResponse: String,
  }
`;

// login(email: "zxc@zxc.com", password: "zxczxc"){
//   token
//   user{
//     id
//     name
//     email
//   }

const POC_COUNTER_MUTATED = 'pocCounterMutated';
const HISTORY_MUTATED = 'historyMutated'

const resolvers: IResolverObject = {
  Query: {
    licenses: async (_, args, { dataSources }) => {
      const response = await dataSources.licenseAPI.queryLicense(args.name);
      var data = response.results.data;
      return data;
    },
    history: async (_, args, { dataSources }) => {
      const result = await dataSources.licenseAPI.findHistory(args.username, args.accountType);
      if(result.response === '404'){
        return {
          response: result.response,
          message: result.message,
          username: result.username,
          historyDetail: null
        }
      }

      let historyDetails:object[] = [];
      for (let i in result.history) {
        let historyDetail = {
          id: result.history[i]._id,
          username: result.history[i].username,
          actionType: result.history[i].actionType,
          domainName: result.history[i].domainName,
          dateCreated: new Date(result.history[i].dateCreated).toISOString().split('.')[0],
          dateExpired: new Date(result.history[i].dateExpired).toISOString().split('.')[0]
        };
        historyDetails.push(historyDetail);
     }

      return {
        response: result.response,
        message: result.message,
        username: result.username,
        historyDetail: historyDetails
      };
    },
    getCounter: async(_, args, {dataSources}) => {
      const resultLogin = await dataSources.licenseAPI.findUser(true, args.username, '');
      const LoginPayload = {
        response: resultLogin.response, 
        username: args.username, 
        message: resultLogin.message,
        accountType: resultLogin.user[0].accountType,
        pocLicenseCounter: resultLogin.user[0].pocLicenseCounter,
      }
      return LoginPayload;
    }
  },
  Mutation: {
    login: async (_, args, { dataSources }) => {
      const result = await dataSources.licenseAPI.findUser(false, args.username, args.password);
      if(result.response === '404'){
        return {
          response: result.response, username: args.username, message: result.message
        }
      }
      const token = sign({ username: args.username }, APP_SECRET);

      const payLoad = {
        response: result.response, 
        username: args.username, 
        message: result.message, 
        token: token, 
        accountType: result.user[0].accountType,
        pocLicenseCounter: result.user[0].pocLicenseCounter,
      }
      
      return payLoad;
    },
    activation: async (_, args, {dataSources, pubsub}) => {
      const resultAPI = await dataSources.licenseAPI.activateLicense(args.companyName, args.domainName, args.numberOfDays);
      if(resultAPI.code != 200){
        return {}
      }
      const actionType = 'activate poc'; 
      const insertResult = await dataSources.licenseAPI.insertHistory(args.companyName, actionType, args.domainName, args.numberOfDays);
      if(insertResult.mongoDbResponse != 200){
        return {}
      }
      const newHistory = insertResult.historyResult;
      const decrementResponse = await dataSources.licenseAPI.decrementPocLicense(args.companyName, args.accountType);
      const sendEmailResponse = await sendAutomatedEmail(newHistory);

      const resultLogin = await dataSources.licenseAPI.findUser(true, args.companyName, '');
      const LoginPayload = {
        response: resultLogin.response, 
        username: args.companyName, 
        message: resultLogin.message,
        accountType: resultLogin.user[0].accountType,
        pocLicenseCounter: resultLogin.user[0].pocLicenseCounter,
      }

      pubsub.publish(POC_COUNTER_MUTATED, {
        pocCounterMutated: LoginPayload
      });

      const historyMutatedPayload = {
        id: newHistory._id,
        username: newHistory.username,
        actionType: newHistory.actionType,
        domainName: newHistory.domainName,
        dateCreated: new Date(newHistory.dateCreated).toISOString().split('.')[0],
        dateExpired: new Date(newHistory.dateExpired).toISOString().split('.')[0]
      }

      pubsub.publish(HISTORY_MUTATED, {
        historyMutated: historyMutatedPayload
      });

      return {
        response: resultAPI.code, 
        message: resultAPI.results.message, 
        companyName: args.companyName,
        mongoDbResponse: insertResult.mongoDbResponse,
        mailJetResponse: sendEmailResponse.response,
        decrementResponse: decrementResponse.response
      };
    },
    extension: async (_, args, {dataSources}) => {
      const resultAPI = await dataSources.licenseAPI.extendLicense(args.companyName, args.domainName, args.numberOfDays);
      if(resultAPI.code != 200){
        return {}
      }
      const actionType = 'extend poc'; 
      const insertResult = await dataSources.licenseAPI.insertHistory(args.companyName, actionType, args.domainName, args.numberOfDays);
      if(insertResult.mongoDbResponse != 200){
        return {}
      }
      const newHistory = insertResult.historyResult;
      const decrementResponse = await dataSources.licenseAPI.decrementPocLicense(args.companyName, args.accountType);
      const sendEmailResponse = await sendAutomatedEmail(newHistory);

      const resultLogin = await dataSources.licenseAPI.findUser(true, args.companyName, '');
      const LoginPayload = {
        response: resultLogin.response, 
        username: args.companyName, 
        message: resultLogin.message,
        accountType: resultLogin.user[0].accountType,
        pocLicenseCounter: resultLogin.user[0].pocLicenseCounter
      };

      pubsub.publish(POC_COUNTER_MUTATED, {
        pocCounterMutated: LoginPayload
      });

      const historyMutatedPayload = {
        id: newHistory._id,
        username: newHistory.username,
        actionType: newHistory.actionType,
        domainName: newHistory.domainName,
        dateCreated: new Date(newHistory.dateCreated).toISOString().split('.')[0],
        dateExpired: new Date(newHistory.dateExpired).toISOString().split('.')[0]
      }

      pubsub.publish(HISTORY_MUTATED, {
        historyMutated: historyMutatedPayload
      });

      return {
        response: resultAPI.code, 
        message: resultAPI.results.message, 
        companyName: args.companyName,
        mongoDbResponse: insertResult.mongoDbResponse,
        mailJetResponse: sendEmailResponse.response,
        decrementResponse: decrementResponse.response
       }
    }
  },
  Subscription: {
    pocCounterMutated: {
      subscribe: (_, __, {pubsub}) => pubsub.asyncIterator(POC_COUNTER_MUTATED)
    },
    historyMutated: {
      subscribe: withFilter((_, __, {pubsub}) => pubsub.asyncIterator(HISTORY_MUTATED), 
      (payLoad, args) => {  
        if(args.accountType === 'admin'){
          return true;
        } 
        return payLoad.historyMutated.username === args.username
      })
    }
  }
};

mongoose
  .connect(
    `mongodb+srv://viscient:P!nkUnic0rn@viscient-cluster-dmqxq.gcp.mongodb.net/viscient-licensing?retryWrites=true`,
    {
      useCreateIndex: true,
      useNewUrlParser: true
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const pubsub = new PubSub();

const server = new ApolloServer({
  typeDefs,
  resolvers: resolvers as any,
  introspection: true,
  playground: true,
  dataSources: () => ({
    randomUserAPI: new RandomUserDataSource(),
    licenseAPI: new LicenseDataSource()
  }),
  context: ({req, res}) => ({req,res,pubsub})
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
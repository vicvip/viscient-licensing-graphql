import { ApolloServer, gql, IResolverObject } from "apollo-server";
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
    login(username: String!, password: String!): LoginPayload
    history(username: String!, accountType: String!): History
  }

  type Mutation {
    login(username: String!, password: String!): LoginPayload
    activation(companyName: String!, domainName: String!, numberOfDays: Int): ActivationPayload
    extension(companyName: String!, domainName: String!, numberOfDays: Int): ActivationPayload
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
    accountType: String
  }

  type ActivationPayload {
    response: String,
    message: String,
    companyName: String,
    mongoDbResponse: String,
    mailJetResponse: String
  }
`;

// login(email: "zxc@zxc.com", password: "zxczxc"){
//   token
//   user{
//     id
//     name
//     email
//   }

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
    }
  },
  Mutation: {
    login: async (_, args, { dataSources }) => {
      const result = await dataSources.licenseAPI.findUser(args.username, args.password);
      if(result.response === '404'){
        return {
          response: result.response, username: args.username, message: result.message
        }
      }
      const token = sign({ username: args.username }, APP_SECRET);
      return {response: result.response, username: args.username, message: result.message, token: token, accountType: result.user[0].accountType };
    },
    activation: async (_, args, {dataSources}) => {
      const resultAPI = await dataSources.licenseAPI.activateLicense(args.companyName, args.domainName, args.numberOfDays);
      if(resultAPI.code != 200){
        return {}
      }
      const actionType = 'activate poc'; 
      const insertResult = await dataSources.licenseAPI.insertHistory(args.companyName, actionType, args.domainName, args.numberOfDays);
      if(insertResult.mongoDbResponse != 200){
        return {}
      }
      const sendEmailResponse = sendAutomatedEmail(insertResult.historyResult);
      return {
        response: resultAPI.code, 
        message: resultAPI.results.message, 
        companyName: args.companyName,
        mongoDbResponse: insertResult.mongoDbResponse,
        mailJetResponse: sendEmailResponse
       }
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
      const sendEmailResponse = sendAutomatedEmail(insertResult.historyResult);
      return {
        response: resultAPI.code, 
        message: resultAPI.results.message, 
        companyName: args.companyName,
        mongoDbResponse: insertResult.mongoDbResponse,
        mailJetResponse: sendEmailResponse
       }
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

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
  dataSources: () => ({
    randomUserAPI: new RandomUserDataSource(),
    licenseAPI: new LicenseDataSource()
  })
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
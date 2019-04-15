import { ApolloServer, gql, IResolverObject } from "apollo-server";
import fetch from "node-fetch";
import { RandomUserDataSource } from "./RandomUserDataSource";
import { LicenseDataSource } from "./LicenseDataSource";
import { DataSource } from "apollo-datasource";
import { APP_SECRET, getUserId} from './utils';
import { sign } from 'jsonwebtoken';
import { resultKeyNameFromField } from "apollo-utilities";
import mongoose from 'mongoose';
import User from './models/Credential';

const typeDefs = gql`
  type Query {
    licenses(name: String): Licenses
    login(username: String!, password: String!): LoginPayload
    history(username: String!): History
  }

  type Mutation {
    login(username: String!, password: String!): LoginPayload
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
    username: String,
    actionType: String,
    dateCreated: String,
    Items: License,
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
    password: String
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
    login: async (_, args, { dataSources }) => {
      //GET METHOD NOT IN USED
      const result = await dataSources.licenseAPI.loginUser(args.username, args.password);
      //const token = sign({ userId: result.username }, APP_SECRET);
      const token = sign({ username: result.username }, APP_SECRET);
      return {response: result.response, user: result.username, message: result.message, token: token };
    },
    history: async (_, args, { dataSources }) => {
      const result = await dataSources.licenseAPI.findHistory(args.username);
      if(result.response === '404'){
        return {
          response: result.response,
          message: result.message,
          username: result.username,
          historyDetail: null
        }
      }
      // var asd;
      // for (var key in result.history[0].items) {
      //   if (result.history[0].items.hasOwnProperty(key)) {
      //       console.log(key + " -> " + result.history[0].items[key]);
      //   }
      // }

      // Object.keys(result.history[0].items).forEach(function(key, index) {
      //   console.log(index);
      //   console.log(key, result.history[0].items[key]);
      // });

      let historyDetails:object[] = [];
      for (let i in result.history) {
        let historyDetail = {
          username: result.history[i].username,
          actionType: result.history[i].actionType,
          dateCreated: new Date(result.history[i].dateCreated).toISOString(),
          Items: result.history[i].items
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
    // login: async (_, args, { dataSources }) => {
    //   const result = await dataSources.licenseAPI.loginUser(args.username, args.password);
    //   const token = sign({ username: result.username }, APP_SECRET);
    //   return {response: result.response, user: result.username, message: result.message, token: token };
    // }
    login: async (_, args, { dataSources }) => {
      const result = await dataSources.licenseAPI.findUser(args.username, args.password);
      const token = sign({ username: result.username }, APP_SECRET);
      return {response: result.response, username: result.username, message: result.message, token: token };
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
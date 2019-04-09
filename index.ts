import { ApolloServer, gql, IResolverObject } from "apollo-server";
import fetch from "node-fetch";
import { RandomUserDataSource } from "./RandomUserDataSource";
import { LicenseDataSource } from "./LicenseDataSource";

const typeDefs = gql`
  type Query {
    licenses(name: String): Licenses
  }

  type Licenses {
    credit: Credit,
    license: License
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
`;

const resolvers: IResolverObject = {
  Query: {
    licenses: async (_, args, { dataSources }) => {
      const response = await dataSources.licenseAPI.queryLicense(args.name);
      var data = response.results.data;
      return data;
    },
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    randomUserAPI: new RandomUserDataSource(),
    licenseAPI: new LicenseDataSource()
  })
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});

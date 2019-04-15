import mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface IHistory extends mongoose.Document {
    username: string,
    actionType: string,
    items: Items,
    dateCreated: string
}

interface Items {
    VAppStreamerWS: number, 
    VBrainObject: number, 
    VAppTrafficIntensity: number, 
    VAppPeopleCounter : number,
    VAppStreamerTornado: number, 
    VAppIllegalPark: number, 
    VAppCounter: number, 
    VAppFP: number, 
    VAppAnalyticsTornado: number, 
    VAppStreamerEventPush: number
}

const UserSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  actionType: {
    type: String,
    required: true
  },
  items: {
    type: Object,
    required: false
  },
  dateCreated: {
    type: String,
    required: true
  }
}, {collection: 'history'});

const History = mongoose.model<IHistory>("History", UserSchema);

export default History;
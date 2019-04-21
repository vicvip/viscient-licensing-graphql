import mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface IHistory extends mongoose.Document {
    username: string,
    actionType: string,
    domainName: string,
    dateCreated: string,
    dateExpired: string
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
  domainName: {
    type: String,
    required: false
  },
  dateCreated: {
    type: String,
    required: true
  },
  dateExpired: {
    type: String,
    required: true
  }
}, {collection: 'history'});

const History = mongoose.model<IHistory>("History", UserSchema);

export default History;
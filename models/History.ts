import mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface IHistory extends mongoose.Document {
    _id: string,
    username: string,
    actionType: string,
    domainName: string,
    dateCreated: string,
    dateExpired: string
}

const UserSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
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
    type: Date,
    required: true
  },
  dateExpired: {
    type: Date,
    required: true
  }
}, {collection: 'history'});

const History = mongoose.model<IHistory>("History", UserSchema);

export default History;
import mongoose from "mongoose";
import { Int32 } from "bson";

const Schema = mongoose.Schema;

export interface ICredential extends mongoose.Document {
    username: string,
    password: string,
    type: string,
    pocLicenseCounter: number,
}

// Create the User Schema.
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    required: true,
  },
  pocLicenseCounter:{
    type: Number,
    required: true
  }
}, {collection: 'credentials'});

const Credential = mongoose.model<ICredential>("Credential", UserSchema);

export default Credential;
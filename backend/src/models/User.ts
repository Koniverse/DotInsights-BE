import {
  Document, Model, Schema, model
} from 'mongoose';

export interface IUser extends Document {
  /** Name of the User */
  address: string;
  /** Name of the author */
  salt: number;
  project_voted: [string]
}

interface IUserModel extends Model<IUser> { }

const schema = new Schema({
  address: { type: String, required: true },
  salt: { type: Number, required: true },
  project_voted: { type: [String]}
});

export const User: IUserModel = model<IUser, IUserModel>('User', schema);

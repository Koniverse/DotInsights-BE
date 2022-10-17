import {
  Document, Model, Schema, model
} from 'mongoose';

export interface IUser extends Document {
  /** Name of the User */
  address: string;
  /** Name of the author */
  salt: number;
}

interface IUserModel extends Model<IUser> { }

const schema = new Schema({
  address: { type: String, required: true },
  salt: { type: Number, required: true },
});

export const User: IUserModel = model<IUser, IUserModel>('User', schema);

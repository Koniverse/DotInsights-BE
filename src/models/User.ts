import {
  Document, Model, Schema, model
} from 'mongoose';

export interface IUser extends Document {
  address: string;
  balanceData: string;
  lastCheckBalanceTime: Date;
  voteAbility: boolean,
  salt: number;
  votedProjects: [string]
}

interface IUserModel extends Model<IUser> { }

const schema = new Schema({
  address: { type: String, required: true, index: true },
  salt: { type: Number, required: true },
  balanceData: { type: String },
  lastCheckBalanceTime: { type: String },
  voteAbility: { type: Boolean },
  votedProjects: { type: [String] }
});

export const User: IUserModel = model<IUser, IUserModel>('User', schema);

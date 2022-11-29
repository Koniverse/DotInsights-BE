import {
  Document, Model, Schema, model
} from 'mongoose';

export interface IVote extends Document {
  address: string;
  project_id: string;
  signMessage: string;
  signature: string;
  createDate: Date;
  createTime: Date;
}

interface IVoteModel extends Model<IVote> {}

const schema = new Schema({
  address: { type: String, index: true },
  project_id: { type: String, required: true, index: true },
  signMessage: { type: String },
  signature: { type: String },
  createDate: { type: String },
  createTime: { type: Date }
});

export const Vote: IVoteModel = model<IVote, IVoteModel>(
  'Vote',
  schema
);

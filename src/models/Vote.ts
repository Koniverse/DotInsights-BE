import {
  Document, Model, Schema, model
} from 'mongoose';

export interface IVote extends Document {
  /** Name of the Vote */
  /** Name of the author */
  address: string;
  project_id: string;
}

interface IVoteModel extends Model<IVote> {}

const schema = new Schema({
  address: { type: String, index: true },
  project_id: { type: String, required: true, index: true }
});

export const Vote: IVoteModel = model<IVote, IVoteModel>(
  'Vote',
  schema
);

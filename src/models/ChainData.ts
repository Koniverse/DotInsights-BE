import {
  Document, Model, model, Schema
} from 'mongoose';

export interface IChainData extends Document {
  /** Name of the ChainData */
  /** Name of the author */
  data_save: string;
  time: Date;
}

interface IChainDataModel extends Model<IChainData> {
}

const schema = new Schema({
  data_save: { type: String },
  time: { type: Date, default: Date.now }
});

export const ChainData: IChainDataModel = model<IChainData, IChainDataModel>(
  'ChainData',
  schema
);

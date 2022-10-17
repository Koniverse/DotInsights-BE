import {
  Document, Model, Schema, model
} from 'mongoose';

export interface IProject extends Document {
  /** Name of the Project */
  name: string;
  /** Name of the author */
  vote: number;
  projectId: number;
  address_votes: [string]
}

interface IProjectModel extends Model<IProject> { }

const schema = new Schema({
  name: { type: String, required: true },
  vote: { type: Number },
  projectId: { type: Number, required: true },
  address_votes: { type: [String]}
});

export const Project: IProjectModel = model<IProject, IProjectModel>('Project', schema);

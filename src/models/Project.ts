import {
  Document, Model, Schema, model
} from 'mongoose';

export interface IProject extends Document {
  /** Name of the Project */
  /** Name of the author */
  project_id: string;
  // TODO: Add support more field of project
}

interface IProjectModel extends Model<IProject> { }

const schema = new Schema({
  project_id: { type: String, required: true }
});

export const Project: IProjectModel = model<IProject, IProjectModel>('Project', schema);

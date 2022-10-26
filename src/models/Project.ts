import {
  Document, Model, Schema, model
} from 'mongoose';

export interface IProject extends Document {
  page: string,
  project_id: string;
  created_time: string,
  last_edited_time: string,
  project: string;
  'layer_0.1': string;
  layer: string;
  layer_1_relation: string;
  native: boolean;
  category: string;
  category_id: string;
  gitHub: string;
  token: string;
  website: string;
  twitter: string;
  investors: string;
  w3f_grant: string;
  w3f_grant_awarded_projects: string;
  status: string;
  related_back_to_dotsama: string;
  vietnamese_community: string;
  dotsama_investors: string;
  deployed_projects: string;
  dotsama_investors_1: string;
  evm_compatible: boolean;
  subcategory: string;
  substrate_builders_programs: boolean;
  vote_count: number;
}

interface IProjectModel extends Model<IProject> { }

const schema = new Schema({
  project_id: { type: String, required: true, index: true },
  project: { type: 'string', required: true },
  created_time: { type: 'string' },
  last_edited_time: { type: 'string' },
  'layer_0.1': { type: 'string' },
  layer: { type: 'string' },
  layer_1_relation: { type: 'string' },
  native: { type: 'boolean' },
  category: { type: 'string' },
  category_id: { type: 'string' },
  gitHub: { type: 'string' },
  token: { type: 'string' },
  website: { type: 'string' },
  twitter: { type: 'string' },
  investors: { type: 'string' },
  w3f_grant: { type: 'string' },
  w3f_grant_awarded_projects: { type: 'string' },
  status: { type: 'string' },
  related_back_to_dotsama: { type: 'string' },
  vietnamese_community: { type: 'string' },
  dotsama_investors: { type: 'string' },
  deployed_projects: { type: 'string' },
  dotsama_investors_1: { type: 'string' },
  evm_compatible: { type: 'boolean' },
  subcategory: { type: 'string' },
  substrate_builders_programs: { type: 'boolean' },
  vote_count: { type: 'number', default: 0, required: true }
});

export const Project: IProjectModel = model<IProject, IProjectModel>('Project', schema);

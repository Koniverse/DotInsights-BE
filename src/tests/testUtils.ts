import chai from 'chai';
import { ADDRESS, PROJECT, HOST_NAME } from './testData';

const dataDemo = { address: ADDRESS, project: PROJECT };
export const addDataTest = async () => {
  await chai.request(HOST_NAME)
    .post('/api/createDemo').send(dataDemo);
};
export const removeDataTest = async () => {
  await chai.request(HOST_NAME)
    .post('/api/createDemo').send(dataDemo);
};

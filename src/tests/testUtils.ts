import chai from 'chai';
import { address, project, HOST_NAME } from './testData';

const dataDemo = { address, project };
export const addDataTest = async () => {
  await chai.request(HOST_NAME)
    .post('/api/createDemo').send(dataDemo);
};
export const removeDataTest = async () => {
  await chai.request(HOST_NAME)
    .post('/api/createDemo').send(dataDemo);
};

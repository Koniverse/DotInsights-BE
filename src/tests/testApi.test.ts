import chai, { expect } from 'chai';

import chaiHttp from 'chai-http';
import { Keyring } from '@polkadot/api';
import { stringToU8a, u8aToHex } from '@polkadot/util';
import { RANDOM_SALT } from '../controllers/project';
import { address, project, HOST_NAME } from './testData';
import { addDataTest, removeDataTest } from './testUtils';

chai.should();
chai.use(chaiHttp);
const { project_id } = project;

describe('Testing all api in Project', () => {
  beforeAll(async () => {
    await addDataTest();
  });

  afterAll(async () => {
    await removeDataTest();
    // console.log(a);
  });

  beforeEach(() => {
    // runs before each test in this block
    // console.log('beforeEach');
  });

  afterEach(() => {
    // runs after each test in this block
    // console.log('affter');
  });

  it('Test api /api/getMessage', done => {
    const bodeSend = { address };
    // Make POST Request
    chai.request(HOST_NAME)
      .post('/api/getMessage').send(bodeSend)
      .end((err, res) => {
        expect(res.body.message).include(RANDOM_SALT);
        done();
      });
  });

  it('check project does not exist in /api/toggleVoteProject', done => {
    const bodySendProjectNotExist = {
      address: '652365236611',
      project_id: 'zzza',
      signature: ''
    };
    chai.request(HOST_NAME)
      .post('/api/toggleVoteProject').send(bodySendProjectNotExist)
      .end((err, res) => {
        expect(res.error.text).include('Project Not Found');
        done();
      });
  });

  it('check user does not exist in /api/toggleVoteProject', done => {
    const bodySendUserNotExist = {
      address: '652365236611',
      project_id,
      signature: ''
    };
    chai.request(HOST_NAME)
      .post('/api/toggleVoteProject').send(bodySendUserNotExist)
      .end((err, res) => {
        expect(res.error.text).include('User Not Found');
        done();
      });
  });
  it('check Wrong signature! in api /api/toggleVoteProject', done => {
    const bodyData = {
      address,
      project_id,
      signature: ''
    };
    chai.request(HOST_NAME)
      .post('/api/toggleVoteProject').send(bodyData)
      .end((err, res) => {
        expect(res.error.text).include('Wrong signature!');
        done();
      });
  });
  it('Test case success in api api/toggleVoteProject', done => {
    const bodySend = { address };
    // Make POST Request
    chai.request(HOST_NAME)
      .post('/api/getMessage').send(bodySend)
      .end((err, res) => {
        const { message } = res.body;
        const name = 'Dotinsights';
        const keyringNew = new Keyring({ type: 'sr25519' });
        const alice = keyringNew.addFromUri(`//${name}`, { name });
        const messageConvert = stringToU8a(message);
        const signature = u8aToHex(alice.sign(messageConvert));
        const bodyData = { address, project_id, signature };
        chai.request(HOST_NAME)
          .post('/api/toggleVoteProject').send(bodyData)
          .end((err, res) => {
            expect(res.body).to.have.property('isVote', true);
            done();
          });
      });
  });
  it('Test case fail in api api/toggleVoteProject', done => {
    const bodySend = { address };
    // Make POST Request
    chai.request(HOST_NAME)
      .post('/api/getMessage').send(bodySend)
      .end((err, res) => {
        const { message } = res.body;
        const name = 'Dotinsights';
        const keyringNew = new Keyring({ type: 'sr25519' });
        const alice = keyringNew.addFromUri(`//${name}`, { name });
        const messageConvert = stringToU8a(message);
        const signature = u8aToHex(alice.sign(messageConvert));
        const bodyData = { address, project_id, signature };
        chai.request(HOST_NAME)
          .post('/api/toggleVoteProject').send(bodyData)
          .end((err, res) => {
            expect(res.body).to.have.property('isVote', false);
            done();
          });
      });
  });
  it('Test api api/getVotedProject', done => {
    const bodySend = { address };
    // Make POST Request
    chai.request(HOST_NAME)
      .post('/api/getVotedProject').send(bodySend)
      .end((err, res) => {
        expect(res.body).to.be.an('array');
        done();
      });
  });
  it('Test api /api/chainData/polkadot', done => {
    chai.request(HOST_NAME)
      .get('/api/chainData/polkadot')
      .end((err, res) => {
        expect(res.body).to.have.property('accounts');
        expect(res.body).to.have.property('accounts_change_24h');
        expect(res.body).to.have.property('transfers');
        expect(res.body).to.have.property('transfers_change_24h');
        expect(res.body).to.have.property('current_price');
        expect(res.body).to.have.property('volume24h');
        expect(res.body).to.have.property('market_cap');
        expect(res.body).to.have.property('market_cap_rank');
        done();
      });
  });
});

import chai, { expect } from 'chai';

import chaiHttp from 'chai-http';
import { HOST_NAME, ADDRESS_TEST_MULTIPLE_NETWORK_FROM_SUBSCAN } from './testData';

chai.should();
chai.use(chaiHttp);

describe('Testing all api in check balance subscan', () => {
  beforeAll(async () => {
  });

  afterAll(async () => {
  });

  beforeEach(() => {
    // runs before each test in this block
    // console.log('beforeEach');
  });

  afterEach(() => {
    // runs after each test in this block
    // console.log('affter');
  });
  describe('Test case success in api api/checkBalanceSubscan', () => {
    test.each(Object.entries(ADDRESS_TEST_MULTIPLE_NETWORK_FROM_SUBSCAN))(
      'check Network %p',
      (network, data) => {
        const { address, status } = data;
        const bodyData = { address };
        if (address) {
          chai.request(HOST_NAME)
            .post('/api/checkBalanceSubscan').send(bodyData)
            .end((errData: any, resData:any) => {
              if (errData) {
              // eslint-disable-next-line no-console
                console.log(errData);
              }
              expect(resData.body).to.have.property('status', status);
            });
        }
      }
    );
  });
});

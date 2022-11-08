// eslint-disable-next-line import/no-extraneous-dependencies
const autocannon = require('autocannon');
// eslint-disable-next-line import/no-extraneous-dependencies
const { printResult } = require('autocannon');

const HOST_NAME = 'http://localhost:3000';

// async/await
async function runChain() {
  console.log('Benchmark Test with /api/chainData/polkadot');
  const result = await autocannon({
    url: `${HOST_NAME}/api/chainData/polkadot`,
    connections: 1000, // default
    pipelining: 1, // default
    duration: 10 // default
  });
  const printResultLog = printResult(result, {});
  console.log(printResultLog);
}

async function toggleVoteProject() {
  const linkTest = `${HOST_NAME}/api/toggleVoteProject`;
  const result = await autocannon({
    url: linkTest,
    method: 'POST',
    connections: 1000, // default
    pipelining: 1, // default
    duration: 10, // default
    requests: [{
      method: 'POST',
      path: '/api/toggleVoteProject',
      headers: {
        'Content-type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        address: 'imbue_network'
      })
    }]
  });
  console.log('Benchmark Test with /api/toggleVoteProject');
  const printResultLog = printResult(result, {});
  console.log(printResultLog);
}

async function getVotedProjectTest() {
  const linkTest = `${HOST_NAME}/api/getVotedProject`;
  const result = await autocannon({
    url: linkTest,
    method: 'POST',
    connections: 1000, // default
    pipelining: 1, // default
    duration: 10, // default
    requests: [{
      method: 'POST',
      path: '/api/getVotedProject',
      headers: {
        'Content-type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        address: '5D29JnJYTYFnA8QSQyrWi4EF5xcVyMgUer14e6HV2DUzMnnK',
        project_id: 'zzza',
        signature: ''
      })
    }]
  });
  console.log('Benchmark Test with /api/getVotedProject');
  const printResultLog = printResult(result, {});
  console.log(printResultLog);
}

async function runGetProjects() {
  const linkTest = `${HOST_NAME}/api/getProjects`;
  const result = await autocannon({
    url: linkTest,
    connections: 1000, // default
    pipelining: 1, // default
    duration: 10 // default
  });
  console.log('Benchmark Test with /api/getProjects');
  const printResultLog = printResult(result, {});
  console.log(printResultLog);
}

async function runGetVoteCount() {
  const linkTest = `${HOST_NAME}/api/getVoteCount`;
  const result = await autocannon({
    url: linkTest,
    connections: 1000, // default
    pipelining: 1, // default
    duration: 10 // default
  });
  console.log('Benchmark Test with /api/getVoteCount');
  const printResultLog = printResult(result, {});
  console.log(printResultLog);
}

runChain();
runGetVoteCount();
runGetProjects();
toggleVoteProject();
getVotedProjectTest();

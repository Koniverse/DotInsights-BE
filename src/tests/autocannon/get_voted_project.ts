const autocannon = require('autocannon');
const { printResult } = require('autocannon');

const HOST_NAME = 'http://localhost:3000';
// async/await
async function test() {
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
  const printResultLog = printResult(result, {});
  console.log(printResultLog);
}
test();

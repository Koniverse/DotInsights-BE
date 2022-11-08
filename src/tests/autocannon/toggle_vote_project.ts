const autocannon = require('autocannon');
// @ts-ignore
const { printResult } = require('autocannon');

const HOST_NAME = 'http://localhost:3000';
// async/await
async function test() {
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
  const printResultLog = printResult(result, {});
  console.log(printResultLog);
}
test();

const autocannon = require('autocannon');
const { printResult } = require('autocannon');

const HOST_NAME = 'http://localhost:3000';
// async/await
async function test() {
  const linkTest = `${HOST_NAME}/api/getVoteCount`;
  const result = await autocannon({
    url: linkTest,
    connections: 1000, // default
    pipelining: 1, // default
    duration: 10 // default
  });
  const printResultLog = printResult(result, {});
  console.log(printResultLog);
}
test();

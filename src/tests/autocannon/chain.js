const autocannon = require('autocannon');
const { printResult } = require('autocannon');

const HOST_NAME = 'http://localhost:3000';
// async/await
async function test() {
  console.log(HOST_NAME);
  const result = await autocannon({
    url: `${HOST_NAME}/api/chainData/polkadot`,
    connections: 10, // default
    pipelining: 1, // default
    duration: 10 // default
  });
  const printResultLog = printResult(result, {});
  console.log(printResultLog);
  console.log(printResult(result, {}));
  printResult(result, {});
}
test();

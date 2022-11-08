const autocannon = require('autocannon');
const { printResult } = require('autocannon');
const { Project } = require('../../models/Project');

const { HOST_NAME } = process.env;
// async/await
async function test() {
  // Project
  const linkTest = `${HOST_NAME}/api/getProjects`;
  const result = await autocannon({
    url: linkTest,
    connections: 10, // default
    pipelining: 1, // default
    duration: 10 // default
  });
  const printResultLog = printResult(result, {});
  console.log(printResultLog);
}
test();

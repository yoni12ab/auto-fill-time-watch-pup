#!/usr/bin/env node
const { execSync } = require("child_process");
console.log("args", process.argv);

const [, , COMPANY_NUMBER, EMPLOYEE_NUMBER, PASSWORD] = process.argv;
// build the typescript files
execSync(
  `node ${__dirname}/dist/index.js ${COMPANY_NUMBER} ${EMPLOYEE_NUMBER} ${PASSWORD}`,
  { cwd: __dirname }
);

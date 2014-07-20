var fs = require('fs');

console.log("ARGUMENTS:\n");
console.log("\t" + JSON.stringify(require('yargs').argv));
console.log("ENVIRONMENT VARIABLES:\n");
console.log("\t" + JSON.stringify(Object.keys(process.env)));
console.log('READ FILE FROM WORKING DIRECTORY:');
console.log("\t" + fs.readFileSync('./local.txt').toString());

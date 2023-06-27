
const cp    = require("child_process");
const util  = require("util");
const chalk = require("chalk");

exports.exec = async commandline => {

  console.log(chalk.cyanBright.bold("> " + commandline));
  console.log();

  return await util.promisify(cp.exec)(commandline, {stdio: "inherit"});
};

exports.dockerImage = "alpine";

exports.createTimestamp = () => new Date().toISOString().replace(/[\W+T]/g, "-").slice(0, -1);

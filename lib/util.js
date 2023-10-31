
const cp    = require("child_process");
const util  = require("util");
const chalk = require("chalk");

exports.exec = async commandline => {

  console.log(chalk.cyanBright.bold("> " + commandline));
  console.log();

  return await util.promisify(cp.exec)(commandline, {stdio: "inherit"});
};

exports.spawn = async (command, args) => {

  console.log(chalk.cyanBright.bold("> " + command + " " + args.join(" ")));
  console.log();

  return await util.promisify(cp.spawn)(command, args, {stdio: "inherit", shell: true});
};

exports.dockerImage = "alpine";

exports.createTimestamp = () => new Date().toISOString().replace(/[\W+T]/g, "-").slice(0, -1);

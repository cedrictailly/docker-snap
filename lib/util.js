
const cp    = require("child_process");
const chalk = require("chalk");

exports.exec = commandline => {

  console.log(chalk.cyanBright.bold("> " + commandline));
  console.log();

  return new Promise((resolve, reject) => {
    cp.exec(commandline, (error, stdout, stderr) => {
      if (error)
        reject(error);
      else
        resolve({stdout, stderr});
    });
  });
};

exports.spawn = async (command, args = []) => {

  console.log(chalk.cyanBright.bold("> " + command + " " + args.join(" ")));
  console.log();

  return new Promise((resolve, reject) => {

    const child = cp.spawn(command, args, {stdio: "inherit", shell: true});

    child.on("exit", code => {
      if (code)
        reject(new Error(`Command '${command} ${args.join(" ")}' failed with code ${code}.`));
      else
        resolve();
    });
  });
};

exports.dockerImage = "alpine";

exports.createTimestamp = () => new Date().toISOString().replace(/[\W+T]/g, "-").slice(0, -1);


const cp    = require("child_process");
const fs    = require("fs");
const path  = require("path");
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

exports.createTimestamp = () => {

  let now = new Date();

  now = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

  return now.toISOString().replace(/\D/g, "-").slice(0, -1);
};

exports.readTimestamps = directory => {

  const result = [];

  for (const file of fs.readdirSync(directory, {withFileTypes: true})) {

    if (!file.isDirectory())
      continue;

    const [year, month, day, hour, minute, second, millisecond] = file.name.split("-");

    const timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}`);

    if (isNaN(timestamp.getTime()))
      throw new Error(`Error parsing timestamp from directory '${file.name}'`);

    result.push({
      timestamp: new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}`),
      directory: path.join(directory, file.name),
    });
  }

  result.sort((a, b) => a.timestamp - b.timestamp);

  return result;
};
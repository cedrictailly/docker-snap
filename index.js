
const cp         = require("child_process");
const util       = require("util");
const fs         = require("fs");
const path       = require("path");
const micromatch = require("micromatch");
const fg         = require("fast-glob");
const chalk      = require("chalk");

const exec = async commandline => {

  console.log(chalk.cyanBright.bold("> " + commandline));
  console.log();

  return await util.promisify(cp.exec)(commandline, {stdio: "inherit"});
};

const ds = module.exports;

exports.dockerImage     = "alpine";
exports.createTimestamp = () => new Date().toISOString().replace(/[\W+T]/g, "-").slice(0, -1);

exports.listVolumes = async filter => {

  let volumes = (await exec("docker volume ls --format \"{{.Name}}\"")).stdout.split("\n").filter(Boolean);

  if (filter)
    volumes = micromatch(volumes, filter);

  return volumes;
};

exports.createVolume = async volume => await exec(`docker volume create --name ${volume}`);
exports.removeVolume = async volume => await exec(`docker volume rm ${volume}`);

exports.duplicateVolume = async (source, destination) => {

  if (!destination)
    destination = source + "-" + ds.createTimestamp();

  ds.createVolume(destination);

  await exec(`docker run --rm -v ${source}:/from -v ${destination}:/to alpine ash -c "cd /from && cp -a . /to"`);
};

exports.saveVolume = async (volume, filename, overwrite = false) => {

  if (!filename)
    filename = volume + "-" + ds.createTimestamp() + ".tgz";
  else if (path.parse(filename).ext !== ".tgz")
    throw new Error(`Backup file '${filename}' must have a .tgz extension.`);

  filename = path.resolve(filename);

  if (fs.existsSync(filename) && fs.statSync(filename).isDirectory())
    filename = path.join(filename, volume + ".tgz");

  if (fs.existsSync(filename)) {
    if (overwrite)
      fs.unlinkSync(filename);
    else
      throw new Error(`File already exists for volume '${volume}'.`);
  }

  await exec(`docker run --rm -w /from -v ${volume}:/from -v ${path.dirname(filename)}:/to ${ds.dockerImage} tar -czvf /to/${path.basename(filename)} .`);
};

exports.loadVolume = async (filename, volume, overwrite = false) => {

  filename = path.resolve(filename);

  if (!volume)
    volume = path.parse(filename).name;

  if (path.parse(filename).ext !== ".tgz")
    throw new Error(`Backup file '${filename}' must have a .tgz extension.`);

  if ((await ds.listVolumes(volume)).length > 0) {
    if (!overwrite)
      throw new Error(`Volume '${volume}' already exists.`);
    else
      ds.removeVolume(volume);
  }

  ds.createVolume(volume);

  await exec(`docker run --rm -w /to -v ${volume}:/to -v ${filename}:/from/volume.tgz ${ds.dockerImage} tar -xzvf /from/volume.tgz`);
};

exports.saveVolumes = async (filter, directory, overwrite = false) => {

  const volumes = micromatch(await ds.listVolumes(), filter);

  if (!overwrite) {

    const existings = volumes.filter(volume => fs.existsSync(path.join(directory, `${volume}.tgz`)));

    if (existings.length > 0)
      throw new Error(`File already exists:\n${existings.map(volume => `  ${volume}.tgz`).join("\n")}`);
  }

  volumes.forEach(volume => {
    ds.saveVolume(volume, path.join(directory, volume + ".tgz"), overwrite);
  });
};

exports.loadVolumes = async (files, overwrite = false) => {

  files = await fg(path.resolve(files).replace(/\\/g, "/"), {onlyFiles: true});

  const volumes = files.map(file => path.parse(file).name);

  if (!overwrite) {

    const existings = (await ds.listVolumes()).filter(volume => volumes.includes(volume));

    if (existings.length > 0)
      throw new Error(`Volume already exists:\n${existings.map(volume => `  ${volume}`).join("\n")}`);
  }

  for (let f = 0; f < files.length; f++)
    await ds.loadVolume(files[f], volumes[f], overwrite);
};

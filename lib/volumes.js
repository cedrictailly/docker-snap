
const fs         = require("fs");
const path       = require("path");
const micromatch = require("micromatch");
const fg         = require("fast-glob");

const {exec, spawn, dockerImage, createTimestamp} = require("./util");

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
    destination = source + "-" + createTimestamp();

  exports.createVolume(destination);

  await spawn("docker", [
    "run",
    "--rm",
    "-v",
    source + ":/from",
    "-v",
    destination + ":/to",
    "alpine",
    "ash",
    "-c",
    "cd /from && cp -a . /to",
  ]);
};

exports.saveVolume = async (volume, filename, overwrite = false) => {

  if (!filename)
    filename = volume + "-" + createTimestamp() + ".tgz";
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

  await spawn("docker", [
    "run",
    "--rm",
    "-w",
    "/from",
    "-v",
    volume + ":/from",
    "-v",
    path.dirname(filename) + ":/to",
    dockerImage,
    "tar",
    "-czvf",
    "/to/" + path.basename(filename),
    ".",
  ]);
};

exports.loadVolume = async (filename, volume, overwrite = false) => {

  filename = path.resolve(filename);

  if (!volume)
    volume = path.parse(filename).name;

  if (path.parse(filename).ext !== ".tgz")
    throw new Error(`Backup file '${filename}' must have a .tgz extension.`);

  if ((await exports.listVolumes(volume)).length > 0) {
    if (!overwrite)
      throw new Error(`Volume '${volume}' already exists.`);
    else
      exports.removeVolume(volume);
  }

  exports.createVolume(volume);

  await spawn("docker", [
    "run",
    "--rm",
    "-w",
    "/to",
    "-v",
    volume + ":/to",
    "-v",
    filename + ":/from/volume.tgz",
    dockerImage,
    "tar",
    "-xzvf",
    "/from/volume.tgz",
  ]);
};

exports.saveVolumes = async (filter, directory, overwrite = false) => {

  const volumes = micromatch(await exports.listVolumes(), filter);

  if (!overwrite) {

    const existings = volumes.filter(volume => fs.existsSync(path.join(directory, `${volume}.tgz`)));

    if (existings.length > 0)
      throw new Error(`File already exists:\n${existings.map(volume => `  ${volume}.tgz`).join("\n")}`);
  }

  for (const volume of volumes)
    await exports.saveVolume(volume, path.join(directory, volume + ".tgz"), overwrite);
};

exports.loadVolumes = async (files, overwrite = false) => {

  files = await fg(path.resolve(files).replace(/\\/g, "/"), {onlyFiles: true});

  const volumes = files.map(file => path.parse(file).name);

  if (!overwrite) {

    const existings = (await exports.listVolumes()).filter(volume => volumes.includes(volume));

    if (existings.length > 0)
      throw new Error(`Volume already exists:\n${existings.map(volume => `  ${volume}`).join("\n")}`);
  }

  for (let f = 0; f < files.length; f++)
    await exports.loadVolume(files[f], volumes[f], overwrite);
};

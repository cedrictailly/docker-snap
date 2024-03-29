
const fs         = require("fs");
const path       = require("path");
const micromatch = require("micromatch");
const fg         = require("fast-glob");

const {exec, createTimestamp} = require("./util");

const ds = module.exports;

exports.listImages = async filter => {

  let images = (await exec("docker image ls --format \"json\"")).stdout.split("\n").filter(Boolean).map(JSON.parse);

  if (filter) {

    const match = micromatch.matcher(filter);

    images = images.filter(image => match(image.Repository));
  }

  return images;
};

// exports.saveVolume = async (volume, filename, overwrite = false) => {

//   if (!filename)
//     filename = volume + "-" + createTimestamp() + ".tgz";
//   else if (path.parse(filename).ext !== ".tgz")
//     throw new Error(`Backup file '${filename}' must have a .tgz extension.`);

//   filename = path.resolve(filename);

//   if (fs.existsSync(filename) && fs.statSync(filename).isDirectory())
//     filename = path.join(filename, volume + ".tgz");

//   if (fs.existsSync(filename)) {
//     if (overwrite)
//       fs.unlinkSync(filename);
//     else
//       throw new Error(`File already exists for volume '${volume}'.`);
//   }

//   await exec(`docker run --rm -w /from -v ${volume}:/from -v ${path.dirname(filename)}:/to ${ds.dockerImage} tar -czvf /to/${path.basename(filename)} .`);
// };

// exports.loadVolume = async (filename, volume, overwrite = false) => {

//   filename = path.resolve(filename);

//   if (!volume)
//     volume = path.parse(filename).name;

//   if (path.parse(filename).ext !== ".tgz")
//     throw new Error(`Backup file '${filename}' must have a .tgz extension.`);

//   if ((await ds.listVolumes(volume)).length > 0) {
//     if (!overwrite)
//       throw new Error(`Volume '${volume}' already exists.`);
//     else
//       ds.removeVolume(volume);
//   }

//   ds.createVolume(volume);

//   await exec(`docker run --rm -w /to -v ${volume}:/to -v ${filename}:/from/volume.tgz ${ds.dockerImage} tar -xzvf /from/volume.tgz`);
// };

// exports.saveVolumes = async (filter, directory, overwrite = false) => {

//   const volumes = micromatch(await ds.listVolumes(), filter);

//   if (!overwrite) {

//     const existings = volumes.filter(volume => fs.existsSync(path.join(directory, `${volume}.tgz`)));

//     if (existings.length > 0)
//       throw new Error(`File already exists:\n${existings.map(volume => `  ${volume}.tgz`).join("\n")}`);
//   }

//   for (const volume of volumes)
//     await ds.saveVolume(volume, path.join(directory, volume + ".tgz"), overwrite);
// };

// exports.loadVolumes = async (files, overwrite = false) => {

//   files = await fg(path.resolve(files).replace(/\\/g, "/"), {onlyFiles: true});

//   const volumes = files.map(file => path.parse(file).name);

//   if (!overwrite) {

//     const existings = (await ds.listVolumes()).filter(volume => volumes.includes(volume));

//     if (existings.length > 0)
//       throw new Error(`Volume already exists:\n${existings.map(volume => `  ${volume}`).join("\n")}`);
//   }

//   for (let f = 0; f < files.length; f++)
//     await ds.loadVolume(files[f], volumes[f], overwrite);
// };

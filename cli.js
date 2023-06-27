
const fs        = require("fs");
const path      = require("path");
const readline  = require("readline");
const {program} = require("commander");
const chalk     = require("chalk");

const ds  = require(".");
const pkg = require("./package.json");

program
  .name("ds")
  .version(pkg.version)
  .description(pkg.description);

// --- Volumes -------------------------------------------------------------- //

const volumesCommands = program
  .command("volume")
  .alias("v")
  .description("Volumes commands");

volumesCommands
  .command("list [filter]")
  .alias("ls")
  .description("List Docker volumes")
  .action(async filter => {
    (await ds.listVolumes(filter)).forEach(volume => console.log(volume));
  });

volumesCommands
  .command("create <volume>")
  .alias("c")
  .description("Create a Docker volume")
  .action(async volume => {
    await ds.createVolume(volume);
  });

volumesCommands
  .command("remove <volume-filter>")
  .alias("r")
  .description("Create a Docker volume")
  .action(async filter => {

    const volumes = await ds.listVolumes(filter);

    if (volumes.length === 0)
      return console.log(chalk.redBright(`No volumes matching '${filter}' found.`));

    console.log();
    console.log(`Volumes matching "${filter}":\n${volumes.map(v => "  " + v).join("\n")}`);
    console.log();

    const rl = readline.createInterface({
      input : process.stdin,
      output: process.stdout,
    });

    rl.question(chalk.redBright("Confirm deletion (y/N): "), async answer => {
      rl.close();
      if (answer.toLowerCase() === "y") {
        for (const volume of volumes)
          await ds.removeVolume(volume);
      }
    });
  });

volumesCommands
  .command("duplicate <volume> [new-volume]")
  .alias("d")
  .description("Create a Docker volume")
  .action(async (source, destination) => {
    await ds.duplicateVolume(source, destination);
  });

volumesCommands
  .command("save <volume> [filename]")
  .alias("s")
  .description("Save a Docker volume to a 7zip archive")
  .option("-f, --force", "Overwrite existing file")
  .action(async (volume, filename, options) => {
    await ds.saveVolume(volume, filename, options.force);
  });

volumesCommands
  .command("load <filename> [volume]")
  .alias("l")
  .description("Load a Docker volume")
  .option("-f, --force", "Overwrite existing volume")
  .action(async (filename, volume, options) => {
    await ds.loadVolume(filename, volume, options.force);
  });

volumesCommands
  .command("save-all <volume-filter> [directory]")
  .alias("sa")
  .description("Save Docker volumes matching the filter")
  .option("-t, --timestamp", "Create a subdirectory with the current timestamp")
  .option("-f, --force", "Overwrite existing backup files")
  .action(async (filter, directory, options) => {
    directory = path.resolve(directory || ".", options.timestamp ? ds.createTimestamp() : undefined);
    fs.mkdirSync(directory, {recursive: true});
    await ds.saveVolumes(filter, directory, options.force);
  });

volumesCommands
  .command("load-all <files-filter>")
  .alias("la")
  .description("Load Docker volumes files matching the filter")
  .option("-f, --force", "Overwrite existing volumes")
  .action(async (files, options) => {
    await ds.loadVolumes(files, options.force);
  });

// --- Images --------------------------------------------------------------- //

const imagesCommands = program
  .command("image")
  .alias("i")
  .description("Images commands");

imagesCommands
  .command("list [filter]")
  .alias("ls")
  .description("List Docker images")
  .action(async filter => {
    (await ds.listImages(filter)).forEach(image => console.log(image.Repository));
  });

// --- Common --------------------------------------------------------------- //

program.addHelpText("beforeAll", chalk.white.bold([
  "",
  `Docker Snap v${pkg.version}, by ${pkg.author}`,
  "",
].join("\n")));

program.parse(process.argv);

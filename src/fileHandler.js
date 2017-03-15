const fs = require('fs');

// synchronous load images and scripts,
// assuming they are located in a single directory
const loadDirectoryIntoDictionary = (dic, extension) => {
  const fileNames = fs.readdirSync(`${__dirname}/../public/${extension}/`);
  const dictionary = dic;
  fileNames.forEach((name) => {
    // skip directories
    if (name.indexOf('.') < 0) return;
    // the files stored as a dictionary
    // dictionary { key: file name with slash, value: file contents }
    dictionary[`/${name}`] = fs.readFileSync(`${__dirname}/../public/${extension}/${name}`);
  });
};

// all scripts js contained in "scripts" directory
const gameScripts = {};
loadDirectoryIntoDictionary(gameScripts, 'scripts');

// all images png contained in "images"s directory
const gameImages = {};
loadDirectoryIntoDictionary(gameImages, 'images');

// const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const controllerPage = fs.readFileSync(`${__dirname}/../public/controller.html`);
const hostPage = fs.readFileSync(`${__dirname}/../public/game.html`);

const serveController = (response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(controllerPage);
  response.end();
};

const serveHost = (response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(hostPage);
  response.end();
};

const serveScript = (scriptName, response) => {
  // get already-loaded script
  const requestedScript = gameScripts[scriptName];
  // undefined error
  if (!requestedScript) {
    throw new Error(`file "${scriptName}" was not loaded`);
  }
  // write out
  response.writeHead(200, { 'Content-Type': 'script/javascript' });
  response.write(requestedScript);
  response.end();
};

// ONLY WORKS FOR PNG RIGHT NOW
const serveImage = (imgName, response) => {
  let imageName = imgName;
  // remove extension, just file name
  if (imageName.indexOf('/images/') > -1) {
    imageName = imageName.slice(imageName.indexOf('/images/') + 7, imageName.length);
  }

  // get already-loaded script
  const image = gameImages[imageName];
  // undefined error
  if (!image) {
    throw new Error(`file "${imageName}" was not loaded`);
  }
  // write out
  response.writeHead(200, { 'Content-Type': 'image/png' });
  response.write(image);
  response.end();
};

module.exports.serveController = serveController;
module.exports.serveHost = serveHost;
module.exports.serveScript = serveScript;
module.exports.serveImage = serveImage;

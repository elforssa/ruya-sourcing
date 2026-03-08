const sharp = require('sharp');

sharp('public/logo.png')
  .resize(320, null, { withoutEnlargement: true })
  .png({ quality: 80, compressionLevel: 9 })
  .toFile('public/logo-optimized.png')
  .then(() => console.log('Done'))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });

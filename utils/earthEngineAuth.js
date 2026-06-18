const ee = require('@google/earthengine');
const privateKey = require('../earth-engine-key.json');

function initializeEarthEngine() {
  return new Promise((resolve, reject) => {

    ee.data.authenticateViaPrivateKey(
      privateKey,

      () => {
        ee.initialize(
          null,
          null,

          () => {
            console.log(
              '✅ Earth Engine Initialized'
            );

            resolve(ee);
          },

          (err) => {
            reject(err);
          }
        );
      },

      (err) => {
        reject(err);
      }
    );
  });
}

module.exports = initializeEarthEngine;
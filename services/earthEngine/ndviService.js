const ee = require('@google/earthengine');

async function calculateNDVI(
  geometry
) {

  const image =
    ee.ImageCollection(
      'COPERNICUS/S2_SR_HARMONIZED'
    )
      .filterBounds(geometry)
      .filterDate(
        '2025-01-01',
        '2025-12-31'
      )
      .sort(
        'CLOUDY_PIXEL_PERCENTAGE'
      )
      .first();

  const ndvi =
  image
    .normalizedDifference(
      ['B8', 'B4']
    )
    .rename('NDVI');

  return ndvi;
}

module.exports = calculateNDVI;
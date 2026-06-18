const ee = require('@google/earthengine');

async function calculateNDWI(
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

  return image
    .normalizedDifference(
      ['B3', 'B8']
    )
    .rename('NDWI');
}

module.exports =
  calculateNDWI;
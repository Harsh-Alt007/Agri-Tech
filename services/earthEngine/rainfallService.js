const ee = require('@google/earthengine');

async function getRainfall(geometry) {

  const rainfall = ee.ImageCollection(
    'UCSB-CHG/CHIRPS/DAILY'
  )
  .filterDate(
    '2024-01-01',
    '2024-12-31'
  )
  .sum();

  return rainfall.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 30
  });
}

module.exports = getRainfall;
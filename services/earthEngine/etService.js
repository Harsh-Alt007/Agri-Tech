const ee = require('@google/earthengine');

async function getET(geometry) {

  const etImage = ee.ImageCollection(
    'ECMWF/ERA5_LAND/DAILY_AGGR'
  )
    .filterDate(
      '2024-01-01',
      '2024-12-31'
    )
    .select('potential_evaporation_sum')
    .sum();

  return etImage.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 30
  });
}

module.exports = getET;
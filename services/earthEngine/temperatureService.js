const ee = require('@google/earthengine');

async function getTemperature(geometry) {

  const temperature = ee.ImageCollection(
    'ECMWF/ERA5_LAND/DAILY_AGGR'
  )
    .filterDate(
      '2024-01-01',
      '2024-12-31'
    )
    .select('temperature_2m')
    .mean()
    .subtract(273.15);

  return temperature.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 30
  });
}

module.exports = getTemperature;
function predictYield({
  crop,
  ndvi,
  rainfall,
  temperature,
  healthScore
}) {

  let baseYield = 0;

  switch (crop) {

    case 'Rice':
      baseYield = 6;
      break;

    case 'Wheat':
      baseYield = 5;
      break;

    case 'Mustard':
      baseYield = 2;
      break;

    case 'Bajra':
      baseYield = 3;
      break;

    default:
      baseYield = 2;
  }

  const ndviFactor =
    ndvi / 0.7;

  const healthFactor =
    healthScore / 100;

  const estimatedYield =
    baseYield *
    ndviFactor *
    healthFactor;

  return {
    crop,
    estimatedYield:
      estimatedYield.toFixed(2),
    unit:
      'ton/hectare'
  };
}

module.exports =
predictYield;
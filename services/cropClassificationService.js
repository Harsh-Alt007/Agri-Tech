function classifyCrop({
  ndvi,
  rainfall,
  temperature
}) {

  if (
    ndvi > 0.65 &&
    rainfall > 700
  ) {
    return "Rice";
  }

  if (
    ndvi > 0.55 &&
    temperature < 30
  ) {
    return "Wheat";
  }

  if (
    ndvi > 0.45 &&
    temperature > 30
  ) {
    return "Bajra";
  }

  if (
    ndvi > 0.35 &&
    rainfall < 500
  ) {
    return "Mustard";
  }

  return "Unknown";
}

module.exports =
classifyCrop;
async function buildFarmAnalysis({
    crop,
    ndvi,
    ndwi,
    rainfall,
    temperature,
    healthScore,
    growthStage,
    diseaseRisk,
    irrigationRecommendation,
    yieldPrediction,
    revenuePrediction
}) {
    return {
        crop,
        ndvi,
        ndwi,
        rainfall,
        temperature,
        healthScore,
        growthStage,
        diseaseRisk,
        irrigationRecommendation,
        yieldPrediction,
        revenuePrediction,
        generatedAt: new Date().toISOString()
    };
}

module.exports = buildFarmAnalysis;

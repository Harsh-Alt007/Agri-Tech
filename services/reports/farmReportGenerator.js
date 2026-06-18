function generateFarmReport(data) {
    return {
        farmId: data.farmId,
        crop: data.crop,
        ndvi: data.ndvi,
        ndwi: data.ndwi,
        rainfall: data.rainfall,
        temperature: data.temperature,
        healthScore: data.healthScore,
        growthStage: data.growthStage,
        diseaseRisk: data.diseaseRisk,
        irrigation: data.irrigation || data.irrigationRecommendation,
        fertilizer: data.fertilizer,
        yieldPrediction: data.yieldPrediction,
        revenuePrediction: data.revenuePrediction,
        calculatedAreaHectare: data.calculatedAreaHectare,
        areaHectare: data.areaHectare,
        ndwiStress: data.ndwiStress,
        diseaseName: data.diseaseName,
        irrigationDetails: data.irrigationDetails,
        trends: data.trends,
        generatedAt: new Date().toISOString()
    };
}

module.exports = generateFarmReport;
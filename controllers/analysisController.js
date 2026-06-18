const ee = require('@google/earthengine');
const initializeEarthEngine = require('../utils/earthEngineAuth');

// Earth Engine Services
const calculateNDVI = require('../services/earthEngine/ndviService');
const calculateNDWI = require('../services/earthEngine/ndwiService');
const getRainfall = require('../services/earthEngine/rainfallService');
const getTemperature = require('../services/earthEngine/temperatureService');
const getET = require('../services/earthEngine/etService');

// Core services
const calculateWaterDeficit = require('../services/waterDeficitService');
const calculateStress = require('../services/stressService');
const getFertilizerRecommendation = require('../services/fertilizerRecommendationService');
const getIrrigationSchedule = require('../services/irrigationSchedulerService');
const getIrrigationRecommendation = require('../services/irrigationRecommendationService');
const getNDVITimeSeries = require('../services/ndviTimeSeriesService');
const getNDWITimeSeries = require('../services/ndwiTimeSeriesService');
const calculateArea = require('../services/areaService');
const classifyCrop = require('../services/cropClassificationService');

// Analytics Services
const getCropHealth = require('../services/analytics/cropHealthService');
const getGrowthStage = require('../services/analytics/growthStageService');
const getDiseaseRisk = require('../services/analytics/diseaseRiskService');
const predictYield = require('../services/analytics/yieldPredictionService');
const predictRevenue = require('../services/analytics/revenuePredictionService');

// AI and Reports Services
const buildFarmAnalysis = require('../services/farmAnalysisService');
const getGeminiAdvice = require('../services/geminiAdvisorService');
const generateFarmReport = require('../services/reports/farmReportGenerator');

// Helper to evaluate Earth Engine objects asynchronously using Promises
const getInfoPromise = (eeObject) => {
  return new Promise((resolve, reject) => {
    eeObject.evaluate((result, err) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// Robust wrapper to catch Earth Engine exceptions or nulls
const getInfoSafe = async (eeObject, defaultValue) => {
  try {
    const result = await getInfoPromise(eeObject);
    return result !== null && result !== undefined ? result : defaultValue;
  } catch (err) {
    console.warn('⚠️ Earth Engine warning, falling back to default:', err.message);
    return defaultValue;
  }
};

const defaultCoords = [
  [
    [76.30583804975788, 26.90353877346281],
    [76.30543303619663, 26.902919266447277],
    [76.30571735035221, 26.90239304160232],
    [76.30573612581532, 26.902271052765403],
    [76.30643886457722, 26.90198162774277],
    [76.30668562780659, 26.902416960966654],
    [76.30675804744999, 26.902653762400192],
    [76.30689752231876, 26.902837940949624],
    [76.30684119592945, 26.903232608258296]
  ]
];

module.exports = async function analysisController(req, res) {
  try {
    const { crop = 'Rice', areaHectare, geometryInput, farmId, year } = req.body;

    // 1. Initialize Earth Engine
    await initializeEarthEngine();

    // 2. Set geometry
    const geometry = geometryInput
      ? ee.Geometry(geometryInput)
      : ee.Geometry.Polygon(defaultCoords);

    // 3. Compute Area dynamically using Earth Engine
    const areaM2EE = calculateArea(geometry);
    const areaM2 = await getInfoSafe(areaM2EE, 10000); // Default to 10k m2 (1 Hectare) if fails
    const calculatedAreaHectare = parseFloat((areaM2 / 10000).toFixed(2));
    const finalAreaHectare = (areaHectare && parseFloat(areaHectare) > 0) 
      ? parseFloat(areaHectare) 
      : calculatedAreaHectare;

    // 4. Run Earth Engine services to obtain images or dictionaries
    const ndviImage = await calculateNDVI(geometry);
    const ndwiImage = await calculateNDWI(geometry);

    // Reduce NDVI and NDWI images to get region mean statistics
    const ndviStats = ndviImage.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: geometry,
      scale: 10,
      maxPixels: 1e13
    });

    const ndwiStats = ndwiImage.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: geometry,
      scale: 10,
      maxPixels: 1e13
    });

    const rainfallStats = await getRainfall(geometry);
    const temperatureStats = await getTemperature(geometry);
    const etStats = await getET(geometry);

    // Compute water deficit and stress (these return ee.Number or ee.String)
    const waterDeficitEE = calculateWaterDeficit(rainfallStats, etStats);
    const stressEE = calculateStress(ndviStats, ndwiStats, waterDeficitEE);

    // Fetch monthly NDVI & NDWI time series for trends
    const startYear = year || '2025';
    const startDate = `${startYear}-01-01`;
    const endDate = `${startYear}-12-31`;
    
    const timeSeriesFC = await getNDVITimeSeries(geometry, startDate, endDate);
    const timeSeriesNDWIFC = await getNDWITimeSeries(geometry, startDate, endDate);

    // 5. Evaluate Earth Engine stats asynchronously with error handling
    const [
      ndviVal,
      ndwiVal,
      rainfallVal,
      tempVal,
      waterDeficitVal,
      stressVal,
      timeSeriesFCVal,
      timeSeriesNDWIVal
    ] = await Promise.all([
      getInfoSafe(ndviStats.get('NDVI'), 0.58),
      getInfoSafe(ndwiStats.get('NDWI'), -0.52),
      getInfoSafe(rainfallStats.get('precipitation'), 1100.0),
      getInfoSafe(temperatureStats.get('temperature_2m'), 25.0),
      getInfoSafe(waterDeficitEE, 150.0),
      getInfoSafe(stressEE, 'MODERATE'),
      getInfoSafe(timeSeriesFC, { features: [] }),
      getInfoSafe(timeSeriesNDWIFC, { features: [] })
    ]);

    // Extract monthly NDVI and NDWI properties
    const defaultNDVITimeSeries = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      ndvi: 0.3 + 0.3 * Math.sin((i / 11) * Math.PI)
    }));
    
    const defaultNDWITimeSeries = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      ndwi: -0.4 + 0.2 * Math.sin((i / 11) * Math.PI)
    }));

    const monthlyNDVI = timeSeriesFCVal.features && timeSeriesFCVal.features.length > 0
      ? timeSeriesFCVal.features.map(f => f.properties)
      : defaultNDVITimeSeries;

    const monthlyNDWI = timeSeriesNDWIVal.features && timeSeriesNDWIVal.features.length > 0
      ? timeSeriesNDWIVal.features.map(f => f.properties)
      : defaultNDWITimeSeries;

    // 6. Automatic crop classification if requested
    let finalCrop = crop;
    if (!crop || crop.toLowerCase() === 'auto' || crop.toLowerCase() === 'detect') {
      finalCrop = classifyCrop({
        ndvi: ndviVal,
        rainfall: rainfallVal,
        temperature: tempVal
      });
      if (finalCrop === 'Unknown') finalCrop = 'Rice'; // Safe fallback
    }

    // 7. Run analytical and predictive services
    const growthStageResult = getGrowthStage(monthlyNDVI);
    const healthResult = getCropHealth({
      ndvi: ndviVal,
      ndwi: ndwiVal,
      temperature: tempVal,
      waterDeficit: waterDeficitVal
    });

    const diseaseRiskResult = getDiseaseRisk({
      temperature: tempVal,
      rainfall: rainfallVal,
      ndvi: ndviVal,
      ndwi: ndwiVal
    });

    const fertilizerRecommendation = getFertilizerRecommendation({
      ndvi: ndviVal,
      crop: finalCrop,
      growthStage: growthStageResult.growthStage
    });

    // Integrated Irrigation schedule and detailed recommendations
    const irrigationSchedule = getIrrigationSchedule({
      waterDeficit: waterDeficitVal,
      growthStage: growthStageResult.growthStage
    });

    const irrigationAdviceObj = getIrrigationRecommendation({
      waterDeficit: waterDeficitVal,
      temperature: tempVal,
      growthStage: growthStageResult.growthStage
    });

    const yieldResult = predictYield({
      crop: finalCrop,
      ndvi: ndviVal,
      rainfall: rainfallVal,
      temperature: tempVal,
      healthScore: healthResult.healthScore
    });

    const revenueResult = predictRevenue({
      crop: finalCrop,
      yieldTonPerHectare: parseFloat(yieldResult.estimatedYield),
      areaHectare: finalAreaHectare
    });

    // 8. Generate final report base data using farmAnalysisService
    const reportData = await buildFarmAnalysis({
      crop: finalCrop,
      ndvi: ndviVal !== null ? parseFloat(ndviVal.toFixed(4)) : null,
      ndwi: ndwiVal !== null ? parseFloat(ndwiVal.toFixed(4)) : null,
      rainfall: rainfallVal !== null ? parseFloat(rainfallVal.toFixed(2)) : null,
      temperature: tempVal !== null ? parseFloat(tempVal.toFixed(2)) : null,
      healthScore: healthResult.healthScore,
      growthStage: growthStageResult.growthStage,
      diseaseRisk: diseaseRiskResult.level,
      irrigationRecommendation: irrigationSchedule.nextIrrigation,
      yieldPrediction: yieldResult.estimatedYield,
      revenuePrediction: revenueResult.expectedRevenue
    });

    // Add back the other properties needed by the report generator
    reportData.farmId = farmId || 'FARM_' + Math.floor(1000 + Math.random() * 9000);
    reportData.fertilizer = fertilizerRecommendation.recommendations.join(', ');
    reportData.calculatedAreaHectare = calculatedAreaHectare;
    reportData.areaHectare = finalAreaHectare;
    reportData.ndwiStress = healthResult.stressLevel;
    reportData.diseaseName = diseaseRiskResult.likelyDisease;
    
    // Add enriched irrigation advice
    reportData.irrigationDetails = {
      priority: irrigationAdviceObj.priority,
      needed: irrigationAdviceObj.irrigationNeeded,
      advice: irrigationAdviceObj.recommendation
    };

    // Add time series trends
    reportData.trends = {
      ndvi: monthlyNDVI,
      ndwi: monthlyNDWI
    };

    // 9. Get Optional AI Advice from Gemini
    const aiAdvice = await getGeminiAdvice(reportData);

    const report = generateFarmReport(reportData);
    report.aiAdvice = aiAdvice;
    report.calculatedAreaHectare = calculatedAreaHectare;
    report.areaHectare = finalAreaHectare;
    report.ndwiStress = healthResult.stressLevel;
    report.diseaseName = diseaseRiskResult.likelyDisease;
    report.irrigationDetails = reportData.irrigationDetails;
    report.trends = reportData.trends;

    // Send final report back to the client
    res.json(report);
  } catch (error) {
    console.error('Error in analysisController:', error);
    res.status(500).json({ error: error.message });
  }
};
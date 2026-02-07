import api from './api';

const optimizeRoutes = async (cargoIds = [], mode = 'unlimited', date = null) => {
    const response = await api.post('/optimize', { cargoIds, mode, date });
    return response.data;
};

const analyzeAllScenarios = async (date = null) => {
    const response = await api.post('/analyze', { date });
    return response.data;
};

const optimizationService = {
    optimizeRoutes,
    analyzeAllScenarios,
};

export default optimizationService;

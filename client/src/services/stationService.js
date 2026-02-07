import api from './api';

const getStations = async () => {
    const response = await api.get('/stations');
    return response.data;
};

const addStation = async (station) => {
    const response = await api.post('/stations', station);
    return response.data;
};

const stationService = {
    getStations,
    addStation,
};

export default stationService;

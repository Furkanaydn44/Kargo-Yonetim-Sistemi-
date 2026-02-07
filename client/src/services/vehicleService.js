import api from './api';

const getVehicles = async () => {
    const response = await api.get('/vehicles');
    return response.data;
};

const addVehicle = async (vehicleData) => {
    const response = await api.post('/vehicles', vehicleData);
    return response.data;
};

const getVehicleRoutes = async (date) => {
    const response = await api.get(`/vehicles/routes?date=${date}`);
    return response.data;
};

const updateVehicleStatus = async (id, status) => {
    const response = await api.put(`/vehicles/${id}/status`, { status });
    return response.data;
};

const vehicleService = {
    getVehicles,
    addVehicle,
    getVehicleRoutes,
    updateVehicleStatus
};

export default vehicleService;

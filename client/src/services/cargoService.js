import api from './api';

const getAllCargos = async (date = null) => {
    const params = date ? { date } : {};
    const response = await api.get('/cargos', { params });
    return response.data;
};

const createCargo = async (cargoData) => {
    const response = await api.post('/cargos', cargoData);
    return response.data;
};

const bulkCreateCargos = async (cargos) => {
    const response = await api.post('/cargos/bulk', { cargos });
    return response.data;
};

const deleteAllCargos = async () => {
    const response = await api.delete('/cargos');
    return response.data;
};

const cargoService = {
    getAllCargos,
    createCargo,
    bulkCreateCargos,
    deleteAllCargos,
};

export default cargoService;

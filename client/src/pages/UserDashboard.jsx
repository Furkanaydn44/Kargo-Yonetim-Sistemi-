import { useState, useEffect } from 'react';
import stationService from '../services/stationService';
import cargoService from '../services/cargoService';
import { toast } from 'react-toastify';

const UserDashboard = () => {
    const [stations, setStations] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [formData, setFormData] = useState({
        station_id: '',
        weight_kg: '',
        request_date: ''
    });
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default today

    useEffect(() => {
        fetchStations();
        fetchCargos();
    }, [filterDate]); // Refetch when filter date changes

    const fetchStations = async () => {
        try {
            const data = await stationService.getStations();
            setStations(data);
        } catch (error) {
            toast.error('Failed to load stations');
        }
    };

    const fetchCargos = async () => {
        try {
            const data = await cargoService.getAllCargos(filterDate);
            setCargos(data);
        } catch (error) {
            toast.error('Failed to load cargo history');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await cargoService.createCargo(formData);
            toast.success(formData.count > 1 ? `${formData.count} cargos created!` : 'Cargo request created!');
            setFormData({ station_id: '', weight_kg: '', request_date: '', count: '' });
            fetchCargos(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create request');
        }
    };

    return (
        <div className="container">
            <h2>User Dashboard</h2>

            <div className="flex flex-col gap-4">
                {/* Request Form */}
                <div className="card glass">
                    <h3>New Cargo Request</h3>
                    <form onSubmit={handleSubmit}>
                        <label>Select Destination Station</label>
                        <select
                            value={formData.station_id}
                            onChange={(e) => setFormData({ ...formData, station_id: e.target.value })}
                            required
                        >
                            <option value="">-- Select Station --</option>
                            {stations.map(station => (
                                <option key={station.id} value={station.id}>
                                    {station.name}
                                </option>
                            ))}
                        </select>

                        <label>Weight (kg)</label>
                        <input
                            type="number"
                            placeholder="Weight"
                            value={formData.weight_kg}
                            onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                            required
                            min="1"
                        />

                        <label>Count (Optional)</label>
                        <input
                            type="number"
                            placeholder="Count (Default: 1)"
                            value={formData.count || ''}
                            onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                            min="1"
                        />

                        <label>Request Date</label>
                        <input
                            type="date"
                            value={formData.request_date}
                            onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                            required
                        />

                        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                            Submit Request
                        </button>
                    </form>
                </div>

                {/* Cargo History */}
                <div className="card glass">
                    <div className="flex justify-between items-center mb-4">
                        <h3>My Cargo History</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ margin: 0 }}>Filter Date:</label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{
                                    padding: '0.25rem',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--text)'
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem' }}>Date</th>
                                    <th style={{ padding: '0.5rem' }}>Details</th>
                                    <th style={{ padding: '0.5rem' }}>Station</th>
                                    <th style={{ padding: '0.5rem' }}>Weight</th>
                                    <th style={{ padding: '0.5rem' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargos.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No cargo requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    cargos.map(cargo => (
                                        <tr key={cargo.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.5rem' }}>{cargo.request_date}</td>
                                            <td style={{ padding: '0.5rem' }}>Request #{cargo.id}</td>
                                            <td style={{ padding: '0.5rem' }}>{cargo.Station ? cargo.Station.name : '-'}</td>
                                            <td style={{ padding: '0.5rem' }}>{cargo.weight_kg} kg</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.875rem',
                                                    background: cargo.status === 'pending' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                                    color: cargo.status === 'pending' ? '#fbbf24' : '#10b981'
                                                }}>
                                                    {cargo.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;

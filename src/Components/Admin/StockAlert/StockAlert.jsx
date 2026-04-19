import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Spinner from '../../Shared/Spinner';

const INITIAL_FORM = {
    name: '',
    unit: 'kg',
    currentStock: '',
    minStock: '',
    supplier: '',
};

const API_BASES = [
    'https://central-cafetaria-server.vercel.app',
    'http://localhost:5000',
];
const LOCAL_MATERIALS_KEY = 'inventoryRawMaterials';

const readLocalMaterials = () => {
    try {
        const stored = localStorage.getItem(LOCAL_MATERIALS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const writeLocalMaterials = (materials) => {
    localStorage.setItem(LOCAL_MATERIALS_KEY, JSON.stringify(materials));
};

const makeLocalMaterialId = () => {
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const requestWithFallback = async (path, options = {}) => {
    let lastError = null;

    for (const base of API_BASES) {
        try {
            const res = await fetch(`${base}${path}`, options);

            if (res.ok) {
                return await res.json();
            }

            // If endpoint does not exist on one backend, try next backend.
            if (res.status === 404) {
                continue;
            }

            let message = 'Request failed';
            try {
                const data = await res.json();
                message = data?.message || message;
            } catch {
                // Ignore parse errors and keep fallback message.
            }

            throw new Error(message);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Unable to reach API server');
};

const formatDate = (value) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString();
};

const StockAlert = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [pendingStocks, setPendingStocks] = useState({});
    const [formData, setFormData] = useState(INITIAL_FORM);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const data = await requestWithFallback('/raw-materials');
            setMaterials(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading raw materials:', error);
            const localMaterials = readLocalMaterials();
            setMaterials(localMaterials);
            if (localMaterials.length > 0) {
                toast.info('Loaded local inventory data (server unavailable).');
            } else {
                toast.error(error.message || 'Failed to load raw materials.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    useEffect(() => {
        const mappedStocks = {};
        materials.forEach((material) => {
            mappedStocks[material._id] = Number(material.currentStock || 0);
        });
        setPendingStocks(mappedStocks);
    }, [materials]);

    const handleStockInputChange = (materialId, value) => {
        setPendingStocks((prev) => ({
            ...prev,
            [materialId]: value
        }));
    };

    const handleUpdateStock = async (materialId) => {
        const nextStockValue = Number(pendingStocks[materialId]);

        if (Number.isNaN(nextStockValue) || nextStockValue < 0) {
            toast.error('Stock must be a non-negative number.');
            return;
        }

        try {
            await requestWithFallback(`/raw-materials/${materialId}/stock`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentStock: nextStockValue })
            });

            toast.success('Stock updated successfully.');
            fetchMaterials();
        } catch (error) {
            console.error('Error updating stock:', error);
            const localMaterials = readLocalMaterials();
            const updatedMaterials = localMaterials.map((item) => {
                if (item._id === materialId) {
                    return {
                        ...item,
                        currentStock: nextStockValue,
                        updatedAt: new Date().toISOString(),
                    };
                }
                return item;
            });
            writeLocalMaterials(updatedMaterials);
            setMaterials(updatedMaterials);
            toast.success('Stock updated locally (server unavailable).');
        }
    };

    const handleAddInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateMaterial = async (e) => {
        e.preventDefault();

        const payload = {
            name: formData.name.trim(),
            unit: formData.unit.trim(),
            supplier: formData.supplier.trim(),
            currentStock: Number(formData.currentStock),
            minStock: Number(formData.minStock),
        };

        if (!payload.name || !payload.unit || Number.isNaN(payload.currentStock) || Number.isNaN(payload.minStock)) {
            toast.error('Please fill all required fields with valid values.');
            return;
        }

        if (payload.currentStock < 0 || payload.minStock < 0) {
            toast.error('Stock values must be non-negative.');
            return;
        }

        try {
            await requestWithFallback('/raw-materials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            toast.success('Raw material added successfully.');
            setFormData(INITIAL_FORM);
            setIsAddModalOpen(false);
            fetchMaterials();
        } catch (error) {
            console.error('Error creating raw material:', error);
            const localMaterials = readLocalMaterials();
            const newMaterial = {
                _id: makeLocalMaterialId(),
                ...payload,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const nextMaterials = [newMaterial, ...localMaterials];
            writeLocalMaterials(nextMaterials);
            setMaterials(nextMaterials);
            setFormData(INITIAL_FORM);
            setIsAddModalOpen(false);
            toast.success('Raw material added locally (server unavailable).');
        }
    };

    const stockAlerts = useMemo(() => {
        return materials
            .map((material) => {
                const currentStock = Number(material.currentStock || 0);
                const minStock = Number(material.minStock || 0);
                const isOutOfStock = currentStock <= 0;
                const isLowStock = currentStock > 0 && currentStock <= minStock;

                return {
                    id: material?._id,
                    name: material?.name || 'Unnamed Material',
                    unit: material?.unit || 'unit',
                    supplier: material?.supplier || 'N/A',
                    currentStock,
                    minStock,
                    lastUpdated: material?.updatedAt || material?.createdAt,
                    alertType: isOutOfStock ? 'out' : (isLowStock ? 'low' : 'ok'),
                };
            })
            .sort((a, b) => {
                const severity = { out: 0, low: 1, ok: 2 };
                const aSeverity = severity[a.alertType] ?? 3;
                const bSeverity = severity[b.alertType] ?? 3;
                if (aSeverity !== bSeverity) return aSeverity - bSeverity;

                return a.currentStock - b.currentStock;
            });
    }, [materials]);

    const lowStockCount = stockAlerts.filter((item) => item.alertType === 'low' || item.alertType === 'out').length;

    return (
        <div className="container mx-auto px-4 py-8 text-black">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold">Inventory Management</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Handle raw materials with stock updates and low-stock alerts.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={fetchMaterials} className="btn bg-red-600 hover:bg-red-700 text-white">
                        Refresh
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="btn bg-emerald-600 hover:bg-emerald-700 text-white">
                        Add Raw Material
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner />
                </div>
            ) : (
                <div>
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 mb-6">
                        <h3 className="text-2xl font-bold text-red-900">Low Stock Alert</h3>
                        <p className="text-red-700 mt-1">
                            {lowStockCount} item{lowStockCount === 1 ? '' : 's'} are below threshold and need restocking
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {stockAlerts.map((item) => (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <h4 className="text-xl font-bold">{item.name}</h4>
                                        <p className="text-sm text-gray-500 mt-1">Last updated: {formatDate(item.lastUpdated)}</p>
                                    </div>
                                    {item.alertType === 'out' && (
                                        <span className="badge badge-error text-white">Out of Stock</span>
                                    )}
                                    {item.alertType === 'low' && (
                                        <span className="badge badge-warning text-black">Low Stock</span>
                                    )}
                                    {item.alertType === 'ok' && (
                                        <span className="badge badge-success text-white">Healthy</span>
                                    )}
                                </div>

                                <div className="mt-5 mb-4">
                                    <div className="text-4xl font-bold leading-none">{item.currentStock}</div>
                                    <div className="text-sm uppercase tracking-wide text-gray-600 mt-1">{item.unit}</div>
                                    <div className="text-sm text-gray-600 mt-2">Threshold: {item.minStock} {item.unit}</div>
                                    <div className="text-xs text-gray-500 mt-1">Supplier: {item.supplier}</div>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        min="0"
                                        value={pendingStocks[item.id] ?? 0}
                                        onChange={(e) => handleStockInputChange(item.id, e.target.value)}
                                        className="input input-bordered input-sm w-28"
                                    />
                                    <button
                                        className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                                        onClick={() => handleUpdateStock(item.id)}
                                    >
                                        Update Stock
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                        <h3 className="text-2xl font-bold mb-4">Add Raw Material</h3>
                        <form onSubmit={handleCreateMaterial} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input input-bordered w-full"
                                    value={formData.name}
                                    onChange={handleAddInputChange}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Unit</label>
                                    <input
                                        type="text"
                                        name="unit"
                                        className="input input-bordered w-full"
                                        value={formData.unit}
                                        onChange={handleAddInputChange}
                                        placeholder="kg, liter, pack"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Supplier</label>
                                    <input
                                        type="text"
                                        name="supplier"
                                        className="input input-bordered w-full"
                                        value={formData.supplier}
                                        onChange={handleAddInputChange}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Current Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="currentStock"
                                        className="input input-bordered w-full"
                                        value={formData.currentStock}
                                        onChange={handleAddInputChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Min Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="minStock"
                                        className="input input-bordered w-full"
                                        value={formData.minStock}
                                        onChange={handleAddInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" className="btn" onClick={() => setIsAddModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn bg-emerald-600 hover:bg-emerald-700 text-white">
                                    Add Material
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockAlert;

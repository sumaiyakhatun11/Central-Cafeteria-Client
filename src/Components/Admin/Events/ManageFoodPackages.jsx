import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Spinner from '../../Shared/Spinner';

const ManageFoodPackages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [packageData, setPackageData] = useState({ name: '', price: 0, items: [] });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/food-packages');
            const data = await res.json();
            if (res.ok) {
                setPackages(data);
            } else {
                throw new Error(data.message || 'Failed to fetch packages');
            }
        } catch (err) {
            toast.error(err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/food-packages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(packageData),
            });
            if (res.ok) {
                fetchPackages();
                setIsAddModalOpen(false);
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Failed to add package');
            }
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        const updatedPackage = {
            name: packageData.name,
            price: Number(packageData.price),
            items: packageData.items,
        };

        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/food-packages/${selectedPackage._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPackage),
            });
            if (res.ok) {
                fetchPackages();
                setIsEditModalOpen(false);
                setSelectedPackage(null);
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update package');
            }
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/food-packages/${selectedPackage._id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchPackages();
                setIsDeleteModalOpen(false);
                setSelectedPackage(null);
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete package');
            }
        } catch (err) {
            toast.error(err.message);
        }
    };

    const openEditModal = (pkg) => {
        setSelectedPackage(pkg);
        setPackageData(JSON.parse(JSON.stringify(pkg))); // Deep copy
        setIsEditModalOpen(true);
    };
    
    const openAddModal = () => {
        setPackageData({ name: '', price: 0, items: [{ name: '', quantity: 1 }] });
        setIsAddModalOpen(true);
    };

    const openDeleteModal = (pkg) => {
        setSelectedPackage(pkg);
        setIsDeleteModalOpen(true);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...packageData.items];
        newItems[index][field] = value;
        setPackageData(prev => ({ ...prev, items: newItems }));
    };
    
    const handleAddItem = () => {
        setPackageData(prev => ({
            ...prev,
            items: [...prev.items, { name: '', quantity: 1 }]
        }));
    };
    
    const handleDeleteItem = (index) => {
        const newItems = [...packageData.items];
        newItems.splice(index, 1);
        setPackageData(prev => ({ ...prev, items: newItems }));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-red-700">Manage Food Packages</h1>
                <button className="btn bg-red-600 px-5 hover:bg-red-700 text-white" onClick={openAddModal}>Add New Package</button>
            </div>

            {loading && <Spinner />}
            {error && <p className="text-center text-red-500">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map(pkg => (
                    <div key={pkg._id} className="card bg-base-100 shadow-xl border border-gray-200">
                        <div className="card-body">
                            <h2 className="card-title text-red-600">{pkg.name}</h2>
                            <p className="text-lg font-semibold text-gray-800 dark:text-white">Price: {pkg.price} tk</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Items: {pkg.items.length}</p>
                            <div className="card-actions justify-end mt-4">
                                <button className="btn btn-sm btn-warning bg-green-600 px-5 text-white" onClick={() => openEditModal(pkg)}>Edit</button>
                                <button className="btn btn-sm btn-error bg-red-600 px-5 text-white" onClick={() => openDeleteModal(pkg)}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                 <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-red-700">{isEditModalOpen ? 'Edit Food Package' : 'Add New Food Package'}</h3>
                        <form onSubmit={isEditModalOpen ? handleEdit : handleAdd}>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Name</span></label>
                                <input type="text" value={packageData.name} onChange={(e) => setPackageData({...packageData, name: e.target.value})} className="input input-bordered w-full" required />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Price</span></label>
                                <input type="number" value={packageData.price} onChange={(e) => setPackageData({...packageData, price: e.target.value})} className="input input-bordered w-full" required />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Items</span></label>
                                {packageData.items.map((item, index) => (
                                    <div key={index} className="flex text-gray-700 dark:text-white items-center gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Item Name"
                                            value={item.name}
                                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                            className="input input-bordered w-full"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                            className="input input-bordered w-24"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-sm  bg-red-600 text-white px-5"
                                            onClick={() => handleDeleteItem(index)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="btn btn-sm bg-blue-500 text-white px-5 mt-2"
                                    onClick={handleAddItem}
                                >
                                    Add Item
                                </button>
                            </div>
                            <div className="modal-action">
                                <button type="button" className="btn bg-red-600 px-5 text-white" onClick={() => { isEditModalOpen ? setIsEditModalOpen(false) : setIsAddModalOpen(false)}}>Cancel</button>
                                <button type="submit" className="btn bg-green-600 px-5 text-white">{isEditModalOpen ? 'Save Changes' : 'Add'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedPackage && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-red-700">Confirm Deletion</h3>
                        <p className="py-4">Are you sure you want to delete the package "<span className="font-semibold">{selectedPackage.name}</span>"?</p>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                            <button className="btn btn-error text-white" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageFoodPackages;

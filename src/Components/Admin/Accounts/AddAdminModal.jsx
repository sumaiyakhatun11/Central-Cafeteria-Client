import React, { useState } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Spinner from '../../Shared/Spinner';

const AddAdminModal = ({ isOpen, onClose, onAdminAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/admins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success('Admin created successfully!');
                onAdminAdded();
                onClose();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to create admin');
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            toast.error(error.message || 'Failed to create admin. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Add New Admin</h2>
                    <button onClick={onClose} className="btn bg-blue-400 text-white font-bold px-2"><FaArrowRight /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700">Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input input-bordered w-full" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input input-bordered w-full" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="input input-bordered w-full" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Address (Optional)</label>
                        <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="input input-bordered w-full" />
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="btn bg-blue-400 text-white font-bold px-5" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn bg-red-600 text-white font-bold px-5" disabled={loading}>
                            {loading ? <Spinner size="w-5 h-5" /> : 'Add Admin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAdminModal;

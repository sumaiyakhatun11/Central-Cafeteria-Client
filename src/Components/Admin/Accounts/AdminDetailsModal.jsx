import React, { useState, useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../../Authentication/AuthProvider';
import Spinner from '../../Shared/Spinner';

const AdminDetailsModal = ({ isOpen, onClose, admin, onSuperAdminToggle, currentLoggedInUser, onAdminUpdated }) => {
    const { user, updateUser } = useAuth();
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        profilePicture: ''
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (admin) {
            setFormData({
                name: admin.name || '',
                email: admin.email || '',
                address: admin.address || '',
                profilePicture: admin.profilePicture || ''
            });
            // Reset edit mode when admin changes
            setIsEditMode(false); 
        }
    }, [admin]);

    if (!isOpen || !admin) return null;

    const handleSuperAdminToggleClick = async () => {
        await onSuperAdminToggle();
        toast.success('Super admin status updated!');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageClick = () => {
        if (isEditMode) {
            fileInputRef.current.click();
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);

        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=2756beed15509d2f2a291d0710e71fab`, {
                method: 'POST',
                body: uploadFormData
            });

            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, profilePicture: data.data.url }));
                toast.success('Profile picture updated! Click Save to apply changes.');
            } else {
                throw new Error(data.error.message);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/users/${admin._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success('Admin details updated successfully!');
                const updatedAdmin = { ...admin, ...formData };
                if (user._id === admin._id) {
                    updateUser(updatedAdmin);
                }
                onAdminUpdated();
                setIsEditMode(false);
                onClose();
            } else {
                throw new Error('Failed to update admin details');
            }
        } catch (error) {
            console.error('Error updating admin details:', error);
            toast.error('Failed to update admin details. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
            setLoading(true);
            try {
                const res = await fetch(`https://central-cafetaria-server.vercel.app/users/${admin._id}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    toast.success('Admin deleted successfully!');
                    onAdminUpdated();
                    onClose();
                } else {
                    throw new Error('Failed to delete admin');
                }
            } catch (error) {
                console.error('Error deleting admin:', error);
                toast.error('Failed to delete admin. Please try again later.');
            } finally {
                setLoading(false);
            }
        }
    };

    const ProfilePicture = ({ src, alt, isEditable }) => (
        <div className="relative group">
            <img
                src={src || 'https://i.ibb.co/tqQh23J/user.png'}
                alt={alt}
                className={`w-32 h-32 rounded-full object-cover border-4 border-gray-200 ${isEditable ? 'cursor-pointer' : ''} transition-all duration-300 group-hover:opacity-80`}
                onClick={handleImageClick}
            />
            {isEditable && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm font-semibold">Change</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">{isEditMode ? 'Edit Admin Profile' : 'Admin Details'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
                        <FaTimes size={24} />
                    </button>
                </div>

                {isEditMode ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-center">
                            <ProfilePicture src={formData.profilePicture} alt="Profile" isEditable={true} />
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input input-bordered w-full" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input input-bordered w-full" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="input input-bordered w-full" />
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <button type="button" onClick={() => setIsEditMode(false)} className="btn btn-ghost" disabled={loading}>Cancel</button>
                            <button type="submit" className="btn btn-primary bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
                                {loading ? <Spinner size="w-5 h-5" /> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center text-center">
                            <ProfilePicture src={admin.profilePicture} alt={admin.name} isEditable={false} />
                            <h3 className="text-2xl font-bold mt-4 text-gray-800">{admin.name}</h3>
                            <p className="text-gray-500">{admin.email}</p>
                            {admin.address && <p className="text-gray-500 mt-1">{admin.address}</p>}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <p className="font-semibold text-gray-700">Status: <span className={`font-bold ${admin.isSuperAdmin ? 'text-red-600' : 'text-green-600'}`}>{admin.isSuperAdmin ? 'Super Admin' : 'Admin'}</span></p>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            {currentLoggedInUser?._id === admin._id && (
                                <button onClick={() => setIsEditMode(true)} className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white">
                                    Edit My Details
                                </button>
                            )}
                            {currentLoggedInUser?.isSuperAdmin && currentLoggedInUser._id !== admin._id && (
                                <button onClick={handleDelete} className="btn btn-error bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                                    {loading ? <Spinner size="w-5 h-5" /> : 'Delete This Admin'}
                                </button>
                            )}
                            {currentLoggedInUser?.isSuperAdmin && !(currentLoggedInUser._id === admin._id) && (
                                <button
                                    onClick={handleSuperAdminToggleClick}
                                    className={`btn ${admin.isSuperAdmin ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-teal-500 hover:bg-teal-600'} text-white`}
                                    disabled={loading}
                                >
                                    {loading ? <Spinner size="w-5 h-5" /> : (admin.isSuperAdmin ? 'Demote to Admin' : 'Promote to Super Admin')}
                                </button>
                            )}
                            <button onClick={onClose} className="btn btn-ghost">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDetailsModal;

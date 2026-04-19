import React, { useState } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Spinner from '../../Shared/Spinner';

const UserDetailsModal = ({ isOpen, onClose, user, onVerify, onPrivilegeToggle, onDelete }) => {
    const [loading, setLoading] = useState(false);
    if (!isOpen || !user) return null;

    const handleVerifyClick = async () => {
        setLoading(true);
        await onVerify();
        toast.success('User verified successfully!');
        setLoading(false);
    };

    const handlePrivilegeToggleClick = async () => {
        setLoading(true);
        await onPrivilegeToggle();
        toast.success('User privilege updated!');
        setLoading(false);
    };

    const handleDeleteClick = async () => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            setLoading(true);
            await onDelete();
            toast.success('User deleted successfully!');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl text-black font-bold">{user.name} ({user.id})</h2>
                    <button onClick={onClose} className="btn bg-blue-400 text-white font-bold px-2"><FaArrowRight /></button>
                </div>

                <div className=" text-black mb-4 grid grid-cols-2 gap-x-4">
                    <div>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Registration No:</strong> {user.registrationNumber}</p>
                        <p><strong>Verified:</strong> {user.verified ? 'Yes ✅' : 'No ❌'}</p>
                    </div> 
                    <div>
                        <p><strong>Privileged:</strong> {user.privileged ? 'Yes' : 'No'}</p>
                        {user.qrCodeString && <p><strong>QR Code String:</strong> {user.qrCodeString}</p>}
                    </div>
                </div>

                {(user.idCardFrontUrl || user.idCardBackUrl) && (
                    <div className="mb-4 text-black grid grid-cols-2 gap-4">
                        {user.idCardFrontUrl && (
                            <div>
                                <p className="font-bold">ID Card (Front):</p>
                                <img src={user.idCardFrontUrl} alt="ID Card Front" className="w-full h-auto object-cover rounded-lg" />
                            </div>
                        )}
                        {user.idCardBackUrl && (
                            <div>
                                <p className="font-bold">ID Card (Back):</p>
                                <img src={user.idCardBackUrl} alt="ID Card Back" className="w-full h-auto object-cover rounded-lg" />
                            </div>
                        )}
                    </div>
                )}


                <div className="flex flex-col gap-3 mt-6">
                    {!user.verified && (
                        <button
                            onClick={handleVerifyClick}
                            className="btn bg-green-600 text-white font-bold px-5 py-2 rounded"
                            disabled={loading}
                        >
                            {loading ? <Spinner size="w-5 h-5" /> : 'Verify User'}
                        </button>
                    )}
                    {user.verified && (
                        <button
                            onClick={handlePrivilegeToggleClick}
                            className={`btn ${user.privileged ? 'bg-red-600' : 'bg-green-600'} text-white font-bold px-5 py-2 rounded`}
                            disabled={loading}
                        >
                            {loading ? <Spinner size="w-5 h-5" /> : (user.privileged ? 'Revoke Privilege' : 'Grant Privilege')}
                        </button>
                    )}
                    <button
                        onClick={handleDeleteClick}
                        className="btn bg-red-600 text-white font-bold px-5 py-2 rounded"
                        disabled={loading}
                    >
                        {loading ? <Spinner size="w-5 h-5" /> : 'Delete User'}
                    </button>
                    <button
                        onClick={onClose}
                        className="btn bg-blue-400 text-white font-bold px-5 py-2 rounded"
                        disabled={loading}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;

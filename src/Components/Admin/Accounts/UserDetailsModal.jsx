import React, { useState } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Spinner from '../../Shared/Spinner';

const UserDetailsModal = ({ isOpen, onClose, user, onVerify, onUnverify, onPrivilegeToggle, onDelete }) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen || !user) return null;

    const handleVerifyClick = async () => {
        setLoading(true);
        await onVerify();
        toast.success('User verified successfully!');
        setLoading(false);
    };

    const handleUnverifyClick = async () => {
        setLoading(true);
        await onUnverify();
        toast.success('User marked as not verified!');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 sm:px-6">
            <div className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="text-2xl font-bold text-black">{user.name} ({user.id})</h2>
                        <p className="mt-1 text-sm text-gray-500">Account details and verification controls</p>
                    </div>
                    <button onClick={onClose} className="btn btn-sm bg-blue-400 text-white font-bold px-3 hover:bg-blue-500">
                        <FaArrowRight />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                    <div className="text-black mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Registration No:</strong> {user.registrationNumber || 'N/A'}</p>
                            <p><strong>Verified:</strong> {user.verified ? 'Yes ✅' : 'No ❌'}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                            <p><strong>Privileged:</strong> {user.privileged ? 'Yes' : 'No'}</p>
                            {user.qrCodeString && <p className="break-all"><strong>QR Code String:</strong> {user.qrCodeString}</p>}
                        </div>
                    </div>

                    {(user.idCardFrontUrl || user.idCardBackUrl) && (
                        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {user.idCardFrontUrl && (
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="mb-2 font-bold text-black">ID Card (Front)</p>
                                    <img src={user.idCardFrontUrl} alt="ID Card Front" className="h-56 w-full rounded-lg object-cover" />
                                </div>
                            )}
                            {user.idCardBackUrl && (
                                <div className="rounded-xl border border-gray-200 p-3">
                                    <p className="mb-2 font-bold text-black">ID Card (Back)</p>
                                    <img src={user.idCardBackUrl} alt="ID Card Back" className="h-56 w-full rounded-lg object-cover" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        <button
                            onClick={handleVerifyClick}
                            className="btn bg-green-600 text-white font-bold px-5 py-2 rounded"
                            disabled={loading}
                        >
                            {loading ? <Spinner size="w-5 h-5" /> : 'Verify User'}
                        </button>
                        <button
                            onClick={handleUnverifyClick}
                            className="btn bg-yellow-600 text-white font-bold px-5 py-2 rounded"
                            disabled={loading}
                        >
                            {loading ? <Spinner size="w-5 h-5" /> : 'Mark as Not Verified'}
                        </button>
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
                            className="btn bg-blue-400 text-white font-bold px-5 py-2 rounded sm:col-span-2"
                            disabled={loading}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;

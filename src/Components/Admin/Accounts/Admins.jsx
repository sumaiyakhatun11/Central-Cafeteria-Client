import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../Authentication/AuthProvider';
import AddAdminModal from './AddAdminModal';
import AdminDetailsModal from './AdminDetailsModal';

const Admins = () => {
    const { user } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const fetchAdmins = async () => {
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/users');
            const data = await res.json();
            if (res.ok) {
                setAdmins(data.data.filter(user => user.isadmin));
            } else {
                toast.error('Failed to fetch admins.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error fetching admins.');
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleSuperAdminToggle = async () => {
        const newStatus = !selectedAdmin.isSuperAdmin;

        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/users/${selectedAdmin._id}/superadmin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isSuperAdmin: newStatus })
            });

            if (res.ok) {
                toast.success(`Super admin status updated!`);
                fetchAdmins(); // Re-fetch to update UI
                setIsDetailsModalOpen(false); // Close modal after action
            } else {
                toast.error('Failed to update super admin status.');
            }
        } catch (err) {
            console.error('Super admin status update failed:', err);
            toast.error('Super admin status update failed.');
        }
    };

    const sortedAdmins = [...admins].sort((a, b) => {
        if (user && a._id === user._id) return -1;
        if (user && b._id === user._id) return 1;
        return 0;
    });

    return (
        <div className="p-6">
            {user && user.isSuperAdmin && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn bg-red-600 text-white font-bold px-5"
                    >
                        Add Admin
                    </button>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead className="bg-red-600 text-white">
                        <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAdmins.map(admin => (
                            <tr key={admin._id} className="border-t text-black hover:bg-gray-100">
                                <td className="px-4 py-2">{admin.name}</td>
                                <td className="px-4 py-2">{admin.email}</td>
                                <td className="px-4 py-2">{admin.isSuperAdmin ? 'Super Admin' : 'Admin'}</td>
                                <td className="px-4 py-2">
                                    <button 
                                        onClick={() => {
                                            setSelectedAdmin(admin);
                                            setIsDetailsModalOpen(true);
                                        }}
                                        className="text-xl font-bold"
                                    >
                                        ⋮
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddAdminModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdminAdded={() => {
                    fetchAdmins();
                    setIsAddModalOpen(false);
                }}
            />

            {selectedAdmin && (
                <AdminDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    admin={selectedAdmin}
                    onSuperAdminToggle={handleSuperAdminToggle}
                    currentLoggedInUser={user}
                    onAdminUpdated={fetchAdmins}
                />
            )}
        </div>
    );
};

export default Admins;

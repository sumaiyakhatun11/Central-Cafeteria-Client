import React, { useEffect, useState } from 'react';
import UserDetailsModal from './UserDetailsModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from '../../Shared/Spinner';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [filterType, setFilterType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);



    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/users');
            const data = await res.json();
            if (res.ok) {
                setUsers(data.data.filter(user => !user.isadmin));
            } else {
                toast.error('Failed to fetch users.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error fetching users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleVerify = async () => {
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/users/${selectedUser._id}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified: true })
            });

            if (res.ok) {
                toast.success('User verified successfully!');
                fetchUsers(); // Re-fetch to update UI
                setModalOpen(false); // Close modal after action
            } else {
                toast.error('Verification failed.');
            }
        } catch (err) {
            console.error('Verification failed:', err);
            toast.error('Verification failed.');
        }
    };

    const handlePrivilegeToggle = async () => {
        const newStatus = !selectedUser.privileged;

        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/users/${selectedUser._id}/privileged`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ privileged: newStatus })
            });

            if (res.ok) {
                toast.success(`User privilege ${newStatus ? 'granted' : 'revoked'}!`);
                fetchUsers(); // Re-fetch to update UI
                setModalOpen(false); // Close modal after action
            } else {
                toast.error('Privilege update failed.');
            }
        } catch (err) {
            console.error('Privilege update failed:', err);
            toast.error('Privilege update failed.');
        }
    };
    const handleDeleteUser = async () => {
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/users/${selectedUser._id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('User deleted successfully!');
                fetchUsers(); // Re-fetch to update UI
                setModalOpen(false); // Close modal after action
            } else {
                toast.error('Failed to delete user.');
            }
        } catch (err) {
            console.error('Delete request failed:', err);
            toast.error('Delete request failed.');
        }
    };


    const filteredUsers = users.filter(user => {
        const matchesSearch = user.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
            !filterType || (user.type && user.type.toLowerCase() === filterType);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-6">
            {/* Filter Bar */}
            <div className="flex gap-4 mb-6">
                {/* <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border rounded"
                >
                    <option value="">All Users</option>
                    <option value="students">Students</option>
                    <option value="teachers">Teachers</option>
                    <option value="staffs">Staffs</option>
                    <option value="privileged">Privileged</option>
                </select> */}
                <input
                    type="text"
                    placeholder="Search by ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border rounded lg:w-1/3 w-full"
                />
            </div>

            {/* User Table */}
            {loading ? (
                <div className="flex justify-center items-center h-64"><Spinner /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead className="bg-red-600 text-white">
                            <tr>
                                <th className="px-4 py-2 text-left">ID</th>
                                <th className="px-4 py-2 text-left">Email</th>
                                <th className="px-4 py-2 text-left">Verified</th>
                                <th className="px-4 py-2 text-left">Coins</th>
                                <th className="px-4 py-2 text-left">Privileged</th>
                                <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user._id} className="border-t text-black hover:bg-gray-100">
                                    <td className="px-4 py-2">{user.id}</td>
                                    <td className="px-4 py-2">{user.email}</td>
                                    <td className="px-4 py-2">{user.verified ? '✅' : '❌'}</td>
                                    <td className="px-4 py-2">{user.coins || 0}</td>
                                    <td className="px-4 py-2">{user.privileged ? 'Yes' : 'No'}</td>
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setModalOpen(true);
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
            )}

            {selectedUser && (
                <UserDetailsModal 
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    user={selectedUser}
                    onVerify={handleVerify}
                    onPrivilegeToggle={handlePrivilegeToggle}
                    onDelete={handleDeleteUser}
                />
            )}
            
        </div>
    );
};

export default Users;

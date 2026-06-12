import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../Shared/Button';
import AddCoinModal from '../Shared/AddCoinModal';
import { useAuth } from './AuthProvider';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://central-cafetaria-server-tau.vercel.app';

const Profile = () => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        profilePicture: '',
        role: '',
        userId: '',
        coins: 0,
        verified: false,
        createdAt: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                profilePicture: user.profilePicture || '',
                role: user.role || '',
                userId: user.userId || user.id || '',
                coins: user.coins || 0,
                verified: user.verified || false,
                createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : ''
            });
        }
    }, [user, isAuthenticated, navigate]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('image', file);

        try {
            const response = await fetch('https://api.imgbb.com/1/upload?key=2756beed15509d2f2a291d0710e71fab', {
                method: 'POST',
                body: uploadFormData
            });
            const data = await response.json();

            if (data.success) {
                setFormData((prev) => ({ ...prev, profilePicture: data.data.url }));
                toast.success('Profile picture uploaded successfully');
            } else {
                throw new Error(data.error?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error('Unable to upload profile picture. Please try again.');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user) return;

        const updateFields = {};
        if (formData.name) updateFields.name = formData.name;
        if (formData.email) updateFields.email = formData.email;
        if (formData.phone) updateFields.phone = formData.phone;
        if (formData.address) updateFields.address = formData.address;
        if (formData.profilePicture) updateFields.profilePicture = formData.profilePicture;

        setIsSaving(true);

        try {
            const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateFields)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Unable to update profile');
            }

            updateUser({ ...user, ...updateFields });
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error(error.message || 'Profile update failed');
        } finally {
            setIsSaving(false);
        }
    };

    const openCoinModal = () => setIsCoinModalOpen(true);
    const closeCoinModal = () => setIsCoinModalOpen(false);
    const scrollToEditSection = () => {
        const editSection = document.getElementById('edit');
        if (editSection) {
            editSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-8 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="h-64 bg-gradient-to-r from-red-500 via-pink-500 to-orange-400 p-8 text-white flex flex-col justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-white/20 shadow-lg overflow-hidden">
                            {formData.profilePicture ? (
                                <img src={formData.profilePicture} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-white/20 text-4xl">👤</div>
                            )}
                        </div>
                        <div>
                            <p className="text-lg uppercase tracking-[0.2em] opacity-90">Profile</p>
                            <h1 className="text-4xl font-extrabold leading-tight">{formData.name || 'Unknown User'}</h1>
                            <p className="mt-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold inline-block">{formData.role ? formData.role.charAt(0).toUpperCase() + formData.role.slice(1) : 'Student'}</p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <div className="rounded-3xl bg-white/15 p-5 backdrop-blur-sm">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/80">Email Address</p>
                            <p className="mt-2 text-lg font-semibold">{formData.email || 'Not provided'}</p>
                        </div>
                        <div className="rounded-3xl bg-white/15 p-5 backdrop-blur-sm">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/80">ID / Username</p>
                            <p className="mt-2 text-lg font-semibold">{formData.userId || 'Not provided'}</p>
                        </div>
                        <div className="rounded-3xl bg-white/15 p-5 backdrop-blur-sm">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/80">Coin Balance</p>
                            <p className="mt-2 text-lg font-semibold">{formData.coins} 🪙</p>
                        </div>
</div>
                </div>

                <div className="bg-white p-8 lg:grid lg:grid-cols-[0.9fr_0.7fr] lg:gap-8">
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Profile Overview</h2>
                                    <p className="mt-1 text-sm text-gray-500">Manage your personal details and account status.</p>
                                </div>
                                <span className={`inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold ${formData.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {formData.verified ? '✓ Verified Account' : 'Pending Verification'}
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-3xl border border-gray-200 p-6 shadow-sm bg-gray-50">
                                <p className="text-sm text-gray-500">Email Address</p>
                                <p className="mt-2 text-lg font-semibold text-gray-900">{formData.email || 'Not provided'}</p>
                            </div>
                            <div className="rounded-3xl border border-gray-200 p-6 shadow-sm bg-gray-50">
                                <p className="text-sm text-gray-500">ID / Username</p>
                                <p className="mt-2 text-lg font-semibold text-gray-900">{formData.userId || 'Not provided'}</p>
                            </div>
                            <div className="rounded-3xl border border-gray-200 p-6 shadow-sm bg-gray-50">
                                <p className="text-sm text-gray-500">Coin Balance</p>
                                <p className="mt-2 text-lg font-semibold text-gray-900">{formData.coins} 🪙</p>
                            </div>
                            </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button type="button" onClick={scrollToEditSection} variant="primary" className="w-full sm:w-auto">📝 Edit Profile</Button>
                            <Button type="button" onClick={openCoinModal} variant="outline" className="w-full sm:w-auto">Request Coin</Button>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">🛡️ Account Privileges</h3>
                            <ul className="space-y-3 text-gray-700">
                                <li>• Standard food ordering active.</li>
                                <li>• Live order tracking via SSE.</li>
                                <li>• Cafeteria booking eligible.</li>
                            </ul>
                        </div>
                        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">🛠️ Quick Navigation</h3>
                            <div className="grid gap-3">
                                <Button type="button" onClick={() => navigate('/')} variant="ghost">🛒 My Cart</Button>
                                <Button type="button" onClick={() => navigate('/')} variant="ghost">🕒 History</Button>
                                <Button type="button" onClick={() => navigate('/events')} variant="ghost">🎪 Events</Button>
                                {formData.role === 'admin' && <Button type="button" onClick={() => navigate('/admin')} variant="ghost">📊 Admin</Button>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="edit" className="rounded-3xl border border-red-200 bg-white p-8 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Edit Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                        <input
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none"
                            placeholder="Full name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none"
                            placeholder="Email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                        <input
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none"
                            placeholder="01XXXXXXXXX"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">User ID</label>
                        <input
                            name="userId"
                            type="text"
                            value={formData.userId}
                            disabled
                            className="w-full rounded-2xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-700"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">User Type</label>
                        <input
                            name="role"
                            type="text"
                            value={formData.role}
                            disabled
                            className="w-full rounded-2xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-700"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                        <input
                            name="address"
                            type="text"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none"
                            placeholder="Campus address or dorm room"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Picture URL</label>
                        <input
                            name="profilePicture"
                            type="text"
                            value={formData.profilePicture}
                            onChange={handleInputChange}
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none"
                            placeholder="Paste image URL or upload a file"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Profile Picture</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button type="submit" disabled={isSaving} variant="primary" size="lg" className="w-full sm:w-auto">
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </Button>
                        <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/')}>Return Home</Button>
                    </div>
                </form>

                <div className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-lg">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-red-700">Profile preview</h2>
                        <p className="text-gray-600">Your saved values are shown here for a quick check before you save.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <p className="text-sm font-semibold text-gray-500">Name</p>
                            <p className="text-lg font-bold text-gray-900">{formData.name || 'Not provided'}</p>
                        </div>
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <p className="text-sm font-semibold text-gray-500">Email</p>
                            <p className="text-lg font-bold text-gray-900">{formData.email || 'Not provided'}</p>
                        </div>
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <p className="text-sm font-semibold text-gray-500">Contact Number</p>
                            <p className="text-lg font-bold text-gray-900">{formData.phone || 'Not provided'}</p>
                        </div>
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <p className="text-sm font-semibold text-gray-500">User Type</p>
                            <p className="text-lg font-bold text-gray-900">{formData.role || 'Not provided'}</p>
                        </div>
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <p className="text-sm font-semibold text-gray-500">Address</p>
                            <p className="text-lg font-bold text-gray-900">{formData.address || 'Not provided'}</p>
                        </div>
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <p className="text-sm font-semibold text-gray-500">User ID</p>
                            <p className="text-lg font-bold text-gray-900">{formData.userId || 'Not provided'}</p>
                        </div>
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                            <p className="text-sm font-semibold text-gray-500 mb-3">Profile Picture</p>
                            {formData.profilePicture ? (
                                <img src={formData.profilePicture} alt="Profile preview" className="w-full rounded-3xl object-cover border border-gray-200" />
                            ) : (
                                <div className="h-48 rounded-3xl border border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-gray-500">
                                    No profile picture set
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <AddCoinModal isOpen={isCoinModalOpen} onClose={closeCoinModal} />
        </div>
    );
};

export default Profile;

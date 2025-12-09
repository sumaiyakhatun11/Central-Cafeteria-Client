import React, { useState, useEffect } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../Authentication/AuthProvider';

const AddCoinModal = ({ isOpen, onClose }) => {
    const { user, updateUser } = useAuth();
    const [view, setView] = useState('getCoins'); // 'getCoins' or 'coinHistory'
    const [formData, setFormData] = useState({ amount: '', receiptImageUrl: '' });
    const [coinHistory, setCoinHistory] = useState([]);
    const [coinValue, setCoinValue] = useState(5); // Default value
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

    useEffect(() => {
        const fetchCoinValue = async () => {
            try {
                const res = await fetch('https://central-cafetaria-server.vercel.app/coin-value');
                const data = await res.json();
                if (res.ok) {
                    setCoinValue(data.value);
                    setLastUpdatedAt(data.lastUpdatedAt);
                }
            } catch (error) {
                console.error('Error fetching coin value:', error);
            }
        };

        let interval;
        if (isOpen) {
            fetchCoinValue(); // Fetch immediately on open
            interval = setInterval(fetchCoinValue, 3000); // Then fetch every 3 seconds
        }

        if (view === 'coinHistory' && user) {
            const fetchCoinHistory = async () => {
                try {
                    const res = await fetch(`https://central-cafetaria-server.vercel.app/users/${user.id}/coin-requests`);
                    const data = await res.json();
                    if (res.ok) {
                        setCoinHistory(data.coinRequests || []);
                    } else {
                        toast.error('Failed to fetch coin history.');
                    }
                } catch (error) {
                    console.error('Error fetching coin history:', error);
                    toast.error('Failed to fetch coin history.');
                }
            };
            fetchCoinHistory();
        }

        return () => {
            if (interval) {
                clearInterval(interval); // Cleanup interval on close
            }
        };
    }, [view, user, isOpen]);

    const resetForm = () => {
        setFormData({ amount: '', receiptImageUrl: '' });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('image', file);

        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=2756beed15509d2f2a291d0710e71fab`, {
                method: 'POST',
                body: uploadFormData
            });

            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, receiptImageUrl: data.data.url }));
            } else {
                throw new Error(data.error.message);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image. Please try again later.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/users/${user.id}/coin-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success('Coin request submitted successfully!');
                const newRequest = { ...formData, status: 'pending', requestedAt: new Date() };
                const updatedUser = { ...user, coinIncreaseRequests: [...(user.coinIncreaseRequests || []), newRequest] };
                updateUser(updatedUser);
                handleClose();
            } else {
                throw new Error('Failed to submit coin request');
            }
        } catch (error) {
            console.error('Error submitting coin request:', error);
            toast.error('Failed to submit coin request. Please try again later.');
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg max-h-screen overflow-y-scroll w-full max-w-4xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Add Coins</h2>
                    <button onClick={handleClose} className="btn bg-blue-400 text-white font-bold px-2"><FaArrowRight /></button>
                </div>
                
                <div className="flex justify-center gap-4 mb-6">
                    <button onClick={() => setView('getCoins')} className={`btn ${view === 'getCoins' ? 'bg-red-600 text-white' : ''}`}>Get Coins</button>
                    <button onClick={() => setView('coinHistory')} className={`btn ${view === 'coinHistory' ? 'bg-red-600 text-white' : ''}`}>Coin History</button>
                </div>

                {view === 'getCoins' ? (
                    <div className="bg-red-50 p-8 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Instructions Column */}
                            <div className="bg-yellow-100 p-6 rounded-lg shadow-md">
                                <h3 className="text-2xl font-bold text-red-700 mb-4">How to Get Coins</h3>
                                <ul className="space-y-4 text-gray-700">
                                    <li className="flex items-start">
                                        <span className="text-red-500 font-bold mr-2">✔</span>
                                        <span><strong>1 Coin = {coinValue}tk</strong>. Calculate your deposit accordingly.</span>
                                    </li>
                                    {lastUpdatedAt && (
                                        <li className="flex items-start text-sm text-gray-500">
                                            <span className="text-red-500 font-bold mr-2">✔</span>
                                            <span>Last updated: {new Date(lastUpdatedAt).toLocaleString()}</span>
                                        </li>
                                    )}
                                    <li className="flex items-start">
                                        <span className="text-red-500 font-bold mr-2">✔</span>
                                        <span>Deposit money to the following bank account: <strong className="text-red-800">(demo bank account)</strong>.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-red-500 font-bold mr-2">✔</span>
                                        <span>Submit a clear screenshot or photo of the transaction receipt.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Form Column */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 font-bold mb-2">Amount of Coins</label>
                                        <div className="grid grid-cols-2 items-center">
                                            <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="input input-bordered w-full" required />
                                            {formData.amount && <span className="ml-4 text-lg font-bold text-gray-700">= {formData.amount * coinValue} tk <br /> to be paid</span>}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 font-bold mb-2">Receipt Image</label>
                                        <input type="file" onChange={handleImageUpload} className="input input-bordered w-full" required />
                                        {formData.receiptImageUrl && <img src={formData.receiptImageUrl} alt="preview" className="w-full h-32 object-cover mt-2 rounded-lg" />}
                                    </div>
                                    <div className="flex justify-end gap-4 mt-6">
                                        <button type="button" onClick={handleClose} className="btn bg-gray-300 text-gray-800 font-bold px-5">Cancel</button>
                                        <button type="submit" className="btn bg-red-600 hover:bg-red-700 text-white font-bold px-5">Submit Request</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-xl font-bold mb-4">Coin Request History</h3>
                        {coinHistory.length === 0 ? (
                            <p className="text-center text-gray-500">No request history available.</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {coinHistory.map((request, index) => (
                                    <div key={index} className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p><strong>Amount:</strong> {request.amount} coins</p>
                                            <p><strong>Date:</strong> {new Date(request.requestedAt).toLocaleDateString()}</p>
                                        </div>
                                        <p><strong>Status:</strong> <span className={`font-bold ${request.status === 'pending' ? 'text-yellow-600' : request.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>{request.status}</span></p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
export default AddCoinModal;
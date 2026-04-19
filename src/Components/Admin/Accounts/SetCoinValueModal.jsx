import React, { useState, useEffect } from 'react';
import { FaArrowRight, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Spinner from '../../Shared/Spinner';

const SetCoinValueModal = ({ isOpen, onClose, currentCoinValue, lastUpdatedAt }) => {
    const [coinValue, setCoinValue] = useState(currentCoinValue);
    const [updateUserBalances, setUpdateUserBalances] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setCoinValue(currentCoinValue);
    }, [currentCoinValue]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // First, update the coin value setting
            const res = await fetch('https://central-cafetaria-server.vercel.app/coin-value', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: coinValue })
            });

            if (!res.ok) {
                throw new Error('Failed to update coin value.');
            }

            toast.success('Coin value updated successfully!');

            // If the admin chose to update user balances, call the next endpoint
            if (updateUserBalances) {
                const updateRes = await fetch('https://central-cafetaria-server.vercel.app/users/update-all-coin-balances', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oldValue: currentCoinValue, newValue: coinValue })
                });

                if (!updateRes.ok) {
                    throw new Error('Failed to update user coin balances.');
                }
                
                const updateData = await updateRes.json();
                toast.success(updateData.message || 'User coin balances updated.');
            }

            onClose();

        } catch (error) {
            console.error('Error in save process:', error);
            toast.error(error.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Set Coin Value</h2>
                    <button onClick={onClose} className="btn bg-blue-400 text-white font-bold px-2"><FaArrowRight /></button>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-bold">1 Coin =</span>
                    <input
                        type="number"
                        value={coinValue}
                        onChange={(e) => setCoinValue(e.target.value)}
                        className="input input-bordered w-full"
                    />
                    <span className="font-bold">BDT</span>
                </div>
                {lastUpdatedAt && (
                    <div className="text-sm text-gray-500 mt-2">
                        Last updated: {new Date(lastUpdatedAt).toLocaleString()}
                    </div>
                )}
                <div className="mt-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={updateUserBalances}
                            onChange={(e) => setUpdateUserBalances(e.target.checked)}
                            className="accent-red-500"
                        />
                        <span>Update all user coin balances according to the new value</span>
                    </label>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="btn bg-gray-300 text-gray-800 font-bold px-5">Cancel</button>
                    <button onClick={handleSave} className="btn bg-red-600 hover:bg-red-700 text-white font-bold px-5" disabled={loading}>
                        {loading ? <Spinner size="w-5 h-5" /> : <FaSave />}
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetCoinValueModal;


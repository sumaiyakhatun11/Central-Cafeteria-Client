import React, { useState, useEffect } from 'react';
import { FaArrowRight, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Spinner from '../../Shared/Spinner';
import Button from '../../Shared/Button';

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
                    <Button onClick={onClose} variant="info" size="xs" className="!p-2"><FaArrowRight /></Button>
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
                    <Button onClick={onClose} variant="secondary">Cancel</Button>
                    <Button onClick={handleSave} variant="primary" isLoading={loading}>
                        {!loading && <FaSave />}
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SetCoinValueModal;


import React, { useState } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import Spinner from '../../Shared/Spinner';

const CoinRequestDetailsModal = ({ isOpen, onClose, request, onApprove, onReject }) => {
    const [loading, setLoading] = useState(false);
    if (!isOpen || !request) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Coin Request Details</h2>
                    <button onClick={onClose} className="btn bg-blue-400 text-white font-bold px-2"><FaArrowRight /></button>
                </div>
                <div className="mb-4">
                    <p><strong>User:</strong> {request.userName} ({request.userEmail})</p>
                    <p><strong>Amount:</strong> {request.amount} coins</p>
                    <p><strong>Date:</strong> {new Date(request.requestedAt).toLocaleString()}</p>
                </div>
                <div className="mb-4">
                    <p className="font-bold">Receipt Image:</p>
                    <img src={request.receiptImageUrl} alt="Receipt" className="w-full h-auto object-cover rounded-lg" />
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={async () => { setLoading(true); await onReject(); setLoading(false); }} className="btn bg-red-600 text-white font-bold px-5" disabled={loading}>
                        {loading ? <Spinner size="w-5 h-5" /> : 'Reject'}
                    </button>
                    <button onClick={async () => { setLoading(true); await onApprove(); setLoading(false); }} className="btn bg-green-600 text-white font-bold px-5" disabled={loading}>
                        {loading ? <Spinner size="w-5 h-5" /> : 'Approve'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CoinRequestDetailsModal;

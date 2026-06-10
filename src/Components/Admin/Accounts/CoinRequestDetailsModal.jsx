import React, { useState } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import Spinner from '../../Shared/Spinner';
import Button from '../../Shared/Button';

const CoinRequestDetailsModal = ({ isOpen, onClose, request, onApprove, onReject }) => {
    const [loading, setLoading] = useState(false);
    if (!isOpen || !request) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Coin Request Details</h2>
                    <Button onClick={onClose} variant="info" size="xs" className="!p-2"><FaArrowRight /></Button>
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
                    <Button onClick={async () => { setLoading(true); await onReject(); setLoading(false); }} variant="danger" isLoading={loading}>
                        Reject
                    </Button>
                    <Button onClick={async () => { setLoading(true); await onApprove(); setLoading(false); }} variant="success" isLoading={loading}>
                        Approve
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CoinRequestDetailsModal;

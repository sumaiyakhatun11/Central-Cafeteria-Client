import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaArrowRight } from 'react-icons/fa';

const FoodDetailsModal = ({ isOpen, onClose, food, onEdit, onDelete }) => {
    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black bg-opacity-50 p-4 pt-24 md:items-center md:pt-4">
            <div className="bg-white p-8 rounded-lg w-full max-w-md max-h-[calc(100vh-6rem)] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{food.name}</h2>
                    <button onClick={onClose} className="btn bg-blue-400 text-white font-bold px-2"><FaArrowRight /></button>
                </div>
                <img src={food.image} alt={food.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                <p><strong>Price:</strong> {food.price} tk</p>
                <p><strong>Unit:</strong> {food.unit}</p>
                <p><strong>Categories:</strong> {food.category.join(', ')}</p>
                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={() => onEdit(food)} className="btn bg-green-400 text-white font-bold px-5">Edit</button>
                    <button type="button" onClick={() => onDelete(food._id)} className="btn bg-red-600 text-white font-bold px-5">Delete</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default FoodDetailsModal;

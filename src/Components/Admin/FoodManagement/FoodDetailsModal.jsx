import React from 'react';
import { FaArrowRight } from 'react-icons/fa';

const FoodDetailsModal = ({ isOpen, onClose, food, onEdit, onDelete }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg w-full max-w-md">
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
        </div>
    );
};

export default FoodDetailsModal;

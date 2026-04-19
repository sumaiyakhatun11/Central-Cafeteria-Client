import React, { useState } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AddFoodModal = ({ isOpen, onClose, onFoodAdded, categories }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        unit: '',
        image: '',
        category: []
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            if (checked) {
                return { ...prev, category: [...prev.category, value] };
            } else {
                return { ...prev, category: prev.category.filter(cat => cat !== value) };
            }
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=2756beed15509d2f2a291d0710e71fab`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, image: data.data.url }));
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
            const res = await fetch('https://central-cafetaria-server.vercel.app/foods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success('Food item added successfully!');
                onFoodAdded();
                onClose();
            } else {
                throw new Error('Failed to add food item');
            }
        } catch (error) {
            console.error('Error adding food item:', error);
            toast.error('Failed to add food item. Please try again later.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 text-black bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Add New Food Item</h2>
                    <button onClick={onClose} className="btn bg-blue-400 text-white font-bold px-2"><FaArrowRight /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700">Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input input-bordered w-full" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Price</label>
                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="input input-bordered w-full" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Unit</label>
                        <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} className="input input-bordered w-full" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Image</label>
                        <input type="file" onChange={handleImageUpload} className="input dark:text-blue-50 input-bordered w-full" />
                        {formData.image && <img src={formData.image} alt="preview" className="w-full h-32 object-cover mt-2" />}
                    </div>
                    <div className="mb-4">
                        <label className="block text-black">Categories</label>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map(cat => (
                                <div key={cat} className="form-control">
                                    <label className="label mt-5 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            value={cat} 
                                            onChange={handleCategoryChange} 
                                            className="checkbox text-gray-700 rounded-none w-6 h-6 outline" 
                                        />
                                        <span className="label-text ml-2">{cat}</span> 
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="btn bg-blue-400 text-white font-bold px-5">Cancel</button>
                        <button type="submit" className="btn bg-red-600 text-white font-bold px-5">Add Food</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFoodModal;

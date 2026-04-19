import React, { useState, useEffect } from 'react';
import AddFoodModal from './AddFoodModal';
import FoodDetailsModal from './FoodDetailsModal';
import EditFoodModal from './EditFoodModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from '../../Shared/Spinner';

const ManageFood = () => {
    const [foods, setFoods] = useState([]);
    const [groupedFoods, setGroupedFoods] = useState({});
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);
    const [loading, setLoading] = useState(true); // Added loading state

    const [uniqueCategories, setUniqueCategories] = useState([]);

    const fetchFoods = async () => {
        setLoading(true);
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/foods');
            const data = await res.json();
            if (res.ok) {
                setFoods(data);
                groupFoods(data);
                const allCategories = data.reduce((acc, food) => {
                    if (food.category) {
                        // Standardize to lowercase
                        return [...acc, ...food.category.map(c => c.toLowerCase())];
                    }
                    return acc;
                }, []);
                setUniqueCategories([...new Set(allCategories)]);
            } else {
                throw new Error('Failed to fetch foods');
            }
        } catch (error) {
            console.error('Error fetching foods:', error);
            toast.error('Failed to fetch foods. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const groupFoods = (foodsToGroup) => {
        const groups = foodsToGroup.reduce((acc, food) => {
            if (food.category) {
                food.category.forEach(cat => {
                    const lowerCat = cat.toLowerCase(); // Standardize to lowercase
                    if (!acc[lowerCat]) {
                        acc[lowerCat] = [];
                    }
                    acc[lowerCat].push(food);
                });
            }
            return acc;
        }, {});
        setGroupedFoods(groups);
    };

    useEffect(() => {
        fetchFoods();
    }, []);

    const handleSetAllAvailable = async () => {
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/foods/set-all-available', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if(res.ok) {
                toast.success('All food items have been set to available.');
                fetchFoods();
            } else {
                throw new Error('Failed to set all foods available');
            }
        } catch (error) {
            console.error('Error setting all foods available:', error);
            toast.error('Failed to set all foods to available. Please try again later.');
        }
    };

    const handleToggleAvailability = async (foodId, category, status) => {
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/foods/${foodId}/availability`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ category, status })
            });

            if (res.ok) {
                toast.success('Availability updated successfully');
                fetchFoods();
            } else {
                throw new Error('Failed to update availability');
            }
        } catch (error) {
            console.error('Error updating availability:', error);
            toast.error('Failed to update availability. Please try again later.');
        }
    };

    const handleCardClick = (food) => {
        setSelectedFood(food);
        setIsDetailsModalOpen(true);
    };

    const handleDelete = async (foodId) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                const res = await fetch(`https://central-cafetaria-server.vercel.app/foods/${foodId}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    toast.success('Food item deleted successfully');
                    fetchFoods();
                    setIsDetailsModalOpen(false);
                } else {
                    throw new Error('Failed to delete food item');
                }
            } catch (error) {
                console.error('Error deleting food item:', error);
                toast.error('Failed to delete food item. Please try again later.');
            }
        }
    };

    const handleEdit = (food) => {
        setSelectedFood(food);
        setIsDetailsModalOpen(false);
        setIsEditModalOpen(true);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Manage Food Items</h2>
            <div className="flex justify-center gap-4 mb-6">
                <button onClick={() => setIsAddModalOpen(true)} className="btn bg-red-600 text-white font-bold px-5">Add Food</button>
                <button onClick={handleSetAllAvailable} className="btn bg-red-600 text-white font-bold px-5">Set all foods available</button>
            </div>
            {loading ? (
                <div className="flex justify-center items-center h-64"><Spinner /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.keys(groupedFoods).map(category => (
                        <div key={category} className="bg-gray-100 text-black p-4 rounded-lg">
                            <h3 className="text-xl font-bold mb-4">{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                            <div className="flex flex-col gap-4">
                                {groupedFoods[category].map(food => (
                                    <div key={food._id} className="bg-white p-3 rounded-lg shadow-md flex justify-between items-center">
                                        <span className="cursor-pointer" onClick={() => handleCardClick(food)}>{food.name}</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                value=""
                                                className="sr-only peer"
                                                checked={(food.availability && food.availability[category]) || false}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleAvailability(food._id, category, e.target.checked)
                                                }}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <AddFoodModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onFoodAdded={() => {
                    fetchFoods();
                    setIsAddModalOpen(false);
                }} 
                categories={uniqueCategories}
            />
            {selectedFood && <FoodDetailsModal 
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                food={selectedFood}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />}
            {selectedFood && <EditFoodModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                food={selectedFood}
                onFoodUpdated={() => {
                    fetchFoods();
                    setIsEditModalOpen(false);
                }}
                categories={uniqueCategories}
            />}
            
        </div>
    );
};

export default ManageFood;



import React, { useContext, useState, useEffect } from 'react';
import { MdOutlineShoppingCart } from "react-icons/md";
import { AddToCartContext } from './Home';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FoodCategory = ({ title, items }) => {
    const handleAddToCart = useContext(AddToCartContext);
    const actualCategory = title.split(' ')[0].toLowerCase(); // e.g., "Breakfast Menu" -> "breakfast"
    const [internalItems, setInternalItems] = useState(items);

    useEffect(() => {
        setInternalItems(items);
    }, [items]);

    useEffect(() => {
        const interval = setInterval(() => {
            const fetchFoods = async () => {
                try {
                    const res = await fetch('https://central-cafetaria-server.vercel.app/foods');
                    const data = await res.json();
                    if (res.ok) {
                        const filteredItems = data.filter(food => food.category.includes(actualCategory));
                        setInternalItems(filteredItems);
                    } else {
                        throw new Error('Failed to fetch foods');
                    }
                } catch (error) {
                    console.error('Error fetching foods:', error);
                    toast.error('Failed to fetch foods. Please try again later.');
                }
            };
            fetchFoods();
        }, 5000);

        return () => clearInterval(interval);
    }, [actualCategory]);


    if (!internalItems) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold mb-6 text-center">{title}</h2>
                <p className='text-center'>No items available in this category at the moment.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-3xl text-yellow-100 font-bold mb-6 text-center">{title}</h2>
            
            {/* Desktop View */}
            <div className="lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hidden h-[110vh] overflow-y-scroll scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-red-100">
                {internalItems.map((item, index) => {
                    const isAvailable = item.availability && item.availability[actualCategory];
                    return (
                        <div key={index} className="bg-yellow-100/70 rounded-lg shadow-md hover:shadow-lg p-2 transition-shadow group relative">
                            {!isAvailable && (
                                <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center rounded-lg z-10">
                                    <span className="text-red-600 bg-white/90 px-5 py-2 text-xl font-bold">Not Available</span>
                                </div>
                            )}
                            <div className={`overflow-hidden h-48 rounded-t-lg ${!isAvailable ? 'grayscale' : ''}`}>
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/300x200?text=Food+Image';
                                    }}
                                />
                            </div>
                            <div className="p-4">
                                <h3 className="text-xl font-bold text-red-800 mb-2">{item.name}</h3>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-black">{item.price} tk</span>
                                </div>
                                <p className="text-black mt-2">Unit: {item.unit}</p>
                                <button
                                    onClick={() => handleAddToCart(item, actualCategory)}
                                    className={`mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!isAvailable}>
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile View */}
            <div className='lg:hidden flex flex-col gap-5'>
                {internalItems.map((item, index) => {
                    const isAvailable = item.availability && item.availability[actualCategory];
                    return (
                        <div key={index} className='bg-yellow-100/70 rounded-md relative flex gap-5 shadow-sm hover:shadow-md p-3'>
                            {!isAvailable && (
                                <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center rounded-lg z-10">
                                    <span className="text-red-600 bg-white/90 px-2 py-0  text-xl font-bold">Not Available</span>
                                </div>
                            )}
                            <img
                                src={item.image}
                                className={`w-16 h-12 rounded-full ${!isAvailable ? 'grayscale' : ''}`}
                                alt={item.name} />
                            <div className='flex flex-1 justify-between items-center '>
                                <div className='flex justify-start items-end gap-2 flex-wrap'>
                                    <h2 className='text-xl font-semibold'>{item.name}</h2>
                                    <p className='text-red-700 font-bold'>{item.price}tk</p>
                                </div>
                                <div onClick={() => isAvailable && handleAddToCart(item, actualCategory)}
                                    className={`flex justify-center items-center p-2 bg-red-400 rounded-full cursor-pointer ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <MdOutlineShoppingCart className='text-2xl' />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <ToastContainer />
        </div>
    );
};

export default FoodCategory;

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../Authentication/AuthProvider';
import EventBookingModal from './EventBookingModal'; // Import the new component
import { toast } from 'react-toastify';
import { SearchContext } from './SearchContext';


export const AddToCartContext = React.createContext(null); // Context to pass the function

const Home = () => {
    const { user } = useAuth();
    const nav = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const navItems = [
        { path: "/breakfast", label: "Breakfast", image: "/breakfast.png" },
        { path: "/lunch", label: "Lunch", image: "/lunch.jpg" },
        { path: "/snacks", label: "Snacks", image: "/snacks.jpg" },
        { path: "/dinner", label: "Dinner", image: "/dinner.png" },
    ];

    const handleAddToCart = async (item, category) => {
        if (!user || !user.id) {
            toast.error('Please login to add items to your cart.');
            nav("/login")
            return;
        }

        const cartItem = { name: item.name, image: item.image, price: item.price, unit: item.unit, category: category };

        try {
            const response = await fetch('https://central-cafetaria-server.vercel.app/add-to-cart', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, item: cartItem })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success('Item added to cart!');
            } else if (response.status === 409) {
                toast.warn(data.message);
            }
            else {
                toast.error(data.message || 'Failed to add item to cart');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            toast.error('Something went wrong.');
        }
    };

    return (
        <AddToCartContext.Provider value={handleAddToCart}>
            <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4
                    bg-[linear-gradient(rgba(255,255,255,0.9),rgba(255,255,255,0.9)),url('https://i.ibb.co.com/MxKKQLqF/istockphoto-2220875039-612x612.jpg')] 
                    bg-repeat 
                    bg-[length:200px_200px]">
                {/* Mobile Navigation */}
                <div className="md:hidden flex justify-around px-4 py-2 bg-red-100 rounded shadow">
                    {navItems.map(({ path, label }) => (
                        <NavLink key={path} to={path} className={({ isActive }) => `text-xl font-semibold px-3 py-2 rounded ${isActive ? 'bg-red-500 text-white' : 'text-red-600 hover:bg-red-200'}`}>
                            {label}
                        </NavLink>
                    ))}
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-4 p-4 overflow-y-auto">
                    {navItems.map(({ path, label, image }) => (
                        <motion.div key={path} whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                            <NavLink to={path} className={({ isActive }) => `min-w-full min-h-full relative flex justify-center items-center rounded shadow-xl ${isActive ? 'shadow-red-700/50' : 'shadow-black/50'}`}>
                                <h2 className="text-xl font-bold text-white bg-red-900/60 border-red-600 border-4 px-5 py-2 z-10">{label}</h2>
                                <img className="w-full h-full absolute object-cover rounded" src={image} alt={label} onError={(e) => { e.target.src = '/placeholder-food.jpg'; }} />
                            </NavLink>
                        </motion.div>
                    ))}
                    <div className='col-span-2 text-center rounded-lg flex flex-col justify-center items-center relative min-h-[200px] overflow-hidden group'>
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110" style={{ backgroundImage: `url(https://i.ibb.co.com/yn3GCgfm/Chat-GPT-Image-Oct-20-2025-07-48-52-PM.png)` }}></div>
                        
                        {/* Shimmer Effect overlay */}
                        <div className="absolute inset-0 animate-shimmer opacity-30 z-10 pointer-events-none"></div>
                        
                        <div className="absolute inset-0 bg-black/50 rounded-lg"></div>
                        <div className="relative z-20 text-white">
                            <h2 className='text-3xl font-bold'>Host Your Event!</h2>
                            <p className="mb-4">Book our space for your next celebration.</p>
                            <button onClick={() => user ? setIsModalOpen(true) : nav('/login')} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors tinos-regular">Book Now</button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 p-4">
                    {/* Search Food Section */}
                    <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Search Food</h3>
                        <div className="flex gap-2 flex-col sm:flex-row">
                            <input
                                type="text"
                                placeholder="Search for food items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-gray-800"
                            />
                            <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors tinos-regular whitespace-nowrap">
                                Search
                            </button>
                        </div>
                    </div>

                    <Outlet />
                </div>
            </div>

            {/* Render the new Event Booking Modal component */}
            <EventBookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
            />
            </SearchContext.Provider>
        </AddToCartContext.Provider>
    );
};

export default Home;

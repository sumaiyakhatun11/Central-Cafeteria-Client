import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../Authentication/AuthProvider';
import EventBookingModal from './EventBookingModal'; // Import the new component
import { toast } from 'react-toastify';
import Button from '../Shared/Button';
import { SearchContext } from './SearchContext';


export const AddToCartContext = React.createContext(null); // Context to pass the function

const Home = () => {
    const { user } = useAuth();
    const nav = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [recommendedItems, setRecommendedItems] = useState([]);
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

    const navItems = [
        { path: "/breakfast", label: "Breakfast", image: "/breakfast.png" },
        { path: "/lunch", label: "Lunch", image: "/lunch.jpg" },
        { path: "/snacks", label: "Snacks", image: "/snacks.jpg" },
        { path: "/dinner", label: "Dinner", image: "/dinner.png" },
    ];

    const getPreferredCategories = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 10) return ['breakfast', 'snacks'];
        if (hour >= 10 && hour < 15) return ['lunch', 'snacks'];
        if (hour >= 15 && hour < 19) return ['snacks', 'lunch'];
        return ['dinner', 'snacks'];
    };

    const buildRecommendations = (foods) => {
        const query = searchQuery.trim().toLowerCase();
        const preferredCategories = getPreferredCategories();

        const scoredFoods = foods.map((food) => {
            const rating = Number(food.rating || 0);
            const categories = Array.isArray(food.category) ? food.category : [];

            let score = rating * 10;

            if (categories.some((category) => preferredCategories.includes(category))) {
                score += 20;
            }

            if (query) {
                const nameMatches = food.name?.toLowerCase().includes(query);
                const categoryMatches = categories.some((category) => category.includes(query));
                score += nameMatches ? 25 : 0;
                score += categoryMatches ? 10 : 0;
            }

            if (rating >= 4.5) {
                score += 10;
            }

            if (Number(food.price) <= 20) {
                score += 5;
            }

            return { ...food, score };
        });

        return scoredFoods
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);
    };

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setIsLoadingRecommendations(true);
                const response = await fetch('/Food.json');
                const foods = await response.json();

                if (Array.isArray(foods)) {
                    setRecommendedItems(buildRecommendations(foods));
                } else {
                    setRecommendedItems([]);
                }
            } catch (error) {
                console.error('Recommendation fetch error:', error);
                setRecommendedItems([]);
            } finally {
                setIsLoadingRecommendations(false);
            }
        };

        fetchRecommendations();
    }, [searchQuery]);

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

    const recommendationCategoryLabel = (item) => {
        if (!Array.isArray(item.category) || item.category.length === 0) {
            return 'Recommended';
        }

        return item.category
            .map((category) => category.charAt(0).toUpperCase() + category.slice(1))
            .join(' · ');
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
                            <Button onClick={() => user ? setIsModalOpen(true) : nav('/login')} className="tinos-regular">Book Now</Button>
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
                            <Button className="tinos-regular whitespace-nowrap">
                                Search
                            </Button>
                        </div>
                    </div>

                    <Outlet />

                    {/* AI Generated Recommendations */}
                    <div className="mt-6 mb-6 rounded-2xl border border-red-200 bg-gradient-to-br from-white via-red-50 to-red-100 p-4 shadow-md">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-red-700">Recommendation</h3>
                                <p className="text-sm text-gray-600">Smart picks based on time of day, rating, price, and your search.</p>
                            </div>
                            <div className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                                Smart Picks
                            </div>
                        </div>

                        {isLoadingRecommendations ? (
                            <p className="text-gray-600">Generating recommendations...</p>
                        ) : recommendedItems.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {recommendedItems.map((item) => (
                                    <motion.div
                                        key={item.name}
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                                        className="overflow-hidden rounded-xl bg-white shadow-sm border border-red-100"
                                    >
                                        <div className="flex gap-3 p-3">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-20 w-20 rounded-lg object-cover"
                                                onError={(e) => {
                                                    e.target.src = '/placeholder-food.jpg';
                                                }}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                                                        <p className="text-xs font-semibold text-red-700">{recommendationCategoryLabel(item)}</p>
                                                    </div>
                                                    <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                                                        {Number(item.rating || 0).toFixed(1)} ★
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-gray-600">Price: {item.price} tk</p>
                                                <Button
                                                    onClick={() => handleAddToCart(item, Array.isArray(item.category) ? item.category[0] : 'recommended')}
                                                    size="sm"
                                                >
                                                    Add to Cart
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">No recommendations available right now.</p>
                        )}
                    </div>
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

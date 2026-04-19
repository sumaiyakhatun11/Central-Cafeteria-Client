import React, { useEffect, useState } from 'react';
import { useAuth } from '../Authentication/AuthProvider';
import { User2, Coins } from 'lucide-react';
import { MdOutlineShoppingCart } from 'react-icons/md';
import { AiOutlineLogout, AiOutlineHistory } from "react-icons/ai"; // Added AiOutlineHistory
import { FiHome } from "react-icons/fi";
import CartDrawer from './CartDrawer';
import AddCoinModal from './AddCoinModal';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MdOutlinePeopleAlt } from "react-icons/md";
import Spinner from './Spinner';
import EventHistoryModal from './EventHistoryModal'; // Will create this file

const StatusBar = () => {
    const { user, logout } = useAuth();
    const [cartOpen, setCartOpen] = useState(false);
    const [isAddCoinModalOpen, setIsAddCoinModalOpen] = useState(false);
    const [isEventHistoryModalOpen, setIsEventHistoryModalOpen] = useState(false); // New state
    const [queueData, setQueueData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const linkClass = ({ isActive }) =>
        `cursor-pointer hover:underline whitespace-nowrap ${isActive ? 'font-bold' : ''
        }`;

    const toggleCart = () => setCartOpen(!cartOpen);
    const toggleAddCoinModal = () => setIsAddCoinModalOpen(!isAddCoinModalOpen);
    const toggleEventHistoryModal = () => setIsEventHistoryModalOpen(!isEventHistoryModalOpen); // New toggle function

    const handleLogout = () => {
        logout();
        navigate('/login'); // Redirect to login page after logout
    };

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const res = await fetch('https://central-cafetaria-server.vercel.app/latqueue');
            const data = await res.json();
            if (res.ok) {
                setQueueData(data.data || []);
            } else {
                console.error(data.message);
            }
        } catch (err) {
            console.error('Queue fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();

        const interval = setInterval(() => {
            fetchQueue();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className='relative'>
            {user && user.role === 'admin' ? (
                // Admin specific StatusBar content (navigation links)
                <div className='w-full bg-red-700 py-2 px-3 md:px-5 flex flex-wrap justify-center md:justify-end gap-3 md:gap-10 items-center text-white text-sm md:text-xl'>
                    <NavLink to='/admin/queue' className={linkClass}>
                        Queue
                    </NavLink>
                    <NavLink to='/admin/events' className={linkClass}>
                        Events
                    </NavLink>
                    <NavLink to='/admin/food-management' className={linkClass}>
                        Items
                    </NavLink>
                    <NavLink to='/admin/sales' className={linkClass}>
                        Sales Report
                    </NavLink>
                    <NavLink to='/admin/inventory-management' className={linkClass}>
                        Inventory
                    </NavLink>
                    
                    <NavLink to='/admin/accounts' className={linkClass}>
                        Accounts
                    </NavLink>
                    {
                        user &&
                        <button
                            onClick={handleLogout}
                            className='bg-red-500 hover:bg-red-600 text-white p-1.5 md:p-2 rounded-full text-lg md:text-xl font-bold'
                        >
                            <AiOutlineLogout />
                        </button>
                    }
                </div>
            ) : (
                // Existing user specific StatusBar content
                <div className='w-full bg-red-700 py-2 px-3 md:px-5 flex justify-between items-center gap-2'>

                    {/* User ID */}
                    {user && (
                        <div className='text-sm md:text-xl font-medium text-white flex-shrink-0'>
                            <span className='hidden sm:inline'>ID: </span><span className=''>{user.userId}</span>
                        </div>
                    )}

                    <div className='flex items-center gap-2 md:gap-4 overflow-hidden'>
                        {/* Queue / Home Icon */}
                        <div
                            onClick={() => location.pathname === '/queue' ? navigate('/') : navigate('/queue')}
                            className='flex items-center gap-1 md:gap-2 text-white cursor-pointer whitespace-nowrap'
                        >
                            {location.pathname === '/queue' ? (
                                <>
                                    <FiHome size={18} className="md:size-[20px]" />
                                    <span className="text-sm md:text-xl font-medium hidden sm:inline">Home</span>
                                </>
                            ) : (
                                <>
                                    <MdOutlinePeopleAlt className='text-xl md:text-2xl' />
                                    {
                                        !user &&
                                        <span className="text-xs md:text-base hidden sm:inline">Orders Queue</span>
                                    }
                                    <span className='text-sm md:text-xl font-bold'>{queueData.length}</span>
                                    {loading && <Spinner size="w-4 h-4 md:w-5 md:h-5" />}
                                </>
                            )}
                        </div>

                        {/* Right-side Actions */}
                        <div className="flex gap-2 md:gap-3 items-center ml-auto">
                            {/* User specific actions */}
                            {
                                user && user.role !== 'admin' &&
                                <>
                                    {/* Event History Icon */}
                                    <div
                                        className='p-1.5 md:p-2 bg-red-500 rounded-full cursor-pointer hover:bg-red-600 transition-colors'
                                        onClick={toggleEventHistoryModal}
                                        title="Event History"
                                    >
                                        <AiOutlineHistory className='text-lg md:text-2xl' />
                                    </div>
                                    {/* Coin Icon */}
                                    <div
                                        className='p-1.5 md:p-2 bg-red-500 rounded-full cursor-pointer hover:bg-red-600 transition-colors'
                                        onClick={toggleAddCoinModal}
                                        title="Add Coins"
                                    >
                                        <Coins className='text-lg md:text-2xl' />
                                    </div>
                                    {/* Cart */}
                                    <div
                                        className='p-1.5 md:p-2 bg-red-500 rounded-full cursor-pointer hover:bg-red-600 transition-colors relative'
                                        onClick={toggleCart}
                                        title="Cart"
                                    >
                                        <MdOutlineShoppingCart className='text-lg md:text-2xl' />
                                    </div>
                                    {/* Logout Button for non-admin users */}
                                    <button
                                        onClick={handleLogout}
                                        className='bg-red-500 hover:bg-red-600 text-white p-1.5 md:p-2 rounded-full text-lg md:text-xl font-bold transition-colors'
                                        title="Logout"
                                    >
                                        <AiOutlineLogout />
                                    </button>
                                </>
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Drawer */}
            <CartDrawer
                isOpen={cartOpen}
                onClose={toggleCart}
                userId={user?.id}
                fetchQueue={fetchQueue}
            />
            {/* Add Coin Modal */}
            <AddCoinModal
                isOpen={isAddCoinModalOpen}
                onClose={toggleAddCoinModal}
            />
            {/* Event History Modal */}
            <EventHistoryModal
                isOpen={isEventHistoryModalOpen}
                onClose={toggleEventHistoryModal}
                userId={user?.userId}
            />
        </div>
    );
};

export default StatusBar;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../Authentication/AuthProvider';
import { User2, Coins } from 'lucide-react';
import { MdOutlineShoppingCart } from 'react-icons/md';
import { AiOutlineLogout } from "react-icons/ai";
import { FiHome } from "react-icons/fi";
import CartDrawer from './CartDrawer';
import AddCoinModal from './AddCoinModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdOutlinePeopleAlt } from "react-icons/md";
import Spinner from './Spinner';

const StatusBar = () => {
    const { user, logout } = useAuth();
    const [cartOpen, setCartOpen] = useState(false);
    const [isAddCoinModalOpen, setIsAddCoinModalOpen] = useState(false);
    const [queueData, setQueueData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const toggleCart = () => setCartOpen(!cartOpen);
    const toggleAddCoinModal = () => setIsAddCoinModalOpen(!isAddCoinModalOpen);

    const handleLogout = () => {
        logout();
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
            <div className='w-full bg-red-700 py-2 px-5 flex justify-between lg:justify-end gap-5 items-center'>

                {/* User ID */}
                {user && (
                    <div className='text-xl font-medium text-white'>
                        ID: <span className=''>{user.userId}</span>
                    </div>
                )}

                <div className='flex items-center gap-4'>
                    {/* Queue / Home Icon */}
                    <div
                        onClick={() => location.pathname === '/queue' ? navigate('/') : navigate('/queue')}
                        className='flex items-end gap-2 text-white cursor-pointer'
                    >
                        {location.pathname === '/queue' ? (
                            <>
                                <FiHome size={20} />
                                <span className="text-xl font-medium"></span>
                            </>
                        ) : (
                            <>
                                <MdOutlinePeopleAlt className='text-2xl' />
                                {
                                    !user&&
                                    <span>Orders Queue</span>
                                }
                                <span className='text-xl'> <strong>{queueData.length}</strong></span>
                                {loading && <Spinner size="w-5 h-5" />}
                            </>
                        )}
                    </div>

                    {/* Right-side Actions */}
                    <div className="flex gap-3 items-center ml-auto lg:m-0">
                        {/* Coin Icon */}
                        {
                            user &&
                            <>
                                <div
                                    className='p-2 bg-red-200 rounded-full cursor-pointer'
                                    onClick={toggleAddCoinModal}
                                >
                                    <Coins className='text-2xl' />
                                </div>
                                {/* Cart */}
                                <div
                                    className='p-2 bg-red-200 rounded-full cursor-pointer'
                                    onClick={toggleCart}
                                >
                                    <MdOutlineShoppingCart className='text-2xl' />
                                </div>
                            </>
                        }

                        {/* Logout */}
                        {
                            user &&
                            <button
                                onClick={handleLogout}
                                className='bg-red-500 hover:bg-red-600 text-white p-2 rounded-full text-xl font-bold'
                            >
                                <AiOutlineLogout />
                            </button>
                        }
                    </div>
                </div>
            </div>

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
        </div>
    );
};

export default StatusBar;

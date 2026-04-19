import React, { useEffect, useState } from 'react';
import { useAuth } from '../Authentication/AuthProvider';
import { toast } from 'react-toastify';

import { FaPlus, FaMinus } from "react-icons/fa6";
import Spinner from './Spinner';
const CartDrawer = ({ isOpen, onClose, userId, fetchQueue }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updatingItems, setUpdatingItems] = useState({});
    const [usePrivilege, setUsePrivilege] = useState(false);
    const [isPrivileged, setIsPrivileged] = useState(false); // New state
    const [payWithCoins, setPayWithCoins] = useState(false);
    const [coinBalance, setCoinBalance] = useState(0);
    const [coinValue, setCoinValue] = useState(5); // Default value
    const { user } = useAuth();

    const fetchCoinBalance = async (id) => {
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/users/${id}/coins`);
            const data = await res.json();
            if (res.ok) {
                setCoinBalance(data.coins);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error('Failed to fetch coin balance.');
        }
    };

    const fetchCoinValue = async () => {
        try {
            const res = await fetch('https://central-cafetaria-server.vercel.app/coin-value');
            const data = await res.json();
            if (res.ok) {
                setCoinValue(data.value);
            }
        } catch (error) {
            console.error('Error fetching coin value:', error);
        }
    };

    useEffect(() => {
        const fetchCoinValue = async () => {
            try {
                const res = await fetch('https://central-cafetaria-server.vercel.app/coin-value');
                const data = await res.json();
                if (res.ok) {
                    setCoinValue(data.value);
                }
            } catch (error) {
                console.error('Error fetching coin value:', error);
            }
        };

        let interval;
        if (isOpen && userId) {
            fetchCartItems(userId);
            fetchPrivilegedStatus(userId);
            fetchCoinBalance(userId);
            fetchCoinValue(); // Initial fetch
            setUsePrivilege(false);
            interval = setInterval(fetchCoinValue, 3000); // Poll every 3 seconds
        }

        return () => {
            if (interval) {
                clearInterval(interval); // Cleanup interval on close
            }
        };
    }, [isOpen, userId]);

    const fetchPrivilegedStatus = async (id) => {
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/users/${id}/privileged-status`);
            const data = await res.json();
            if (res.ok) {
                setIsPrivileged(data.privileged);
            } else {
                toast.error(data.message);
                setIsPrivileged(false);
            }
        } catch (err) {
            toast.error('Failed to fetch privileged status.');
            setIsPrivileged(false);
        }
    };

    const fetchCartItems = async (id) => {
        try {
            setLoading(true);
            const res = await fetch(`https://central-cafetaria-server.vercel.app/cart/${id}`);
            const data = await res.json();
            if (res.ok) {
                setCartItems(data.cart || []);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error('Failed to fetch cart items.');
        } finally {
            setLoading(false);
        }
    };

    const resetCart = async () => {
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/cart/${userId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Cart cleared successfully!');
                setCartItems([]);
                fetchQueue();
                setPayWithCoins(false); // Reset payWithCoins state
            } else {
                toast.error('Failed to clear cart.');
            }
        } catch (err) {
            console.error('Error clearing cart:', err);
            toast.error('Error clearing cart.');
        }
    };

    const increaseUnit = async (index) => {
        const item = cartItems[index];
        const updatedUnit = item.unit + 1;
        await updateCartItem(item.name, updatedUnit);
    };

    const decreaseUnit = async (index) => {
        const item = cartItems[index];
        const updatedUnit = item.unit - 1;
        await updateCartItem(item.name, updatedUnit);
    };

    const updateCartItem = async (itemName, newUnit) => {
        setUpdatingItems(prev => ({ ...prev, [itemName]: true }));
        try {
            const response = await fetch(`https://central-cafetaria-server.vercel.app/cart/update-unit`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    itemName,
                    newUnit
                })
            });

            const data = await response.json();
            if (response.ok) {
                if (newUnit === 0) {
                    // Remove item from local state
                    setCartItems((prev) => prev.filter((item) => item.name !== itemName));
                } else {
                    // Update item unit in local state
                    setCartItems((prev) =>
                        prev.map((item) =>
                            item.name === itemName ? { ...item, unit: newUnit } : item
                        )
                    );
                }
            } else {
                toast.error('Failed to update cart item unit.');
            }
        } catch (err) {
            toast.error('Error updating cart item unit.');
        } finally {
            setUpdatingItems(prev => ({ ...prev, [itemName]: false }));
        }
    };


    const placeOrder = async () => {
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/order/queue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, usePrivilege, payWithCoins })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(`Order placed successfully! Your Queue ID is ${data.queueId}`);
                fetchQueue();
                setCartItems([]);
                onClose();
            } else {
                toast.error(`Order failed: ${data.message}`);
            }
        } catch (error) {
            console.error('Order placement error:', error);
            toast.error('Something went wrong while placing your order.');
        }
    };

    const totalPrice = usePrivilege
        ? 0
        : cartItems.reduce((acc, item) => acc + item.unit * Number(item.price), 0);

    const totalInCoins = totalPrice / coinValue;

    return (
        <div className={`fixed top-0 right-0 flex flex-col justify-between max-h-screen min-h-screen overflow-y-scroll w-96 text-black bg-white/90 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>


            <div className="p-4 overflow-y-auto h-[calc(100%-200px)]">
                <div className=" flex justify-between items-center border-b mb-5">
                    <h2 className="text-xl font-semibold">Your Cart</h2>
                    <div className="flex gap-2">
                        <button onClick={resetCart} className="btn btn-sm bg-gray-200 dark:text-gray-800 hover:bg-gray-300">Reset Cart</button>
                        <button onClick={onClose} className="text-xl text-gray-500  hover:text-red-500">×</button>
                    </div>
                </div>
                {loading ? (
                    <Spinner />
                ) : cartItems.length === 0 ? (
                    <p>Your cart is empty.</p>
                ) : (
                    <ul className="space-y-4">
                        {cartItems.map((item, index) => (
                            <li key={index} className="border p-3 bg-white/80 rounded-lg shadow-sm flex gap-3 items-center">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-14 h-14 object-cover rounded"
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/80'}
                                />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">{item.name}</h3>
                                    <p className="text-sm text-gray-600">Unit: {item.unit}</p>
                                    <p className="text-red-600 font-bold">{item.price}tk</p>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => decreaseUnit(index)}
                                        className="p-2 text-sm font-bold bg-gray-200 rounded-full disabled:opacity-50"
                                        disabled={updatingItems[item.name]}
                                    >
                                        <FaMinus />
                                    </button>
                                    <button
                                        onClick={() => increaseUnit(index)}
                                        className="p-2 text-sm font-bold bg-gray-200 rounded-full disabled:opacity-50"
                                        disabled={updatingItems[item.name]}
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="p-4 border-t">
                {isPrivileged && (
                    <label className="flex items-center gap-2 text-sm mb-3">
                        <input
                            type="checkbox"
                            checked={usePrivilege}
                            onChange={(e) => setUsePrivilege(e.target.checked)}
                            className="accent-red-500"
                        />
                        Use Privilege (Total will be free)
                    </label>
                )}

                <p className="text-lg font-semibold">Total: {totalPrice}tk</p>

                <div className="mt-4">
                    <label className={`flex items-center gap-2 text-sm ${coinBalance <= 0 ? 'cursor-not-allowed' : ''}`}>
                        <input
                            type="checkbox"
                            checked={payWithCoins}
                            onChange={(e) => setPayWithCoins(e.target.checked)}
                            className="accent-red-500"
                            disabled={coinBalance <= 0}
                        />
                        Pay with Coins
                        {coinBalance <= 0 && <span className="text-gray-500">(No Coins)</span>}
                    </label>
                    {payWithCoins && coinBalance > 0 && (
                        <div className="mt-2 p-2 bg-gray-100 rounded">
                            <p className="text-sm">Total in Coins: {totalInCoins.toFixed(2)} coins</p>
                            <p className="text-sm">Your Balance: {coinBalance} coins</p>
                            <p className="text-sm">Remaining Balance: {(coinBalance - totalInCoins).toFixed(2)} coins</p>
                        </div>
                    )}
                </div>

                <button
                    className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                    onClick={placeOrder}
                >
                    Place Order
                </button>
            </div>
        </div>
    );
};

export default CartDrawer;

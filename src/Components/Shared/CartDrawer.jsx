import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../Authentication/AuthProvider';
import { toast } from 'react-toastify';

import { FaPlus, FaMinus } from "react-icons/fa6";
import Button from './Button';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CartDrawer = ({ isOpen, onClose, userId, fetchQueue }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updatingItems, setUpdatingItems] = useState({});
    const [usePrivilege, setUsePrivilege] = useState(false);
    const [isPrivileged, setIsPrivileged] = useState(false); // New state
    const [payWithCoins, setPayWithCoins] = useState(false);
    const [payWithCash, setPayWithCash] = useState(true);
    const [coinBalance, setCoinBalance] = useState(0);
    const [coinValue, setCoinValue] = useState(5); // Default value
    const { user } = useAuth();
    const [tableNumber, setTableNumber] = useState('');

    const fetchCoinBalance = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}/coins`);
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
            const res = await fetch(`${API_BASE_URL}/coin-value`);
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
                const res = await fetch(`${API_BASE_URL}/coin-value`);
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
            setPayWithCash(true);
            interval = setInterval(fetchCoinValue, 3000); // Poll every 3 seconds
        }

        return () => {
            if (interval) {
                clearInterval(interval); // Cleanup interval on close
            }
        };
    }, [isOpen, userId]);

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    const fetchPrivilegedStatus = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}/privileged-status`);
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
            const res = await fetch(`${API_BASE_URL}/cart/${id}`);
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
            const res = await fetch(`${API_BASE_URL}/cart/${userId}`, {
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
            const response = await fetch(`${API_BASE_URL}/cart/update-unit`, {
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
        // If teacher role, require table number
        if (user && user.role === 'teacher' && (!tableNumber || tableNumber.trim() === '')) {
            toast.error('Please enter table number for teacher orders.');
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/order/queue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, usePrivilege, payWithCoins, payWithCash, tableNumber })
            });

            const data = await res.json();
            if (res.ok) {
                if (user && user.role === 'teacher') {
                    toast.success('Order placed, wait for a while');
                } else {
                    toast.success(
                        `Order placed! Token: ${data.token} | Position: ${data.queuePosition} | Status: ${data.status} | Est. wait: ${data.estimatedWaitingMinutes} min`
                    );
                }
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

    return createPortal(
        <div className={`fixed top-0 right-0 flex flex-col justify-between max-h-screen min-h-screen overflow-y-scroll w-96 text-black bg-white/90 shadow-lg z-[90] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>


            <div className="p-4 overflow-y-auto h-[calc(100%-200px)]">
                <div className=" flex justify-between items-center border-b mb-5">
                    <h2 className="text-xl font-semibold">Your Cart</h2>
                    <div className="flex gap-2">
                        <Button onClick={resetCart} variant="secondary" size="sm">Reset Cart</Button>
                        <Button onClick={onClose} variant="ghost" size="sm" className="text-xl text-gray-500 hover:text-red-500 transition-colors !p-0">×</Button>
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
                                    <Button
                                        onClick={() => decreaseUnit(index)}
                                        variant="secondary"
                                        size="sm"
                                        className="!p-2 rounded-full"
                                        disabled={updatingItems[item.name]}
                                    >
                                        <FaMinus />
                                    </Button>
                                    <Button
                                        onClick={() => increaseUnit(index)}
                                        variant="secondary"
                                        size="sm"
                                        className="!p-2 rounded-full"
                                        disabled={updatingItems[item.name]}
                                    >
                                        <FaPlus />
                                    </Button>
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
                            onChange={(e) => { setUsePrivilege(e.target.checked); if (e.target.checked) { setPayWithCash(false); } else { setPayWithCash(true); } }}
                            className="accent-red-500"
                        />
                        Use Privilege (Total will be free)
                    </label>
                )}

                <p className="text-lg font-semibold">Total: {totalPrice}tk</p>

                {user && user.role === 'teacher' && (
                    <div className="mt-3">
                        <label className="block text-sm mb-1">Table Number</label>
                        <input
                            type="text"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            placeholder="Enter table number"
                            className="input input-bordered w-full"
                        />
                    </div>
                )}

                <div className="mt-4">
                    <label className={`flex items-center gap-2 text-sm ${coinBalance <= 0 ? 'cursor-not-allowed' : ''}`}>
                        <input
                            type="checkbox"
                            checked={payWithCoins}
                            onChange={(e) => { setPayWithCoins(e.target.checked); if (e.target.checked) { setPayWithCash(false); } else { setPayWithCash(true); } }}
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
                    <label className="flex items-center gap-2 mt-2 text-sm">
                        <input
                            type="checkbox"
                            checked={payWithCash}
                            onChange={(e) => { setPayWithCash(e.target.checked); if (e.target.checked) { setPayWithCoins(false); setUsePrivilege(false); } }}
                            className="accent-red-500"
                        />
                        Pay with Cash
                    </label>
                </div>

                <Button
                    variant="primary"
                    fullWidth
                    className="mt-2"
                    onClick={placeOrder}
                    disabled={user && user.role === 'teacher' && (!tableNumber || tableNumber.trim() === '')}
                >
                    Place Order
                </Button>
            </div>
        </div>,
        document.body
    );
};

export default CartDrawer;

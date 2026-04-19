import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Spinner from '../../Shared/Spinner';

const Queue = () => {
    const [coinOrders, setCoinOrders] = useState([]);
    const [regularOrders, setRegularOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isUserPrivileged, setIsUserPrivileged] = useState(false);

    useEffect(() => {
        fetchQueue();
    }, []);

    useEffect(() => {
        if (selectedOrder) {
            fetchPrivilegedStatus(selectedOrder.userId);
        }
    }, [selectedOrder]);

    const fetchPrivilegedStatus = async (userId) => {
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/users/${userId}/privileged-status`);
            const data = await res.json();
            if (res.ok) {
                setIsUserPrivileged(data.privileged);
            } else {
                toast.error(data.message);
                setIsUserPrivileged(false);
            }
        } catch (err) {
            toast.error('Failed to fetch privileged status.');
            setIsUserPrivileged(false);
        }
    };

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const res = await fetch('https://central-cafetaria-server.vercel.app/latqueue');
            const data = await res.json();
            if (res.ok) {
                const allOrders = data.data || [];
                setCoinOrders(allOrders.filter(order => order.paidWithCoins));
                setRegularOrders(allOrders.filter(order => !order.paidWithCoins));
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error('Failed to fetch queue.');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            const res = await fetch(`https://central-cafetaria-server.vercel.app/order/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || `Order ${status}`);
                setSelectedOrder(null);
                fetchQueue(); // Refresh the list
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(`Failed to update order: ${err}`);
        }
    };

    const OrderCard = ({ order }) => (
        <div
            className="bg-white shadow-md border p-4 rounded cursor-pointer hover:shadow-lg transition relative"
            onClick={() => setSelectedOrder(order)}
        >
            <p className="text-lg font-bold text-red-600">Queue #{order.queueId}</p>
            <p className="text-sm text-gray-600">User ID: {order.userId}</p>

            {order.privilegeUsed && (
                <span className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                    Privileged
                </span>
            )}
            {order.paidWithCoins && (
                <span className={`absolute top-2 ${order.privilegeUsed ? 'right-24' : 'right-2'} text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold`}>
                    Paid with Coins
                </span>
            )}
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-center items-center gap-4 mb-8">
                <h2 className="text-3xl font-bold text-center">Current Queue</h2>
                <button
                    className="btn btn-sm btn-outline"
                    onClick={fetchQueue}
                    disabled={loading}
                >
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: loading ? 'block' : 'none' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span style={{ display: loading ? 'none' : 'block' }}>Refresh</span>
                </button>
            </div>

            {loading ? (
                <Spinner />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-2xl font-semibold mb-4 text-center border-b pb-2">Paid with Coins</h3>
                        {coinOrders.length === 0 ? (
                            <p className="text-center text-gray-500">No coin-paid orders.</p>
                        ) : (
                            <div className="space-y-4">
                                {coinOrders.map((order) => <OrderCard key={order._id} order={order} />)}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold mb-4 text-center border-b pb-2">To be Paid</h3>
                        {regularOrders.length === 0 ? (
                            <p className="text-center text-gray-500">No cash-paid orders.</p>
                        ) : (
                            <div className="space-y-4">
                                {regularOrders.map((order) => <OrderCard key={order._id} order={order} />)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <button
                            className="absolute top-3 right-4 text-2xl text-gray-600 hover:text-red-500"
                            onClick={() => setSelectedOrder(null)}
                        >
                            &times;
                        </button>
                        <h3 className="text-xl font-semibold mb-3 text-red-600">
                            Queue #{selectedOrder.queueId}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">User ID: {selectedOrder.userId}</p>

                        {isUserPrivileged && (
                            <p className="text-xs text-green-600 font-semibold mb-2">This is a privileged user.</p>
                        )}
                        {selectedOrder.paidWithCoins && (
                            <p className="text-xs text-blue-600 font-semibold mb-2">This order was paid with coins.</p>
                        )}


                        <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {selectedOrder.orderDetails.map((item, i) => (
                                <li key={i} className="border-b pb-2">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                        <div>
                                            <h4 className="font-semibold">{item.name}</h4>
                                            <p className="text-sm text-gray-600">Unit: {item.unit}</p>
                                            <p className="text-sm font-bold text-red-600">{item.price} tk</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4 text-right font-semibold">
                            Total:{" "}
                            <span className="text-red-600">
                                {selectedOrder.totalPrice ?? selectedOrder.orderDetails.reduce(
                                    (acc, item) => acc + Number(item.price) * item.unit,
                                    0
                                )} tk
                            </span>
                        </div>
                        {selectedOrder.paidWithCoins && (
                            <div className="mt-2 text-right font-semibold">
                                Paid in Coins:{" "}
                                <span className="text-blue-600">
                                    {selectedOrder.totalPrice / 5} coins
                                </span>
                            </div>
                        )}

                        <div className="mt-6 flex justify-between">
                            <button
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                                onClick={() => updateOrderStatus(selectedOrder._id, 'served')}
                            >
                                Mark as Served
                            </button>
                            <button
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                                onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
                            >
                                Cancel Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Queue;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../Authentication/AuthProvider';
import Spinner from '../Shared/Spinner';

const Queue = () => {
    const [queueData, setQueueData] = useState([]);
    const [originalQueue, setOriginalQueue] = useState([]);
    const [view, setView] = useState('original');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        fetchQueue();
    }, []);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const res = await fetch('https://central-cafetaria-server.vercel.app/latqueue');
            const data = await res.json();
            if (res.ok) {
                const dataWithSerial = (data.data || [])
                    .sort((a, b) => a.queueId - b.queueId)
                    .map((order, index) => ({
                        ...order,
                        serial: index + 1
                    }));
                setOriginalQueue(dataWithSerial);
                setQueueData(dataWithSerial);
                setView('original');
            } else {
                console.error(data.message);
            }
        } catch (err) {
            console.error('Queue fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewChange = (newView) => {
        setView(newView);
        if (newView === 'myOrdersTop') {
            const sortedData = [...originalQueue].sort((a, b) => {
                const aIsUser = a.userId === user?.id;
                const bIsUser = b.userId === user?.id;
                if (aIsUser && !bIsUser) {
                    return -1;
                }
                if (!aIsUser && bIsUser) {
                    return 1;
                }
                return a.serial - b.serial;
            });
            setQueueData(sortedData);
        } else {
            setQueueData(originalQueue);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Current Queue</h2>

            <div className="flex justify-center items-center gap-4 mb-6">
                <button
                    className={`btn btn-sm border-2 border-red-800 font-bold ${view === 'original' ? 'bg-red-600 text-white' : 'bg-none text-red-800'}`}
                    onClick={() => handleViewChange('original')}
                >
                    Original Queue
                </button>
                <button
                    className={`btn btn-sm border-2 border-red-800 font-bold ${view === 'myOrdersTop' ? 'bg-red-600 text-white' : 'bg-none text-red-800'}`}
                    onClick={() => handleViewChange('myOrdersTop')}
                >
                    My Orders Top
                </button>
            </div>

            {loading ? (
                <Spinner />
            ) : queueData.length === 0 ? (
                <p className="text-center">No orders in queue.</p>
            ) : (
                <div className="space-y-4">
                    {queueData.map((order) => {
                        const isCurrentUser = order?.userId === user?.id;
                        return (
                            <div
                                key={order._id}
                                className={`relative bg-white shadow-md border p-4 rounded cursor-pointer hover:shadow-lg transition ${isCurrentUser ? 'border-green-500 ring-2 ring-green-300' : ''
                                    }`}
                                onClick={() => setSelectedOrder(order)}
                            >
                                <p className="text-lg font-bold text-red-600">#{order.serial} - Queue #{order.queueId}</p>
                                <p className="text-sm text-gray-600">User ID: {order.userId}</p>

                                                            {isCurrentUser && (
                                                                <span className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                                                    Your Order
                                                                </span>
                                                            )}
                                                            {order.paidWithCoins && (
                                                                <span className={`absolute top-2 ${isCurrentUser ? 'right-24' : 'right-2'} text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold`}>
                                                                    Paid with Coins
                                                                </span>
                                                            )}                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {selectedOrder && (selectedOrder.userId === user.id) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <button
                            className="absolute top-2 right-3 text-2xl text-gray-600 hover:text-red-500"
                            onClick={() => setSelectedOrder(null)}
                        >
                            ×
                        </button>
                        <h3 className="text-xl font-semibold mb-3 text-red-600">
                            #{selectedOrder.serial} - Queue #{selectedOrder.queueId}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">User ID: {selectedOrder.userId}</p>

                        <ul className="space-y-3 max-h-60 overflow-y-auto">
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
                            {!selectedOrder.privilegeUsed ? (
                                selectedOrder.paidWithCoins ? (
                                    <span className="text-green-600">Paid with Coins</span>
                                ) : (
                                    <span className="text-red-600">
                                        {selectedOrder.orderDetails.reduce(
                                            (acc, item) => acc + Number(item.price) * item.unit,
                                            0
                                        )}{" "}
                                        tk
                                    </span>
                                )
                            ) : (
                                <span className="text-red-600">Payment Done</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Queue;


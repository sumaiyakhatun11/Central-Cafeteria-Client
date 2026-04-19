import React from 'react';
import { MdOutlineShoppingCart } from 'react-icons/md';
import { useLoaderData } from 'react-router-dom';

const Snacks = () => {
    const { snacksItems } = useLoaderData();

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Snacks Menu</h2>
            <div className="lg:grid hidden grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {snacksItems?.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x200?text=Food+Image';
                            }}
                        />
                        <div className="p-4">
                            <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-red-700">{item.price} tk</span>                                <span className="flex items-center">
                                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    {item.rating}
                                </span>
                            </div>
                            <p className="text-gray-600 mt-2">Unit: {item.unit}</p>
                            <button className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className='lg:hidden flex flex-col gap-5'>
                {snacksItems.map((item, index) => (
                    <div className='flex gap-5 shadow-sm hover:shadow-md p-3'>
                        <img
                            src={item.image}
                            className='w-16 h-12 rounded-full'
                            alt="" />
                        <div className='flex flex-1 justify-between items-center '>
                            <div className='flex justify-start items-end gap-2 flex-wrap'>
                                <h2 className='text-xl font-semibold'>{item.name}</h2>
                                <p className='text-red-700  font-bold'>{item.price}tk</p>
                            </div>
                            <div className='flex justify-center items-center p-2 bg-red-200 rounded-full'>
                                <MdOutlineShoppingCart className='text-2xl' />
                            </div>
                        </div>


                    </div>
                ))}

            </div>
        </div>
    );
};

export default Snacks;
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../Authentication/AuthProvider';

const Navbar = () => {
    const [itemsOpen, setItemsOpen] = useState(false);
    const [salesOpen, setSalesOpen] = useState(false);
    const { user } = useAuth();
    const linkClass = ({ isActive }) =>
        `cursor-pointer hover:border-b-2 border-white ${isActive ? 'border-b-2 border-white' : ''
        }`;

    return (
        <div className='sticky top-0 z-50'>
            <div className='grid grid-cols-8 bg-red-600  w-full py-3 px-5'>
                <div className='col-span-1 flex justify-center items-center'>
                    <img className=' w-16' src="https://i.ibb.co/C5FDf1dD/image.png" alt="" />
                </div>
                <div className='  col-span-7 flex justify-start items-center'>
                    <div className='w-full flex flex-col lg:flex-row lg:text-start text-end lg:justify-start justify-end lg:items-end items-end lg:gap-5'>
                        <h2 className='lg:text-4xl text-2xl text-white '>Central Cafetaria</h2>
                        <p className='lg:text-2xl  font-semibold '>Pabna University of Science and Technology</p>
                    </div>

                </div>


            </div>

        </div>
    );
};

export default Navbar; 
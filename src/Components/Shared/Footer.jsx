import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../Authentication/AuthProvider';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Coins, 
  CalendarCheck,
  LayoutDashboard
} from 'lucide-react';
import DevTeamModal from './DevTeamModal';

const Footer = () => {
    const { user, logout } = useAuth();
    const isAdmin = user && user.role === 'admin';
    const [isDevModalOpen, setIsDevModalOpen] = useState(false);

    const currentYear = new Date().getFullYear();

    const handleLogout = () => {
        logout();
    };

    return (
        <footer className="bg-slate-100 text-gray-300 pt-10 pb-6 border-t-4 border-red-700">
            <div className=" mx-auto px-8 lg:px-16">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                    
                    {/* Column 1: Brand & About */}
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <img className='w-12 md:w-14' src="https://i.ibb.co/C5FDf1dD/image.png" alt="Logo" />
                                <h2 className="text-xl md:text-2xl font-bold text-red-500 tracking-tight">
                                    Central <span className="">Cafeteria</span>
                                </h2>
                            </div>
                            <p className='text-lg  font-semibold text-gray-800'>Pabna University of Science and Technology</p>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-800">
                            Providing a seamless digital dining experience for the university community. From quick coin-based payments to large-scale event catering.
                        </p>
                        <div className="flex gap-4 pt-2 text-gray-800">
                            <a href="#" className="hover:text-red-500 transition-colors"><Facebook size={20} /></a>
                            <a href="#" className="hover:text-red-500 transition-colors"><Twitter size={20} /></a>
                            <a href="#" className="hover:text-red-500 transition-colors"><Instagram size={20} /></a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links (Role Based) */}
                    <div className='lg:pt-6'>
                        <h3 className="text-lg font-bold text-red-500 mb-6 flex items-center gap-2">
                            <LayoutDashboard size={20} className="text-red-500" />
                            {isAdmin ? 'Admin Dashboard' : 'Quick Navigation'}
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-700">
                            {isAdmin ? (
                                <>
                                    <li><NavLink to="/admin/queue" className="hover:text-red-400 hover:underline transition-colors">Order Queue</NavLink></li>
                                    <li><NavLink to="/admin/food-management" className="hover:text-red-400 hover:underline transition-colors">Manage Menu</NavLink></li>
                                    <li><NavLink to="/admin/accounts" className="hover:text-red-400 hover:underline transition-colors">User Accounts</NavLink></li>
                                    <li><NavLink to="/admin/sales" className="hover:text-red-400 hover:underline transition-colors">Sales Reports</NavLink></li>
                                    <li><NavLink to="/admin/events" className="hover:text-red-400 hover:underline transition-colors">Event Records</NavLink></li>
                                    <li><button onClick={handleLogout} className="hover:text-red-400 hover:underline transition-colors text-left w-full">Logout</button></li>
                                </>
                            ) : (
                                <>
                                    <li><NavLink to="/" className="hover:text-red-400 hover:underline transition-colors">Home / Menu</NavLink></li>
                                    <li><NavLink to="/queue" className="hover:text-red-400 hover:underline transition-colors">Live Queue</NavLink></li>
                                    {user && (
                                        <>
                                            <li><button onClick={() => window.scrollTo(0,0)} className="hover:text-red-400 hover:underline transition-colors">My Event History</button></li>
                                            <li><button onClick={() => window.scrollTo(0,0)} className="hover:text-red-400 hover:underline transition-colors">Coin Status</button></li>
                                            <li><button onClick={handleLogout} className="hover:text-red-400 hover:underline transition-colors text-left w-full">Logout</button></li>
                                        </>
                                    )}
                                    {!user && (
                                        <li><NavLink to="/login" className="hover:text-red-400 hover:underline transition-colors">Login / Register</NavLink></li>
                                    )}
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Column 3: Policies & Features */}
                    <div className='pt-6'>
                        <h3 className="text-lg font-bold text-red-500 mb-6 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-red-500" />
                            Policies
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Coins size={18} className="text-red-500 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Coin Economy</p>
                                    <p className="text-xs text-gray-700">1 Coin = 5 BDT. Non-refundable and transferable for food only.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CalendarCheck size={18} className="text-red-500 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Event Booking</p>
                                    <p className="text-xs text-gray-700">All bookings require admin verification and 48h notice.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <ShieldCheck size={18} className="text-red-500 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Privilege Access</p>
                                    <p className="text-xs text-gray-700">Staff & Faculty privilege is subject to identity verification.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 4: Contact & Support */}
                    <div className='pt-6 text-gray-600 text-wrap' >
                        <h3 className="text-lg font-bold text-red-500 mb-6 flex items-center gap-2">
                            <Phone size={20} className="text-red-500" />
                            Contact Support
                        </h3>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-center gap-3">
                                <MapPin size={18} className="text-red-500 flex-shrink-0" />
                                <span>Ground Floor, Central Cafeteria Main Hall</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-red-500 flex-shrink-0" />
                                <span className='break-all'>support.cafeteria@university.edu</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-red-500 flex-shrink-0" />
                                <span>+880 1234-567890</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col lg:flex-row justify-between items-start gap-4 text-xs text-gray-700">
                    <p>© {currentYear} Central Cafeteria Management System. All rights reserved.</p>
                    <div className="flex flex-col lg:flex-row gap-6">
                        <a href="#" className="hover:text-red-500 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-red-500 transition-colors">Terms of Service</a>
                        <p>Developed by <button onClick={() => setIsDevModalOpen(true)} className="text-red-500 font-semibold hover:underline">University Dev Team</button></p>
                    </div>
                </div>
            </div>
            <DevTeamModal isOpen={isDevModalOpen} onClose={() => setIsDevModalOpen(false)} />
        </footer>
    );
};

export default Footer;

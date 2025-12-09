import React, { useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Html5Qrcode } from 'html5-qrcode';
import CameraModal from './CameraModal'; // Make sure the path is correct

const Registration = () => {
    const [formData, setFormData] = useState({
        name: '',
        registrationNumber: '',
        email: '',
        id: '',
        password: '',
        confirmPassword: '',
        qrCodeString: '',
        idCardFrontUrl: '',
        idCardBackUrl: '',
        isSubmitting: false
    });

    const [errors, setErrors] = useState({});
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturingSide, setCapturingSide] = useState(null); // 'front' or 'back'

    // Refs for file inputs
    const frontIdRef = useRef(null);
    const backIdRef = useRef(null);

    const handleFileUpload = async (file, side) => {
        if (!file) return;

        const imgbbFormData = new FormData();
        imgbbFormData.append('image', file);
        
        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=2756beed15509d2f2a291d0710e71fab`, {
                method: 'POST',
                body: imgbbFormData
            });

            const data = await res.json();
            if (data.success) {
                const url = data.data.url;
                setFormData(prev => ({
                    ...prev,
                    [side === 'front' ? 'idCardFrontUrl' : 'idCardBackUrl']: url
                }));
                toast.success(`ID card (${side}) uploaded successfully!`);

                // Now, scan the file for a QR code
                const html5QrCode = new Html5Qrcode('qr-reader-placeholder', true);
                try {
                    const decodedText = await html5QrCode.scanFile(file, false);
                    setFormData(prev => ({
                        ...prev,
                        qrCodeString: decodedText
                    }));
                    toast.success('QR Code detected and saved!');
                } catch (err) {
                    console.log(`No QR code found in ${side} image.`);
                    // It's okay if no QR code is found, it's optional.
                }

            } else {
                throw new Error(data.error.message);
            }
        } catch (error) {
            console.error('Error in file handling process:', error);
            toast.error('An error occurred. Please try again later.');
        }
    };

    const onFileChange = (e, side) => {
        handleFileUpload(e.target.files[0], side);
    };

    const handleCapture = (blob) => {
        const file = new File([blob], `${capturingSide}-id-card.jpg`, { type: 'image/jpeg' });
        handleFileUpload(file, capturingSide);
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (formData.password !== formData.confirmPassword) {
            newErrors.password = "Passwords don't match!";
        }
        if (!formData.idCardFrontUrl || !formData.idCardBackUrl) {
            toast.error("Please provide images for both front and back of the ID card.");
            return;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setFormData(prev => ({ ...prev, isSubmitting: true }));

        try {
            const submissionData = { ...formData };
            delete submissionData.confirmPassword;
            delete submissionData.isSubmitting;

            const response = await fetch(`https://central-cafetaria-server.vercel.app/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            toast.success('Registration successful! Your account is awaiting verification.');
        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Registration failed. Please try again.');
        } finally {
            setFormData(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    return (
        <div className='w-full py-10 min-h-screen flex justify-center items-center relative overflow-hidden'>
            <div
                className='absolute inset-0 bg-cover opacity-50 bg-center filter blur-sm z-0'
                style={{ backgroundImage: `url(https://i.ibb.co/fzngpwS3/Whats-App-Image-2025-06-02-at-15-35-28-8e7f8eb2.jpg)` }}
            />
            <div className='absolute inset-0 bg-white/30 z-10'></div>
            <div id="qr-reader-placeholder" style={{ display: 'none' }}></div>
            
            <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCapture}
            />

            <div className='z-20 bg-white p-8 rounded-lg shadow-xl w-full lg:max-w-[500px]'>
                <form onSubmit={handleSubmit} className='flex flex-col items-center'>
                    <h2 className='text-3xl border-b-2 pb-2 px-5 border-gray-600 tinos-regular mb-6'>Register</h2>

                    {/* ID Card Front */}
                    <div className="mb-4 w-full">
                        <label className="block text-gray-700 font-bold mb-2">ID Card (Front)</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => frontIdRef.current.click()} className="btn btn-outline flex-1">Upload</button>
                            <button type="button" onClick={() => { setCapturingSide('front'); setIsCameraOpen(true); }} className="btn btn-outline flex-1">Capture</button>
                        </div>
                        <input type="file" ref={frontIdRef} accept="image/*" onChange={(e) => onFileChange(e, 'front')} className="hidden" />
                        {formData.idCardFrontUrl && <img src={formData.idCardFrontUrl} alt="ID Card Front Preview" className="w-full h-40 object-cover mt-2 rounded" />}
                    </div>

                    {/* ID Card Back */}
                    <div className="mb-4 w-full">
                        <label className="block text-gray-700 font-bold mb-2">ID Card (Back)</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => backIdRef.current.click()} className="btn btn-outline flex-1">Upload</button>
                            <button type="button" onClick={() => { setCapturingSide('back'); setIsCameraOpen(true); }} className="btn btn-outline flex-1">Capture</button>
                        </div>
                        <input type="file" ref={backIdRef} accept="image/*" onChange={(e) => onFileChange(e, 'back')} className="hidden" />
                        {formData.idCardBackUrl && <img src={formData.idCardBackUrl} alt="ID Card Back Preview" className="w-full h-40 object-cover mt-2 rounded" />}
                    </div>

                    <Input label="Name" type="text" name="name" value={formData.name} onChange={handleChange} />
                    <Input label="Registration No" type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} />
                    <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} />
                    <Input label="ID No" type="text" name="id" value={formData.id} onChange={handleChange} />
                    <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} error={errors.password} />
                    <Input label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />

                    <button type="submit" className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-10 text-lg tinos-regular transition-colors w-full my-4 disabled:opacity-50' disabled={formData.isSubmitting}>
                        {formData.isSubmitting ? 'Registering...' : 'Register'}
                    </button>

                    <div className='tinos-regular text-center'>
                        <p>Already have an account? <NavLink to="/login" className="text-blue-600 hover:underline">Sign in</NavLink></p>
                    </div>
                </form>
            </div>
            <ToastContainer />
        </div>
    );
};

// Reusable Input Field Component
const Input = ({ label, type, name, value, onChange, error }) => (
    <div className='flex flex-col justify-center items-start mb-4 w-full'>
        <label htmlFor={name} className='text-lg ml-3 tinos-regular'>{label}</label>
        <input
            name={name}
            value={value}
            onChange={onChange}
            type={type}
            className='border-2 text-lg w-full py-2 px-3 focus:outline-none focus:border-gray-700 rounded mt-1'
            required
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
);

export default Registration;

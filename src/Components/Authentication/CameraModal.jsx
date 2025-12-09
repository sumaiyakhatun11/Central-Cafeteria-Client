import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        if (isOpen) {
            const getMedia = async () => {
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                } catch (err) {
                    console.error("Error accessing camera:", err);
                    toast.error("Could not access the camera. Please check permissions and try again.");
                    onClose();
                }
            };
            getMedia();
        } else {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            canvas.toBlob(blob => {
                onCapture(blob);
                onClose();
            }, 'image/jpeg');
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-xl">
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md"></video>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                <div className="flex justify-center gap-4 mt-4">
                    <button onClick={handleCapture} className="btn btn-primary">Capture</button>
                    <button onClick={onClose} className="btn">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default CameraModal;

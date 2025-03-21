'use client'
import '@tabler/core/dist/css/tabler.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import React from 'react';
import { Poppins } from 'next/font/google';
import Sidebar from '../../sidebar';
import { IconSearch, IconBell, IconSettings, IconEdit } from '@tabler/icons-react';
import { Plus, Search, XCircle } from "lucide-react";

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    variable: '--font-poppins',
});

export default function ConceptCartoonForm() {
    const [formData, setFormData] = useState({
        heading: '',
        description: '',
        button_one_text: '',
        button_one_link: '',
        button_two_text: '',
        button_two_link: '',
        media_id: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e: { target: { files: any[]; }; }) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            // Create a preview URL for the selected image
            const fileReader = new FileReader();
            // fileReader.onload = () => {
            //     setPreviewUrl(fileReader.result);
            // };
            // fileReader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ text: '', type: '' });

        // Create FormData object for file upload
        const data = new FormData();
        
        // Append all form fields
        // Object.keys(formData).forEach(key => {
        //     if (key !== 'media_id') {
        //         data.append(key, formData[key]);
        //     }
        // });
        
        // Append file if selected
        if (selectedFile) {
            data.append('media', selectedFile);
        }

        try {
            const response = await fetch('/api/concept-cartoons', {
                method: 'POST',
                body: data,
                // Don't set Content-Type header when using FormData
                // It will be set automatically with proper boundary
            });

            const result = await response.json();
            
            if (response.ok) {
                setMessage({ text: 'Concept cartoon created successfully!', type: 'success' });
                // Reset form after successful submission
                setFormData({
                    heading: '',
                    description: '',
                    button_one_text: '',
                    button_one_link: '',
                    button_two_text: '',
                    button_two_link: '',
                    media_id: null
                });
                setSelectedFile(null);
                setPreviewUrl('');
            } else {
                setMessage({ text: result.error || 'Failed to create concept cartoon', type: 'error' });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setMessage({ text: 'An error occurred while submitting the form', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`page bg-light ${poppins.variable} font-sans`}>
            <Sidebar />
            <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                <header className="navbar navbar-expand-md navbar-light bg-white shadow-sm border-bottom mb-3">
                    <div className="container-fluid">
                        <div className="d-flex align-items-center w-full">
                            <span className='font-bold text-xl text-black'>LifeAppDashBoard</span>
                            <div className='w-5/6'></div>
                            <div className='d-flex gap-3 align-items-center'>
                                <a href="#" className="btn btn-light btn-icon"><IconSearch size={20} /></a>
                                <a href="#" className="btn btn-light btn-icon"><IconBell size={20} /></a>
                                <a href="#" className="btn btn-light btn-icon"><IconSettings size={20} /></a>
                            </div>
                        </div>
                    </div>
                </header>
                <div className="container-xl pt-0 pb-4">
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Create Concept Cartoon</h5>
                            
                            {message.text && (
                                <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mb-4`}>
                                    {message.text}
                                </div>
                            )}
                            
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="heading" className="form-label">Heading<span className="text-danger">*</span></label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        id="heading" 
                                        name="heading"
                                        placeholder="What is a concept cartoon?" 
                                        value={formData.heading}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Description<span className="text-danger">*</span></label>
                                    <textarea 
                                        className="form-control" 
                                        id="description" 
                                        name="description"
                                        placeholder="A concept cartoon is an instructional strategy used in science education..." 
                                        rows={5}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                    ></textarea>
                                </div>
                                
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label htmlFor="button_one_text" className="form-label">Button One Text<span className="text-danger">*</span></label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            id="button_one_text" 
                                            name="button_one_text"
                                            placeholder="Blog" 
                                            value={formData.button_one_text}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="button_one_link" className="form-label">Button One Link<span className="text-danger">*</span></label>
                                        <input 
                                            type="url" 
                                            className="form-control" 
                                            id="button_one_link" 
                                            name="button_one_link"
                                            placeholder="https://www.sciencelearn.org.nz/resources/2566-using-concept-cartoons" 
                                            value={formData.button_one_link}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label htmlFor="button_two_text" className="form-label">Button Two Text<span className="text-danger">*</span></label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            id="button_two_text" 
                                            name="button_two_text"
                                            placeholder="Video" 
                                            value={formData.button_two_text}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="button_two_link" className="form-label">Button Two Link<span className="text-danger">*</span></label>
                                        <input 
                                            type="url" 
                                            className="form-control" 
                                            id="button_two_link" 
                                            name="button_two_link"
                                            placeholder="https://www.youtube.com/watch?v=9GdZfpT6BVw" 
                                            value={formData.button_two_link}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <label htmlFor="media" className="form-label">Select Image</label>
                                    <input 
                                        type="file" 
                                        className="form-control" 
                                        id="media" 
                                        name="media"
                                        accept="image/*"
                                        // onChange={handleFileChange}
                                    />
                                    {previewUrl && (
                                        <div className="mt-2">
                                            <img 
                                                src={previewUrl} 
                                                alt="Selected image preview" 
                                                className="img-thumbnail" 
                                                style={{ maxHeight: '200px' }} 
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="d-flex justify-content-end">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
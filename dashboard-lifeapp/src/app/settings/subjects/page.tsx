'use client'
import { useState, useEffect } from 'react'
import React from 'react';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
import { Sidebar } from '@/components/ui/sidebar';
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaOptionsType } from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";
import '@tabler/core/dist/css/tabler.min.css';

interface Slide {
    id: number;
    title: string;
    heading: string;
    imageId: number;
    status: number;
}

interface RawSubject {
    id: number;
    title: string; // JSON string
    heading: string; // JSON string
    image: string; // JSON string
    status: string;
}

 const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
//const api_startpoint = 'http://127.0.0.1:5000'

export default function SettingsSubject() {
    const [totalSubjects, setTotalSubjects] = useState<Slide[]>([])
    const [loading, setLoading] = useState(true);
    async function fetchSubjectList() {
        try {
            setLoading(true);
            const res = await fetch(`${api_startpoint}/api/subjects_list`, {
                method: 'POST'
            });
            const data: RawSubject[] = await res.json();
    
            if (data && data.length > 0) {
                const processedSubjects: Slide[] = data.map(subject => {
                    const titleObj = JSON.parse(subject.title);
                    const headingObj = JSON.parse(subject.heading);
                    const imageObj = JSON.parse(subject.image);
                    const statusObj = subject.status;
                    
                    return {
                        id: subject.id,
                        title: titleObj.en,
                        heading: headingObj.en,
                        imageId: parseInt(imageObj.en),
                        status: parseInt(statusObj),
                    };
                });
    
                setTotalSubjects(processedSubjects);
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching subject list:', error);
            setLoading(false);
        }
    }
    
    // Call fetchSubjectList inside useEffect on component mount
    useEffect(() => {
        fetchSubjectList();
    }, []);
    

    // ```````````````````````````````Carousel controls``````````````````````````````````````````````````````
    const options: EmblaOptionsType = {
        align: "start",
        loop: true,
    };
    
    const [emblaRef, emblaApi] = useEmblaCarousel(options, [
        Autoplay({ delay: 6000, stopOnInteraction: false }),
    ]);
    
    const [selectedIndex, setSelectedIndex] = useState(0);
    
    useEffect(() => {
        if (!emblaApi) return;
    
        emblaApi.on("select", () => {
            setSelectedIndex(emblaApi.selectedScrollSnap());
        });
    }, [emblaApi]);
    //`````````````````````````````````````````````````````````````````````````````````````````````````````````````````


    const [showModal, setShowModal] = useState(false)
    const initialFormValues = {
        id: 0,
        title: "",
        heading: "",
        created_by: ""
    };
    const [formValues, setFormValues] = useState(initialFormValues);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState<Slide | null>(null)

    const [errorMessage, setErrorMessage] = useState('')


    const handleClear = () => {
        setFormValues(initialFormValues);
    };
    
    const closeModal = () => {
        setShowModal(false);
        setShowEditModal(false);
        setShowDeleteModal(false);
        setSelectedSubject(null);
        //setSelectedIndex(0);
        handleClear(); // Reset values when closing modal
    };
    // Handle form field changes in the modal
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormValues({
            ...formValues,
            [e.target.name]: e.target.value
        })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          setImageFile(e.target.files[0]);
        }
    };

    
    // Handle form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', formValues.title);
        formData.append('heading', formValues.heading);
        formData.append('created_by', formValues.created_by);
        
        if (imageFile) {
          formData.append('image', imageFile);
        }
      
        try {
          const res = await fetch(`${api_startpoint}/api/subjects_new`, {
            method: 'POST',
            body: formData, // No need for JSON headers, FormData handles it
          });
      
          if (res.ok) {
            setShowModal(false);
            setFormValues({ id: 0 ,title: '', heading: '', created_by: '' });
            setImageFile(null);
            await fetchSubjectList(); // 🔥 Call fetchSubjectList here
          } else {
            const errorData = await res.json();
            setErrorMessage(errorData.error || 'Error creating subject');
          }
        } catch (err) {
          setErrorMessage('Error connecting to API');
        }
    };
      

    // Modal component that slides in from the right
    const AddSubjectModal = () => (
        <div className="fixed top-0 right-0 h-full w-2/5 bg-white shadow-lg z-50 transform transition-transform duration-300"
            style={{ transform: showModal ? 'translateX(0)' : 'translateX(100%)' }}>
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Add New Subject</h2>
                <button onClick={closeModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div className="p-4">
                {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            placeholder='Enter a title'
                            value={formValues.title}
                            onChange={handleChange}
                            className="w-full border p-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Heading</label>
                        <input
                            type="text"
                            name="heading"
                            placeholder='Enter a Heading'
                            value={formValues.heading}
                            onChange={handleChange}
                            className="w-full border p-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Created By</label>
                        <select
                            name="created_by"
                            value={formValues.created_by}
                            onChange={handleChange}
                            className="w-full border p-2"
                            required
                        >
                            <option value="">Select role</option>
                            <option value="Admin">Admin</option>
                            <option value="Mentor">Mentor</option>
                            <option value="Teacher">Teacher</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Image ID</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full border p-2"
                            required
                        />

                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="btn btn-primary">Create Subject</button>
                    </div>
                </form>
            </div>
        </div>
    );



    // -----------------------
    // Edit Subject Handlers
    // -----------------------
    const handleEditClick = (subject: Slide) => {
        setSelectedSubject(subject);
        // Pre-populate the form with the selected subject’s data
        setFormValues({
            id: subject.id,
            title: subject.title,
            heading: subject.heading,
            created_by: '', // You may wish to pre-select role based on additional subject data
        });
        setImageFile(null);
        setShowEditModal(true);
    }

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedSubject) return;
        
        const formData = new FormData();
        formData.append("id", String(formValues.id)); // Convert number to string
        formData.append("title", formValues.title);
        formData.append("heading", formValues.heading);
        formData.append("created_by", formValues.created_by);

        if (imageFile) {
          formData.append('image', imageFile);
        }
      
        try {
          const res = await fetch(`${api_startpoint}/api/subjects/${selectedSubject.id}`, {
            method: 'PUT',
            body: formData,
          });
      
          if (res.ok) {
            setShowEditModal(false);
            setSelectedSubject(null);
            setFormValues({ id:0, title: '', heading: '', created_by: '' });
            setImageFile(null);
            await fetchSubjectList();
          } else {
            const errorData = await res.json();
            setErrorMessage(errorData.error || 'Error updating subject');
          }
        } catch (err) {
          setErrorMessage('Error connecting to API');
        }
    };

    
    // -----------------------
    // Delete Subject Handlers
    // -----------------------
    const handleDeleteClick = (subject: Slide) => {
        setSelectedSubject(subject);
        setShowDeleteModal(true);
    }

    const handleDeleteSubmit = async () => {
        if (!selectedSubject) return;
      
        try {
          // Assuming you have a DELETE endpoint, e.g., /api/subjects/<id>
          const res = await fetch(`${api_startpoint}/api/subjects/${selectedSubject.id}`, {
            method: 'DELETE',
          });
      
          if (res.ok) {
            setShowDeleteModal(false);
            setSelectedSubject(null);
            await fetchSubjectList();
          } else {
            const errorData = await res.json();
            setErrorMessage(errorData.error || 'Error deleting subject');
          }
        } catch (err) {
          setErrorMessage('Error connecting to API');
        }
    };


    // Edit Modal
    const EditSubjectModal = () => (
        <div className="fixed top-0 right-0 h-full w-2/5 bg-white shadow-lg z-50 transform transition-transform duration-300"
            style={{ transform: showEditModal ? 'translateX(0)' : 'translateX(100%)' }}>
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Edit Subject</h2>
                <button onClick={closeModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div className="p-4">
                {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                <form onSubmit={handleEditSubmit}>
                    <div className="mb-4">
                        <label className="block mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formValues.title}
                            onChange={handleChange}
                            className="w-full border p-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Heading</label>
                        <input
                            type="text"
                            name="heading"
                            value={formValues.heading}
                            onChange={handleChange}
                            className="w-full border p-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Created By</label>
                        <select
                            name="created_by"
                            value={formValues.created_by}
                            onChange={handleChange}
                            className="w-full border p-2"
                            required
                        >
                            <option value="">Select role</option>
                            <option value="Admin">Admin</option>
                            <option value="Mentor">Mentor</option>
                            <option value="Teacher">Teacher</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Image ID</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full border p-2"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setSelectedSubject(null); }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Update Subject</button>
                    </div>
                </form>
            </div>
        </div>
    );

    // Delete Modal
    const DeleteSubjectModal = () => (
        <div className="fixed top-0 right-0 h-full w-1/3 bg-white shadow-lg z-50 transform transition-transform duration-300"
            style={{ transform: showDeleteModal ? 'translateX(0)' : 'translateX(100%)' }}>
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Delete Subject</h2>
                <button onClick={closeModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div className="p-4">
                <p>Are you sure you want to delete the subject <strong>{selectedSubject?.title}</strong>?</p>
                <div className="flex justify-end gap-2 mt-4">
                    <button className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setSelectedSubject(null); }}>Cancel</button>
                    <button className="btn btn-danger" onClick={handleDeleteSubmit}>Delete</button>
                </div>
            </div>
        </div>
    );


    return (
        <div className={`page bg-body ${inter.className} font-sans`}>
            <Sidebar />

            {/* Main Content */}
            <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                <div className='page-body'>
                    <div className='container-xl pt-4 pb-4'>
                        {/* Tabler Card with Carousel */}
                        <div className="card col-md-3 col-sm-6 col-12">
                            <div className="card-header py-2">
                                <h3 className="card-title m-0" style={{ fontSize: '0.9rem' }}>Subjects</h3>
                            </div>
                            <div className="card-body p-2">
                                {/* Carousel Container */}
                                <div className="overflow-hidden rounded " ref={emblaRef}>
                                <div className="flex">
                                    {loading ? (
                                        <div className="flex justify-center items-center h-40 w-60 text-center">
                                            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-800"></div>
                                        </div>
                                    ) : (
                                        totalSubjects.map((slide) => (  // Removed extra `{}` around map
                                            <div key={slide.id} className="relative flex-[0_0_100%] min-w-0">
                                                <div className="card card-sm mx-2 shadow-none border">
                                                    {/* Edit & Delete Icons */}
                                                    <div className="absolute top-2 right-2 flex gap-2">
                                                        <button className="text-gray-600 hover:text-blue-600" onClick={() => handleEditClick(slide)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                                                <path d="M16 3l4 4l-11 11h-4v-4z"></path>
                                                                <path d="M12 19h4"></path>
                                                            </svg>
                                                        </button>
                                                        <button className="text-gray-600 hover:text-red-600" onClick={() => handleDeleteClick(slide)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                                                <path d="M4 7l16 0"></path>
                                                                <path d="M10 11l0 6"></path>
                                                                <path d="M14 11l0 6"></path>
                                                                <path d="M5 7l1 12a2 2 0 0 0 2 2l8 0a2 2 0 0 0 2 -2l1 -12"></path>
                                                                <path d="M9 7l0 -3l6 0l0 3"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="img-responsive img-responsive-16x9 card-img-top">
                                                        <img
                                                            src={`https://picsum.photos/id/${slide.imageId}/400/225`}
                                                            alt={slide.title}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    </div>
                                                    <div className="card-body p-3">
                                                        <h3 className="card-title mb-1">{slide.title}</h3>
                                                        <p className="text-muted text-sm">{slide.heading}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                    {/* Tabler-styled Pagination Dots */}
                                    <div className="d-flex justify-content-center gap-1 mt-3">
                                        {totalSubjects.map((_, index) => (
                                            <button
                                                key={index}
                                                className={`btn btn-icon btn-sm ${selectedIndex === index ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                onClick={() => emblaApi?.scrollTo(index)}
                                                aria-label={`Go to slide ${index + 1}`}
                                                style={{ width: '24px', height: '24px', padding: '0', borderRadius:'50px' }}
                                            >
                                                <span className="w-2 h-2 rounded-full"></span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                
                            </div>
                        </div>

                        {/* Add New Subject Button */}
                        <div className="text-center h-50 w-25 mt-3">
                            <button className="btn btn-primary" onClick={() => setShowModal(true)} >
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-plus" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                    <path d="M12 5l0 14"></path>
                                    <path d="M5 12l14 0"></path>
                                </svg>
                                Add New Subject
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal Overlay */}
            {showModal && <AddSubjectModal />}
            {showEditModal && <EditSubjectModal />}
            {showDeleteModal && <DeleteSubjectModal />}
        </div>
    );
}
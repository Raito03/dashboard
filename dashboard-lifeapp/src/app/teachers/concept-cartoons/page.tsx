'use client'
import '@tabler/core/dist/css/tabler.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react'
import React from 'react';
import { Poppins } from 'next/font/google';
import Sidebar from '../../sidebar';
import { IconSearch, IconBell, IconSettings } from '@tabler/icons-react';
import { IconEdit } from '@tabler/icons-react';
import {
  Plus,
  Search,
  XCircle,
} from "lucide-react";

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    variable: '--font-poppins',
});


interface CartoonData {
    la_subject: string;
    la_level_id: string;
    title: string;
    document: string;
    status: string;
    id?: number; // Adding ID for update operations
}

const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'

export default function conceptCartoons() {
    const [tableData, setTableData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const rowsPerPage = 50;
    const [isTableLoading, setIsTableLoading] = useState(false);
    const paginatedData = tableData.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    
    // State for the edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRow, setEditingRow] = useState<CartoonData | null>(null);
    
     // State for add modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCartoon, setNewCartoon] = useState<CartoonData>({
         la_subject: "",
         la_level_id: "",
         title: "",
         document: "",
         status: "Drafted"
    });

    const handleClear = () => {
        setSelectedStatus("");
        setSelectedSubject("");
        setTableData([]);
    };
    
    const handleSearch = async () => {
        const filters = {
            status: selectedStatus,
            subject: selectedSubject
        };
        
        setIsTableLoading(true);
    
        try {
            const res = await fetch(`${api_startpoint}/api/teacher_concept_cartoons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });
            
            if (!res.ok) {
                throw new Error(`API responded with status: ${res.status}`);
            }
            
            const data = await res.json();
            console.log("API response:", data);
            
            if (Array.isArray(data)) {
                setTableData(data);
            } else if (data && typeof data === 'object') {
                if (Object.keys(data).some(key => !isNaN(Number(key)))) {
                    const arrayData = Object.values(data);
                    setTableData(arrayData);
                } else {
                    console.error("API returned non-array data:", data);
                    setTableData([]);
                }
            } else {
                console.error("API returned non-array data:", data);
                setTableData([]);
            }
            
            setCurrentPage(0);
        } catch (error) {
            console.error("Search error:", error);
            setTableData([]);
        } finally {
            setIsTableLoading(false);
        }
    };
    
    // Handle opening the edit modal
    const handleEditClick = (row: CartoonData) => {
        setEditingRow(row);
        setShowEditModal(true);
    };
    
    // Handle closing the edit modal
    const handleCloseModal = () => {
        setShowEditModal(false);
        setEditingRow(null);
    };

    // Handle closing the add modal
    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setNewCartoon({
            la_subject: "",
            la_level_id: "",
            title: "",
            document: "",
            status: "Drafted"
        });
    };

    
    // Handle form changes for adding and editing
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, isEdit = false) => {
        const { name, value } = e.target;
        if (isEdit && editingRow) {
            setEditingRow({
                ...editingRow,
                [name]: value
            });
        } else {
            setNewCartoon({
                ...newCartoon,
                [name]: value
            });
        }
    };

    // Handle saving the updated data
    const handleSaveChanges = async () => {
        if (!editingRow) return;
        
        try {
            const res = await fetch(`${api_startpoint}/api/update_concept_cartoon`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingRow.id,
                    la_subject_id: editingRow.la_subject === 'Science' ? 1 : 2,
                    la_level_id: editingRow.la_level_id,
                    title: editingRow.title,
                    document: editingRow.document,
                    status: editingRow.status === 'Published' ? 1 : 0
                })
            });
            
            if (!res.ok) {
                throw new Error(`API responded with status: ${res.status}`);
            }
            
            // Update the local state to reflect the change
            const updatedTableData = tableData.map(row => {
                if (row.id === editingRow.id) {
                    return editingRow;
                }
                return row;
            });
            
            setTableData(updatedTableData);
            setShowEditModal(false);
            setEditingRow(null);
            
            // Re-fetch the data to ensure we have the latest from the server
            handleSearch();
            
        } catch (error) {
            console.error("Update error:", error);
            alert("Failed to update the concept cartoon. Please try again.");
        }
    };

    // Handle adding a new cartoon
    const handleAddCartoon = async () => {
        try {
            const res = await fetch(`${api_startpoint}/api/add_concept_cartoon`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    la_subject_id: newCartoon.la_subject === 'Science' ? 1 : 2,
                    la_level_id: newCartoon.la_level_id,
                    title: newCartoon.title,
                    document: newCartoon.document,
                    status: newCartoon.status === 'Published' ? 1 : 0
                })
            });

            if (!res.ok) {
                throw new Error(`API responded with status: ${res.status}`);
            }

            setShowAddModal(false);
            handleSearch(); // Refresh table
        } catch (error) {
            console.error("Add error:", error);
            alert("Failed to add the concept cartoon. Please try again.");
        }
    };
    
    return (
        <div className={`page bg-light ${poppins.variable} font-sans`}>
            <Sidebar />

            {/* Main Content */}
            <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                {/* Top Navigation */}
                <header className="navbar navbar-expand-md navbar-light bg-white shadow-sm border-bottom mb-3">
                    <div className="container-fluid">
                        <div className="d-flex align-items-center w-full">
                        <span className='font-bold text-xl text-black '>LifeAppDashBoard</span>
                        <div className='w-5/6 h-10'></div>
                        <div className="d-flex gap-3 align-items-center">
                            <a href="#" className="btn btn-light btn-icon">
                            <IconSearch size={20} className="text-muted"/>
                            </a>
                            <a href="#" className="btn btn-light btn-icon position-relative">
                            <IconBell size={20} className="text-muted"/>
                            <span className="badge bg-danger position-absolute top-0 end-0">3</span>
                            </a>
                            <a href="#" className="btn btn-light btn-icon">
                            <IconSettings size={20} className="text-muted"/>
                            </a>
                        </div>
                        </div>
                    </div>
                </header>
                <div className='container-xl pt-0 pb-4'>
                    <div className='card shadow-sm border-0 mb-4'>
                        <div className="card-body">
                            <h5 className="card-title mb-4">Search & Filter</h5>
                            <div className="row g-3">
                                <div className='col-12 col-md-6 col-lg-3'>
                                    <select className='form-select' value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                                        <option value=''>Select Subject</option>
                                        <option value='Science'>Science</option>
                                        <option value='Maths'>Maths</option>
                                    </select>
                                </div>
                                <div className='col-12 col-md-6 col-lg-3'>
                                    <select className='form-select' value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                                        <option value=''>Select Status</option>
                                        <option value='Published'>Published</option>
                                        <option value='Drafted'>Drafted</option>
                                    </select>
                                </div>
                                {/* Action Buttons */}
                                <div className="d-flex flex-row gap-2 mt-4">
                                    <button className="btn btn-success d-inline-flex align-items-center" 
                                    onClick={handleSearch}
                                    >
                                        <Search className="me-2" size={16} />
                                        Search
                                    </button>
                                    
                                    <button className="btn btn-warning d-inline-flex align-items-center text-dark" 
                                    onClick={handleClear}
                                    >
                                        <XCircle className="me-2" size={16} />
                                        Clear
                                    </button>
                                    <button className="btn btn-success d-inline-flex align-items-center" 
                                        onClick={() => setShowAddModal(true)}
                                        >
                                        <Plus className="me-2" size={16} />
                                        Add Concept Cartoon
                                    </button>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                   
                    <div className='card shadow-sm border-0 mt-2 '>
                        <div className="card-body overflow-x-scroll">
                            <h5 className="card-title mb-4">Results</h5>
                            {isTableLoading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-purple" role="status" style={{ width: "3rem", height: "3rem" }}>
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-3 text-muted">Loading data, please wait...</p>
                                </div>
                            ) : tableData.length === 0 ? (
                                <div className="text-center p-5">
                                    <div className="text-muted justify-items-center">
                                        <IconSearch size={48} className="mb-3 opacity-50 " />
                                        <p>No data to display. Please use the search filters above and click Search.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th>Level</th>
                                                <th>Title</th>
                                                <th>Document</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedData.map((row, index) => (
                                                <tr key={index}>
                                                    <td>{row.la_subject}</td>
                                                    <td>{row.la_level_id}</td>
                                                    <td>{row.title}</td>
                                                    <td>{row.document}</td>
                                                    <td>{row.status}</td>
                                                    <td>
                                                        <button 
                                                            className="btn btn-sm btn-info"
                                                            onClick={() => handleEditClick(row)}
                                                        >
                                                            <IconEdit size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    {/* Pagination Controls */}
                                    <div className="d-flex justify-content-between mt-3">
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                                            disabled={currentPage === 0}
                                        >
                                            Previous
                                        </button>
                                        <div className="d-flex align-items-center">
                                            <span className="mx-2">
                                                Page {currentPage + 1} of {Math.ceil(tableData.length / rowsPerPage) || 1}
                                            </span>
                                        </div>
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={() => setCurrentPage(prev => (prev + 1) * rowsPerPage < tableData.length ? prev + 1 : prev)}
                                            disabled={(currentPage + 1) * rowsPerPage >= tableData.length}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Add Modal */}
            {showAddModal && (
                <div className="modal show d-block" tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Concept Cartoon</h5>
                                <button type="button" className="btn-close" onClick={handleCloseAddModal}></button>
                            </div>
                            <div className="modal-body">
                                <form>
                                    <div className="mb-3">
                                        <label className="form-label">Subject</label>
                                        <select className="form-select" name="la_subject" value={newCartoon.la_subject} onChange={(e) => handleFormChange(e)}>
                                            <option value="">Select Subject</option>
                                            <option value="Science">Science</option>
                                            <option value="Maths">Maths</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Level</label>
                                        <input type="text" className="form-control" name="la_level_id" value={newCartoon.la_level_id} onChange={(e) => handleFormChange(e)} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Title</label>
                                        <input type="text" className="form-control" name="title" value={newCartoon.title} onChange={(e) => handleFormChange(e)} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Document</label>
                                        <textarea className="form-control" name="document" rows={4} value={newCartoon.document} onChange={(e) => handleFormChange(e)}></textarea>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseAddModal}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleAddCartoon}>Add Cartoon</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Modal */}
            {showEditModal && editingRow && (
                <div className="modal show d-block" tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Concept Cartoon</h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <div className="modal-body">
                                <form>
                                    <div className="mb-3">
                                        <label htmlFor="la_subject" className="form-label">Subject</label>
                                        <select
                                            className="form-select"
                                            id="la_subject"
                                            name="la_subject"
                                            value={editingRow.la_subject}
                                            onChange={handleFormChange}
                                        >
                                            <option value="Science">Science</option>
                                            <option value="Maths">Maths</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="la_level_id" className="form-label">Level</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="la_level_id"
                                            name="la_level_id"
                                            value={editingRow.la_level_id}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="title" className="form-label">Title</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="title"
                                            name="title"
                                            value={editingRow.title}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="document" className="form-label">Document</label>
                                        <textarea
                                            className="form-control"
                                            id="document"
                                            name="document"
                                            rows={4}
                                            value={editingRow.document}
                                            onChange={handleFormChange}
                                        ></textarea>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="status" className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            id="status"
                                            name="status"
                                            value={editingRow.status}
                                            onChange={handleFormChange}
                                        >
                                            <option value="Published">Published</option>
                                            <option value="Drafted">Drafted</option>
                                        </select>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleSaveChanges}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

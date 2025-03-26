'use client'
import '@tabler/core/dist/css/tabler.min.css';
// import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import React from 'react';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
import { Sidebar } from '@/components/ui/sidebar';
import { IconSearch, IconBell, IconSettings, IconEdit } from '@tabler/icons-react';
import { Plus, Search, XCircle } from "lucide-react";

// const poppins = Poppins({
//   subsets: ['latin'],
//   weight: ['400', '600', '700'],
//   variable: '--font-poppins',
// });

interface LessonPlan {
  id?: number;
  language: string;  // e.g. "English"
  type: string;      // e.g. "Life Lab - Demo Models"
  title: string;
  document: string;
  status: string;    // "Published" or "Drafted"
}

interface Language {
  id: number;
  name: string;
}

// Map of type labels to numeric TINYINT values:
const TYPE_OPTIONS = [
  { label: 'Life Lab - Demo Models', value: 1 },
  { label: 'Jigyasa - Self DIY Activities', value: 2 },
  { label: 'Pragya - DIY Activities With Life Lab KITS', value: 3 },
  { label: 'Life Lab - Activities Lesson Plans', value: 4 },
  { label: 'Default type (None Mentioned)', value: 0 },
];

// Helper: convert the textual type (as returned by the API) to the numeric TINYINT
function labelToTypeValue(label: string): number {
  const found = TYPE_OPTIONS.find(opt => opt.label === label);
  return found ? found.value : 0;
}

const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'

export default function LessonPlans() {
    const [tableData, setTableData] = useState<LessonPlan[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedTitle, setSelectedTitle] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(0);
    const rowsPerPage = 50;
    const [isTableLoading, setIsTableLoading] = useState(false);
    const paginatedData = tableData.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

    // Modal States
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRow, setEditingRow] = useState<LessonPlan | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newLessonPlan, setNewLessonPlan] = useState<LessonPlan>({
        language: '',
        type: 'Default type (None Mentioned)',
        title: '',
        document: '',
        status: 'Drafted'
    });

    // A fallback mapping if needed (if your languages array is empty)
    const languageMap: Record<string, number> = {
        "English": 1,
        "Hindi": 2,
        "Tamil": 3,
        "Marathi": 4,
        "Telugu": 5,
        "Kannada": 6,
        "Malayalam": 7,
        "Odiya": 8,
        "Gujarati": 9,
    };

    // Fetch available languages
    async function fetchLanguages() {
        try {
        const res = await fetch(`${api_startpoint}/api/lesson_plan_languages_2`);
        const data: Language[] = await res.json();
        setLanguages(data);
        } catch (error) {
        console.error("Error fetching languages:", error);
        }
    }
    // Search lesson plans
    async function handleSearch() {
        const filters = { language: selectedLanguage, status: selectedStatus, title: selectedTitle };
        setIsTableLoading(true);

        try {
        const res = await fetch(`${api_startpoint}/api/lesson_plans_search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters)
        });
        const data = await res.json();
        setTableData(Array.isArray(data) ? data : []);
        setCurrentPage(0);
        } catch (error) {
        console.error("Search error:", error);
        setTableData([]);
        } finally {
        setIsTableLoading(false);
        }
    }

    // Clear search filters
    const handleClear = () => {
        setSelectedLanguage("");
        setSelectedStatus("");
        setSelectedTitle("");
        setTableData([]);
    }

    // Open edit modal
    function handleEditClick(row: LessonPlan) {
        // Clone the row data into editing state
        setEditingRow({ ...row });
        setShowEditModal(true);
    }

    // Save changes to an existing Lesson Plan
    async function handleSaveChanges() {
        if (!editingRow || !editingRow.id) return;

        // Convert the textual type to numeric TINYINT
        const numericType = labelToTypeValue(editingRow.type);

        // Convert status to numeric TINYINT
        const numericStatus = editingRow.status === "Published" ? 1 : 0;

        // Find the language ID from the languages array
        const languageObj = languages.find(lang => lang.name === editingRow.language);
        const languageId = languageObj ? languageObj.id : 1; // fallback to 1 if not found

        const payload = {
        id: editingRow.id,
        la_lesson_plan_language_id: languageId,
        title: editingRow.title,
        document: editingRow.document || "",
        type: numericType,
        status: numericStatus,
        };

        try {
        await fetch(`${api_startpoint}/api/update_lesson_plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        setShowEditModal(false);
        handleSearch(); // Refresh table
        } catch (error) {
        console.error("Update error:", error);
        }
    }

    // Add a new Lesson Plan
    async function handleAddLessonPlan() {
        // Convert the textual type to numeric
        const numericType = labelToTypeValue(newLessonPlan.type);
        // Convert status to numeric
        const numericStatus = newLessonPlan.status === "Published" ? 1 : 0;

        // Find the language ID from the languages array
        const languageObj = languages.find(lang => lang.name === newLessonPlan.language);
        const languageId = languageObj ? languageObj.id : 1;

        const payload = {
        la_lesson_plan_language_id: languageId,
        title: newLessonPlan.title,
        document: newLessonPlan.document || "",
        type: numericType,
        status: numericStatus
        };

        try {
        await fetch(`${api_startpoint}/api/add_lesson_plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        setShowAddModal(false);
        // Reset the form
        setNewLessonPlan({
            language: '',
            type: 'Default type (None Mentioned)',
            title: '',
            document: '',
            status: 'Drafted'
        });
        handleSearch();
        } catch (error) {
        console.error("Add error:", error);
        }
    }

    useEffect(() => {
        fetchLanguages();
    }, []);

    return (
        <div className={`page bg-light ${inter.className} font-sans`}>
            <Sidebar />
            <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                {/* <header className="navbar navbar-expand-md navbar-light bg-white shadow-sm border-bottom mb-3">
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
                </header> */}
                <div className="page-body">
                    <div className="container-xl pt-0 pb-4">
                        <div className="card shadow-sm border-0 mb-4">
                            <div className="card-body">
                                <h5 className="card-title mb-4">Lesson Plans</h5>
                                <div className="row g-3">
                                    {/* Language Dropdown */}
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <select 
                                            className="form-select" 
                                            value={selectedLanguage} 
                                            onChange={(e) => setSelectedLanguage(e.target.value)}
                                        >
                                            <option value="">Select Language</option>
                                            {languages.map((lang) => (
                                                <option key={lang.id} value={lang.name}>{lang.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Status Dropdown */}
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <select 
                                            className="form-select" 
                                            value={selectedStatus} 
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            <option value="">Select Status</option>
                                            <option value="Published">Published</option>
                                            <option value="Drafted">Drafted</option>
                                        </select>
                                    </div>
                                    {/* Title Search */}
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Search with Title" 
                                            value={selectedTitle}
                                            onChange={(e) => setSelectedTitle(e.target.value)}
                                        />
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="col-12 col-md-6 col-lg-3 d-flex gap-2">
                                        <button className="btn btn-success d-inline-flex align-items-center" onClick={handleSearch}>
                                            <Search className="me-2" size={16} /> Search
                                        </button>
                                        <button className="btn btn-warning d-inline-flex align-items-center text-dark" onClick={handleClear}>
                                            <XCircle className="me-2" size={16} /> Clear
                                        </button>
                                        
                                    </div>
                                    <div className=''>
                                        <button className="btn btn-success" onClick={() => setShowAddModal(true)}>
                                            <Plus size={16} className="me-2" /> Add Lesson Plan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lesson Plans Table */}
                        <div className="card shadow-sm border-0 mt-2 mb-4">
                            <div className="card-body overflow-x-scroll">
                                <h5 className="card-title ml-2 mb-0">Results- {tableData.length} rows found</h5>
                                {isTableLoading ? (
                                    <div className="text-center p-5">
                                        <div className="spinner-border text-purple" role="status" style={{ width: "3rem", height: "3rem" }}>
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3 text-muted">Loading data, please wait...</p>
                                    </div>
                                ) : (
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Language</th>
                                                <th>Type</th>
                                                <th>Title</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {paginatedData.length > 0 ? (
                                            paginatedData.map((row, index) => (
                                                <tr key={row.id ? `lesson-plan-${row.id}` : `lesson-plan-${index}-${row.title}`}>
                                                <td>{row.language}</td>
                                                <td>{row.type}</td>
                                                <td>{row.title}</td>
                                                <td>{row.status}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-info" onClick={() => handleEditClick(row)}>
                                                    <IconEdit size={16} />
                                                    </button>
                                                </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="text-center">No data found. Please use the Search Filter properly</td>
                                            </tr>
                                            )}
                                        </tbody>
                                        </table>
                                    )}
                                {/* Add this pagination component just after your table, before closing the card-body div */}
                                {paginatedData.length > 0 && (
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <div>
                                        <span className="text-muted">
                                        Showing {currentPage * rowsPerPage + 1} to {Math.min((currentPage + 1) * rowsPerPage, tableData.length)} of {tableData.length} entries
                                        </span>
                                    </div>
                                    <div className="btn-group">
                                        <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                        disabled={currentPage === 0}
                                        >
                                        Previous
                                        </button>
                                        {[...Array(Math.ceil(tableData.length / rowsPerPage)).keys()]
                                        .map(page => (
                                            <button
                                            key={page}
                                            className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => setCurrentPage(page)}
                                            >
                                            {page + 1}
                                            </button>
                                        ))
                                        .slice(
                                            Math.max(0, currentPage - 2),
                                            Math.min(Math.ceil(tableData.length / rowsPerPage), currentPage + 3)
                                        )
                                        }
                                        <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(tableData.length / rowsPerPage) - 1, prev + 1))}
                                        disabled={currentPage >= Math.ceil(tableData.length / rowsPerPage) - 1}
                                        >
                                        Next
                                        </button>
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && editingRow && (
                <div className="modal show d-block" tabIndex={-1} role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Lesson Plan</h5>
                        <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                        <label className="form-label">Language</label>
                        <select
                            className="form-select"
                            value={editingRow.language || ''}
                            onChange={(e) => setEditingRow({ ...editingRow, language: e.target.value })}
                        >
                            <option value="">Select Language</option>
                            {languages.map((lang) => (
                            <option key={lang.id} value={lang.name}>{lang.name}</option>
                            ))}
                        </select>
                        </div>
                        <div className="mb-3">
                        <label className="form-label">Type</label>
                        <select
                            className="form-select"
                            value={editingRow.type || 'Default type (None Mentioned)'}
                            onChange={(e) => setEditingRow({ ...editingRow, type: e.target.value })}
                        >
                            {TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.label}>
                                {option.label}
                            </option>
                            ))}
                        </select>
                        </div>
                        <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                            type="text"
                            className="form-control"
                            value={editingRow.title || ''}
                            onChange={(e) => setEditingRow({ ...editingRow, title: e.target.value })}
                        />
                        </div>
                        <div className="mb-3">
                        <label className="form-label">Document</label>
                        <textarea
                            className="form-control"
                            value={editingRow.document || ''}
                            onChange={(e) => setEditingRow({ ...editingRow, document: e.target.value })}
                        />
                        </div>
                        <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={editingRow.status || ''}
                            onChange={(e) => setEditingRow({ ...editingRow, status: e.target.value })}
                        >
                            <option value="Published">Published</option>
                            <option value="Drafted">Drafted</option>
                        </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Close</button>
                        <button type="button" className="btn btn-primary" onClick={handleSaveChanges}>Save changes</button>
                    </div>
                    </div>
                </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal show d-block" tabIndex={-1} role="dialog">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Add New Lesson Plan</h5>
                        <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                        <label className="form-label">Language</label>
                        <select
                            className="form-select"
                            value={newLessonPlan.language}
                            onChange={(e) => setNewLessonPlan({ ...newLessonPlan, language: e.target.value })}
                        >
                            <option value="">Select Language</option>
                            {languages.map((lang) => (
                            <option key={lang.id} value={lang.name}>{lang.name}</option>
                            ))}
                        </select>
                        </div>
                        <div className="mb-3">
                        <label className="form-label">Type</label>
                        <select
                            className="form-select"
                            value={newLessonPlan.type}
                            onChange={(e) => setNewLessonPlan({ ...newLessonPlan, type: e.target.value })}
                        >
                            {TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.label}>
                                {option.label}
                            </option>
                            ))}
                        </select>
                        </div>
                        <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                            type="text"
                            className="form-control"
                            value={newLessonPlan.title}
                            onChange={(e) => setNewLessonPlan({ ...newLessonPlan, title: e.target.value })}
                        />
                        </div>
                        <div className="mb-3">
                        <label className="form-label">Document</label>
                        <textarea
                            className="form-control"
                            value={newLessonPlan.document}
                            onChange={(e) => setNewLessonPlan({ ...newLessonPlan, document: e.target.value })}
                        />
                        </div>
                        <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={newLessonPlan.status}
                            onChange={(e) => setNewLessonPlan({ ...newLessonPlan, status: e.target.value })}
                        >
                            <option value="Published">Published</option>
                            <option value="Drafted">Drafted</option>
                        </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Close</button>
                        <button type="button" className="btn btn-primary" onClick={handleAddLessonPlan}>Add Lesson Plan</button>
                    </div>
                    </div>
                </div>
                </div>
            )}
            
        </div>
        
    );
}

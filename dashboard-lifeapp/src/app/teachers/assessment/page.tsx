'use client'
import '@tabler/core/dist/css/tabler.min.css';
// import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
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

interface Assessment {
  id?: number;
  subject: string;   // "Science" or "Maths"
  grade: number;
  title: string;
  document: string;
  status: string;    // "Published" or "Drafted"
}

// const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
const api_startpoint = 'http://152.42.239.141:5000'
export default function TeacherAssessment() {
  // State for table data and pagination
  const [tableData, setTableData] = useState<Assessment[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const rowsPerPage = 50;
  const paginatedData = tableData.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);

  // Filter states
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterGrade, setFilterGrade] = useState<string>("");
  const [filterTitle, setFilterTitle] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Modal states for Add and Edit
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [newAssessment, setNewAssessment] = useState<Assessment>({
    subject: "",
    grade: 1,
    title: "",
    document: "",
    status: "Drafted"
  });
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);

  // Function to fetch assessments based on filters
  async function handleSearch() {
    const filters = {
      subject: filterSubject,
      grade: filterGrade,
      title: filterTitle,
      status: filterStatus
    };
    setIsTableLoading(true);
    try {
      const res = await fetch(`${api_startpoint}/api/assessments_search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      const data = await res.json();
      setTableData(Array.isArray(data) ? data : []);
      setCurrentPage(0);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      setTableData([]);
    } finally {
      setIsTableLoading(false);
    }
  }

  // Function to clear filters
  function handleClear() {
    setFilterSubject("");
    setFilterGrade("");
    setFilterTitle("");
    setFilterStatus("");
    setTableData([]);
  }

  // Function to open edit modal with selected assessment data
  function handleEditClick(assessment: Assessment) {
    setEditingAssessment({ ...assessment });
    setShowEditModal(true);
  }

  // Function to save changes for an existing assessment
  async function handleSaveChanges() {
    if (!editingAssessment || !editingAssessment.id) return;
    const payload = {
      id: editingAssessment.id,
      subject: editingAssessment.subject,
      grade: editingAssessment.grade,
      title: editingAssessment.title,
      document: editingAssessment.document,
      status: editingAssessment.status
    };
    try {
      await fetch(`${api_startpoint}/api/update_assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setShowEditModal(false);
      handleSearch();
    } catch (error) {
      console.error("Error updating assessment:", error);
    }
  }

  // Function to add a new assessment
  async function handleAddAssessment() {
    const payload = {
      subject: newAssessment.subject,
      grade: newAssessment.grade,
      title: newAssessment.title,
      document: newAssessment.document,
      status: newAssessment.status
    };
    try {
      await fetch(`${api_startpoint}/api/add_assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setShowAddModal(false);
      setNewAssessment({ subject: "", grade: 1, title: "", document: "", status: "Drafted" });
      handleSearch();
    } catch (error) {
      console.error("Error adding assessment:", error);
    }
  }

  // Optionally, load data on mount
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className={`page bg-light ${inter.className} font-sans`}>
      <Sidebar />

      {/* Main Content */}
      <div className="page-wrapper" style={{ marginLeft: '250px' }}>
        {/* Top Navigation */}
        {/* <header className="navbar navbar-expand-md navbar-light bg-white shadow-sm border-bottom mb-3">
          <div className="container-fluid">
            <div className="d-flex align-items-center w-full">
              <span className="font-bold text-xl text-black">LifeAppDashBoard</span>
              <div className="w-5/6 h-10"></div>
              <div className="d-flex gap-3 align-items-center">
                <a href="#" className="btn btn-light btn-icon">
                  <IconSearch size={20} className="text-muted" />
                </a>
                <a href="#" className="btn btn-light btn-icon position-relative">
                  <IconBell size={20} className="text-muted" />
                  <span className="badge bg-danger position-absolute top-0 end-0">3</span>
                </a>
                <a href="#" className="btn btn-light btn-icon">
                  <IconSettings size={20} className="text-muted" />
                </a>
              </div>
            </div>
          </div>
        </header> */}
        <div className='page-body'>
          <div className="container-xl pt-0 pb-4">
            {/* Search & Filter Section */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4">Assessment</h5>
                <div className="row g-3">
                  <div className="col-12 col-md-6 col-lg-3">
                    <select
                      className="form-select"
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                    >
                      <option value="">Select Subject</option>
                      <option value="Science">Science</option>
                      <option value="Maths">Maths</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6 col-lg-2">
                    <select
                      className="form-select"
                      value={filterGrade}
                      onChange={(e) => setFilterGrade(e.target.value)}
                    >
                      <option value="">Select Grade</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by Title"
                      value={filterTitle}
                      onChange={(e) => setFilterTitle(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-6 col-lg-2">
                    <select
                      className="form-select"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">Select Status</option>
                      <option value="Published">Published</option>
                      <option value="Drafted">Drafted</option>
                    </select>
                  </div>
                  
                </div>
                <div className="col-12 col-lg-2 d-flex gap-2 mt-4">
                    <button className="btn btn-success d-inline-flex align-items-center" onClick={handleSearch}>
                      <Search className="me-2" size={16} /> Search
                    </button>
                    <button className="btn btn-warning d-inline-flex align-items-center text-dark" onClick={handleClear}>
                      <XCircle className="me-2" size={16} /> Clear
                    </button>
                    <button className="btn btn-success d-inline-flex align-items-center" onClick={() => setShowAddModal(true)}>
                      <Plus className="me-2" size={16} /> Add
                    </button>
                  </div>
              </div>
            </div>

            {/* Assessments Table */}
            <div className="card shadow-sm border-0 mt-2">
              <div className="card-body overflow-x-scroll">
                <h5 className="card-title mb-4">Results- {tableData.length} Assessments found</h5>
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
                      <IconSearch size={48} className="mb-3 opacity-50" />
                      <p>No data to display. Please use the search filters above and click Search.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Grade</th>
                          <th>Title</th>
                          <th>Document</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((row, index) => (
                          <tr key={row.id || index}>
                            <td>{row.subject}</td>
                            <td>{row.grade}</td>
                            <td>{row.title}</td>
                            <td>{row.document}</td>
                            <td>{row.status}</td>
                            <td>
                              <button className="btn btn-sm btn-info" onClick={() => handleEditClick(row)}>
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
      </div>

      {/* -------------------- Edit Assessment Modal -------------------- */}
      {showEditModal && editingAssessment && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Assessment</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-select"
                    value={editingAssessment.subject}
                    onChange={(e) => setEditingAssessment({ ...editingAssessment, subject: e.target.value })}
                  >
                    <option value="">Select Subject</option>
                    <option value="Science">Science</option>
                    <option value="Maths">Maths</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Grade</label>
                  <select
                    className="form-select"
                    value={editingAssessment.grade}
                    onChange={(e) => setEditingAssessment({ ...editingAssessment, grade: Number(e.target.value) })}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingAssessment.title}
                    onChange={(e) => setEditingAssessment({ ...editingAssessment, title: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Document</label>
                  <textarea
                    className="form-control"
                    value={editingAssessment.document}
                    onChange={(e) => setEditingAssessment({ ...editingAssessment, document: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editingAssessment.status}
                    onChange={(e) => setEditingAssessment({ ...editingAssessment, status: e.target.value })}
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

      {/* -------------------- Add Assessment Modal -------------------- */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Assessment</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-select"
                    value={newAssessment.subject}
                    onChange={(e) => setNewAssessment({ ...newAssessment, subject: e.target.value })}
                  >
                    <option value="">Select Subject</option>
                    <option value="Science">Science</option>
                    <option value="Maths">Maths</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Grade</label>
                  <select
                    className="form-select"
                    value={newAssessment.grade}
                    onChange={(e) => setNewAssessment({ ...newAssessment, grade: Number(e.target.value) })}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newAssessment.title}
                    onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Document</label>
                  <textarea
                    className="form-control"
                    value={newAssessment.document}
                    onChange={(e) => setNewAssessment({ ...newAssessment, document: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={newAssessment.status}
                    onChange={(e) => setNewAssessment({ ...newAssessment, status: e.target.value })}
                  >
                    <option value="Published">Published</option>
                    <option value="Drafted">Drafted</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={handleAddAssessment}>Add Assessment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

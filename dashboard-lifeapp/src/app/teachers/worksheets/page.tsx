'use client'
import '@tabler/core/dist/css/tabler.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
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

interface Worksheet {
  id?: number;
  subject: string;   // "Science" or "Maths"
  grade: number;     // 1..12
  title: string;
  document: string;
  status: string;    // "Published" or "Drafted"
}

const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'

export default function TeacherWorkSheets() {
  // Table & filter states
  const [tableData, setTableData] = useState<Worksheet[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const rowsPerPage = 50;
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
  const paginatedData = tableData.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Modal states for adding & editing worksheets
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [newWorksheet, setNewWorksheet] = useState<Worksheet>({
    subject: '',
    grade: 1,
    title: '',
    document: '',
    status: 'Drafted'
  });
  const [editingWorksheet, setEditingWorksheet] = useState<Worksheet | null>(null);

  // Handler: Search Worksheets
  async function handleSearch() {
    const filters = {
      subject: selectedSubject,
      status: selectedStatus
    };
    setIsTableLoading(true);
    try {
      const res = await fetch(`${api_startpoint}/api/work_sheets_search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      const data = await res.json();
      setTableData(Array.isArray(data) ? data : []);
      setCurrentPage(0);
    } catch (error) {
      console.error("Worksheet search error:", error);
      setTableData([]);
    } finally {
      setIsTableLoading(false);
    }
  }

  // Handler: Clear filters and table data
  function handleClear() {
    setSelectedSubject("");
    setSelectedStatus("");
    setTableData([]);
  }

  // Handler: Open edit modal and set worksheet data to edit
  function handleEditClick(ws: Worksheet) {
    setEditingWorksheet({ ...ws });
    setShowEditModal(true);
  }

  // Handler: Save changes to an existing worksheet
  async function handleSaveChanges() {
    if (!editingWorksheet || !editingWorksheet.id) return;

    const payload = {
      id: editingWorksheet.id,
      subject: editingWorksheet.subject,
      grade: editingWorksheet.grade,
      title: editingWorksheet.title,
      document: editingWorksheet.document,
      status: editingWorksheet.status,
    };

    try {
      await fetch(`${api_startpoint}/api/update_work_sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setShowEditModal(false);
      handleSearch(); // refresh table after update
    } catch (error) {
      console.error("Update Worksheet error:", error);
    }
  }

  // Handler: Add a new worksheet
  async function handleAddWorksheet() {
    const payload = {
      subject: newWorksheet.subject,
      grade: newWorksheet.grade,
      title: newWorksheet.title,
      document: newWorksheet.document,
      status: newWorksheet.status,
    };

    try {
      await fetch(`${api_startpoint}/api/add_work_sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setShowAddModal(false);
      // Reset form
      setNewWorksheet({
        subject: '',
        grade: 1,
        title: '',
        document: '',
        status: 'Drafted'
      });
      handleSearch(); // refresh table after adding
    } catch (error) {
      console.error("Add Worksheet error:", error);
    }
  }

  return (
    <div className={`page bg-light ${poppins.variable} font-sans`}>
      <Sidebar />

      {/* Main Content */}
      <div className="page-wrapper" style={{ marginLeft: '250px' }}>
        {/* Top Navigation */}
        <header className="navbar navbar-expand-md navbar-light bg-white shadow-sm border-bottom mb-3">
          <div className="container-fluid">
            <div className="d-flex align-items-center w-full">
              <span className='font-bold text-xl text-black'>LifeAppDashBoard</span>
              <div className='w-5/6 h-10'></div>
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
        </header>

        <div className='container-xl pt-0 pb-4'>
          {/* Search & Filter Section */}
          <div className='card shadow-sm border-0 mb-4'>
            <div className="card-body">
              <h5 className="card-title mb-4">Work Sheets</h5>
              <div className="row g-3">
                <div className='col-12 col-md-6 col-lg-3'>
                  <select
                    className='form-select'
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    <option value=''>Select Subject</option>
                    <option value='Science'>Science</option>
                    <option value='Maths'>Maths</option>
                  </select>
                </div>
                <div className='col-12 col-md-6 col-lg-3'>
                  <select
                    className='form-select'
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value=''>Select Status</option>
                    <option value='Published'>Published</option>
                    <option value='Drafted'>Drafted</option>
                  </select>
                </div>
                {/* Action Buttons */}
                <div className="d-flex flex-row gap-2 mt-4">
                  <button className="btn btn-success d-inline-flex align-items-center" onClick={handleSearch}>
                    <Search className="me-2" size={16} />
                    Search
                  </button>
                  <button className="btn btn-warning d-inline-flex align-items-center text-dark" onClick={handleClear}>
                    <XCircle className="me-2" size={16} />
                    Clear
                  </button>
                  <button className="btn btn-success d-inline-flex align-items-center" onClick={() => setShowAddModal(true)}>
                    <Plus className="me-2" size={16} />
                    Add Work Sheet
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className='card shadow-sm border-0 mt-2'>
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

      {/* -------------------- Edit Worksheet Modal -------------------- */}
      {showEditModal && editingWorksheet && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Work Sheet</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <select 
                    className="form-select"
                    value={editingWorksheet.subject}
                    onChange={(e) => setEditingWorksheet({ ...editingWorksheet, subject: e.target.value })}
                  >
                    <option value=''>Select Subject</option>
                    <option value='Science'>Science</option>
                    <option value='Maths'>Maths</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Grade</label>
                  <select 
                    className="form-select"
                    value={editingWorksheet.grade}
                    onChange={(e) => setEditingWorksheet({ ...editingWorksheet, grade: Number(e.target.value) })}
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
                    value={editingWorksheet.title}
                    onChange={(e) => setEditingWorksheet({ ...editingWorksheet, title: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Document</label>
                  <textarea 
                    className="form-control"
                    value={editingWorksheet.document}
                    onChange={(e) => setEditingWorksheet({ ...editingWorksheet, document: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-select"
                    value={editingWorksheet.status}
                    onChange={(e) => setEditingWorksheet({ ...editingWorksheet, status: e.target.value })}
                  >
                    <option value='Published'>Published</option>
                    <option value='Drafted'>Drafted</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSaveChanges}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- Add Worksheet Modal -------------------- */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Work Sheet</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <select 
                    className="form-select"
                    value={newWorksheet.subject}
                    onChange={(e) => setNewWorksheet({ ...newWorksheet, subject: e.target.value })}
                  >
                    <option value=''>Select Subject</option>
                    <option value='Science'>Science</option>
                    <option value='Maths'>Maths</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Grade</label>
                  <select 
                    className="form-select"
                    value={newWorksheet.grade}
                    onChange={(e) => setNewWorksheet({ ...newWorksheet, grade: Number(e.target.value) })}
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
                    value={newWorksheet.title}
                    onChange={(e) => setNewWorksheet({ ...newWorksheet, title: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Document</label>
                  <textarea 
                    className="form-control"
                    value={newWorksheet.document}
                    onChange={(e) => setNewWorksheet({ ...newWorksheet, document: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-select"
                    value={newWorksheet.status}
                    onChange={(e) => setNewWorksheet({ ...newWorksheet, status: e.target.value })}
                  >
                    <option value='Published'>Published</option>
                    <option value='Drafted'>Drafted</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAddWorksheet}
                >
                  Add Work Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

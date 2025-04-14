'use client'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/ui/sidebar';
import '@tabler/core/dist/css/tabler.min.css';
import NumberFlow from '@number-flow/react';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { ChevronDown } from 'lucide-react';
const inter = Inter({ subsets: ['latin'] });
//const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
const api_startpoint = 'http://152.42.239.141:5000'
// const api_startpoint = 'http://127.0.0.1:5000'

// Type definitions for Competency and Subject
interface Competency {
    id: number;
    competency_title: string; // comes from comp.title in our SQL query
    document: string;
    status: number; // e.g. 1 for ACTIVE, 0 for DEACTIVE
    created_at: string;
    subject_title: string; // JSON string: e.g. '{"en": "Maths"}'
    level_title: string;   // JSON string: e.g. '{"en": "Level 1"}'
    la_subject_id: number;
    la_level_id: number;

  }
  
  interface Subject {
    id: number;
    title: string; // JSON string: e.g. '{"en": "Science"}'
  }
  
  export default function TeacherCompetencies() {
    const [competencies, setCompetencies] = useState<Competency[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [filterSubject, setFilterSubject] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>(''); // "" means all
    const [page, setPage] = useState<number>(1);
  
    // Modal states for Add, Edit and Delete
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  
    // Form state for Add / Edit
    const [formCompetency, setFormCompetency] = useState({
      name: '',
      la_subject_id: '',
      la_level_id: '',
      status: '1',
      document: ''
    });
  
    // Fetch competencies and subjects using the updated endpoint
    const fetchCompetencies = async () => {
      try {
        const params = new URLSearchParams();
        if (filterSubject) params.append('la_subject_id', filterSubject);
        if (filterStatus) params.append('status', filterStatus);
        params.append('page', page.toString());
        const res = await fetch(`${api_startpoint}/admin/competencies?${params.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.error) {
          console.error(data.error);
        } else {
          setCompetencies(data.competencies);
          setSubjects(data.subjects);
          setTotalCount(data.competencies.length);
        }
      } catch (error) {
        console.error('Error fetching competencies:', error);
      }
    };
  
    useEffect(() => {
      fetchCompetencies();
    }, [filterSubject, filterStatus, page]);
  
    // Helper function to parse JSON titles
    const parseTitle = (jsonStr: string) => {
      try {
        const parsed = JSON.parse(jsonStr);
        return parsed.en || jsonStr;
      } catch (error) {
        return jsonStr;
      }
    };
  
    // Handlers for filters
    const handleSearch = () => {
      setPage(1);
      fetchCompetencies();
    };
  
    const handleClear = () => {
      setFilterSubject('');
      setFilterStatus('');
      setPage(1);
      fetchCompetencies();
    };
  
    // Add competency
    const addCompetency = async () => {
      const payload = {
        name: formCompetency.name,
        la_subject_id: formCompetency.la_subject_id,
        la_level_id: formCompetency.la_level_id,
        status: parseInt(formCompetency.status, 10),
        document: formCompetency.document
      };
      try {
        const res = await fetch(`${api_startpoint}/admin/competencies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.message) {
          setShowAddModal(false);
          fetchCompetencies();
        } else {
          console.error(data.error);
        }
      } catch (error) {
        console.error('Error adding competency:', error);
      }
    };
  
    // Open Edit modal
    const openEditModal = (comp: Competency) => {
      setSelectedCompetency(comp);
      setFormCompetency({
        name: comp.competency_title,
        la_subject_id: comp.subject_title ? comp.la_subject_id.toString() : '',
        la_level_id: comp.level_title ? comp.la_level_id.toString() : '',
        status: comp.status.toString(),
        document: comp.document
      });
      setShowEditModal(true);
    };
  
    // Update competency
    const updateCompetency = async () => {
      if (!selectedCompetency) return;
      const payload = {
        name: formCompetency.name,
        la_subject_id: formCompetency.la_subject_id,
        la_level_id: formCompetency.la_level_id,
        status: parseInt(formCompetency.status, 10),
        document: formCompetency.document
      };
      try {
        const res = await fetch(`${api_startpoint}/admin/competencies/${selectedCompetency.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.message) {
          setShowEditModal(false);
          setSelectedCompetency(null);
          fetchCompetencies();
        } else {
          console.error(data.error);
        }
      } catch (error) {
        console.error('Error updating competency:', error);
      }
    };
  
    // Open Delete modal
    const openDeleteModal = (comp: Competency) => {
      setSelectedCompetency(comp);
      setShowDeleteModal(true);
    };
  
    // Delete competency
    const deleteCompetency = async () => {
      if (!selectedCompetency) return;
      try {
        const res = await fetch(`${api_startpoint}/admin/competencies/${selectedCompetency.id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.message) {
          setShowDeleteModal(false);
          setSelectedCompetency(null);
          fetchCompetencies();
        } else {
          console.error(data.error);
        }
      } catch (error) {
        console.error('Error deleting competency:', error);
      }
    };
  
    return (
      <div className={`page bg-body ${inter.className} font-sans`}>
        <Sidebar />
        <div className="page-wrapper" style={{ marginLeft: '250px' }}>
          <div className="page-body">
            <div className="container-xl pt-4 pb-4 space-y-4">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h2 className="text-xl font-semibold">Competencies</h2>
                  <h5 className="text-muted">{totalCount} {totalCount === 1 ? 'record' : 'records'} found</h5>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <IconPlus className="me-2" /> Add Competency
                </button>
              </div>
  
              {/* Filters */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-select"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {parseTitle(sub.title)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
                <div className="col-12 d-flex gap-3">
                  <button className="btn btn-success" onClick={handleSearch}>Search</button>
                  <button className="btn btn-warning" onClick={handleClear}>Clear</button>
                </div>
              </div>
  
              {/* Table */}
              <div className="card shadow-sm border-0">
                <div className="card-body overflow-x-auto">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Level</th>
                        <th>Competency Title</th>
                        <th>Document</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competencies.map((comp) => (
                        <tr key={comp.id}>
                          <td>{parseTitle(comp.subject_title)}</td>
                          <td>{parseTitle(comp.level_title)}</td>
                          <td>{comp.competency_title}</td>
                          <td>{comp.document}</td>
                          <td>{comp.status === 1 ? 'Active' : 'Inactive'}</td>
                          <td>{comp.created_at}</td>
                          <td>
                            <button className="btn btn-icon btn-secondary me-2" onClick={() => openEditModal(comp)}>
                              <IconEdit size={16} />
                            </button>
                            <button className="btn btn-icon btn-danger" onClick={() => openDeleteModal(comp)}>
                              <IconTrash size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
  
              {/* Pagination controls could be added here */}
            </div>
          </div>
        </div>
  
        {/* Add Competency Modal */}
        {showAddModal && (
          <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Competency</h5>
                  <button className="btn-close" onClick={() => setShowAddModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Competency Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formCompetency.name}
                      onChange={(e) => setFormCompetency({ ...formCompetency, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <select
                      className="form-select"
                      value={formCompetency.la_subject_id}
                      onChange={(e) => setFormCompetency({ ...formCompetency, la_subject_id: e.target.value })}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {parseTitle(sub.title)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Level ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formCompetency.la_level_id}
                      onChange={(e) => setFormCompetency({ ...formCompetency, la_level_id: e.target.value })}
                      placeholder="e.g., 1,2,3"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formCompetency.status}
                      onChange={(e) => setFormCompetency({ ...formCompetency, status: e.target.value })}
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Document</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formCompetency.document}
                      onChange={(e) => setFormCompetency({ ...formCompetency, document: e.target.value })}
                      placeholder="Enter document identifier or URL"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    Close
                  </button>
                  <button className="btn btn-primary" onClick={addCompetency}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
  
        {/* Edit Competency Modal */}
        {showEditModal && selectedCompetency && (
          <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog modal-md">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Competency</h5>
                  <button className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Competency Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formCompetency.name}
                      onChange={(e) =>
                        setFormCompetency({ ...formCompetency, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <select
                      className="form-select"
                      value={formCompetency.la_subject_id}
                      onChange={(e) =>
                        setFormCompetency({ ...formCompetency, la_subject_id: e.target.value })
                      }
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {parseTitle(sub.title)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Level ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formCompetency.la_level_id}
                      onChange={(e) =>
                        setFormCompetency({ ...formCompetency, la_level_id: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formCompetency.status}
                      onChange={(e) =>
                        setFormCompetency({ ...formCompetency, status: e.target.value })
                      }
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Document</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formCompetency.document}
                      onChange={(e) =>
                        setFormCompetency({ ...formCompetency, document: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={updateCompetency}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
  
        {/* Delete Competency Modal */}
        {showDeleteModal && selectedCompetency && (
          <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog modal-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Delete Competency</h5>
                  <button className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to delete competency: <strong>{selectedCompetency.competency_title}</strong>?
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={deleteCompetency}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
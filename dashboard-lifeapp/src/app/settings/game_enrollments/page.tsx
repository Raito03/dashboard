'use client'
import { useState, useEffect } from 'react';
import React from 'react';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
import { Sidebar } from '@/components/ui/sidebar';
import '@tabler/core/dist/css/tabler.min.css';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';

const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
//const api_startpoint = 'http://127.0.0.1:5000'

// Define TypeScript types for Enrollment
type Enrollment = {
    id: number;
    enrollment_code: string;
    type: number;      // 5 for "Jigyasa", 6 for "Pragya"
    user_id: number;
    unlock_enrollment_at: string | null;
    created_at: string;
    updated_at: string;
};

export default function SettingsGameEnrollments() {
    // Enrollment list and loading state
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Pagination state (10 items per page)
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10;

    // Modal states for add, edit, delete
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [enrollmentToEdit, setEnrollmentToEdit] = useState<Enrollment | null>(null);
    const [enrollmentToDelete, setEnrollmentToDelete] = useState<Enrollment | null>(null);

    // New enrollment state (for add modal)
    const [newEnrollment, setNewEnrollment] = useState({
        enrollment_code: '',
        type: '5', // default "Jigyasa" (5). Use "6" for Pragya.
        user_id: '',
        unlock_enrollment_at: '', // ISO formatted date/time (optional)
    });

    // Function to fetch enrollments
    const fetchEnrollments = async () => {
        setLoading(true);
        try {
        // GET endpoint for listing enrollments
        const res = await fetch(`${api_startpoint}/enrollments`, {
            method: 'GET',
        });
        const data = await res.json();
        setEnrollments(data);
        } catch (error) {
        console.error("Error fetching enrollments:", error);
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnrollments();
    }, []);

    // Pagination calculations
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const paginatedEnrollments = enrollments.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(enrollments.length / itemsPerPage);

    // Helper: Map type number to text
    const mapType = (type: number) => {
        if (type === 5) return "Jigyasa";
        if (type === 6) return "Pragya";
        return type.toString();
    };

    // Handlers for adding, editing, deleting enrollments

    const handleAddEnrollment = async () => {
        try {
        const payload = {
            enrollment_code: newEnrollment.enrollment_code,
            type: newEnrollment.type,
            user_id: newEnrollment.user_id,
            unlock_enrollment_at: newEnrollment.unlock_enrollment_at || null,
        };
        const res = await fetch(`${api_startpoint}/enrollments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
            setShowAddModal(false);
            // Reset new enrollment state
            setNewEnrollment({ enrollment_code: '', type: '5', user_id: '', unlock_enrollment_at: '' });
            fetchEnrollments();
        }
        } catch (error) {
        console.error("Error adding enrollment:", error);
        }
    };

    const openEditModal = (enrollment: Enrollment) => {
        setEnrollmentToEdit(enrollment);
        setShowEditModal(true);
    };

    const handleUpdateEnrollment = async () => {
        if (!enrollmentToEdit) return;
        try {
        const payload = {
            enrollment_code: enrollmentToEdit.enrollment_code,
            type: enrollmentToEdit.type,
            user_id: enrollmentToEdit.user_id,
            unlock_enrollment_at: enrollmentToEdit.unlock_enrollment_at,
        };
        const res = await fetch(`${api_startpoint}/enrollments/${enrollmentToEdit.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.message) {
            setShowEditModal(false);
            setEnrollmentToEdit(null);
            fetchEnrollments();
        }
        } catch (error) {
        console.error("Error updating enrollment:", error);
        }
    };

    const openDeleteModal = (enrollment: Enrollment) => {
        setEnrollmentToDelete(enrollment);
        setShowDeleteModal(true);
    };

    const handleDeleteEnrollment = async () => {
        if (!enrollmentToDelete) return;
        try {
        const res = await fetch(`${api_startpoint}/enrollments/${enrollmentToDelete.id}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (data.message) {
            setShowDeleteModal(false);
            setEnrollmentToDelete(null);
            fetchEnrollments();
        }
        } catch (error) {
        console.error("Error deleting enrollment:", error);
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
                        <div className="d-flex flex-col">
                            <h2 className="mb-0">Enrollments</h2>
                            <small className="text-muted">{enrollments.length} rows found</small>
                        </div>
                        <div>
                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <IconPlus className="me-2" /> Add Enrollment
                            </button>
                        </div>
                        </div>

                        {/* Loading Animation */}
                        {loading ? (
                        <div className="text-center py-4">
                            <div className="flex justify-center items-center h-40">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-sky-800"></div>
                            </div>
                        </div>
                        ) : (
                        <div className="card">
                            <div className="card-body overflow-x-auto">
                            <table className="table table-bordered table-striped">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Enrollment Code</th>
                                    <th>Type</th>
                                    <th>User ID</th>
                                    <th>Unlock Enrollment At</th>
                                    <th>Created At</th>
                                    <th>Updated At</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedEnrollments.map((enroll) => (
                                    <tr key={enroll.id}>
                                    <td>{enroll.id}</td>
                                    <td>{enroll.enrollment_code}</td>
                                    <td>{mapType(enroll.type)}</td>
                                    <td>{enroll.user_id}</td>
                                    <td>{enroll.unlock_enrollment_at || 'N/A'}</td>
                                    <td>{enroll.created_at}</td>
                                    <td>{enroll.updated_at}</td>
                                    <td>
                                        <button
                                        className="btn btn-secondary btn-sm me-2"
                                        onClick={() => openEditModal(enroll)}
                                        >
                                        <IconEdit /> Edit
                                        </button>
                                        <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => openDeleteModal(enroll)}
                                        >
                                        <IconTrash /> Delete
                                        </button>
                                    </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            {/* Pagination Controls */}
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <button
                                className="btn btn-secondary"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                >
                                Previous
                                </button>
                                <span>
                                Page {currentPage} of {totalPages || 1}
                                </span>
                                <button
                                className="btn btn-secondary"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                    prev < totalPages ? prev + 1 : prev
                                    )
                                }
                                disabled={currentPage === totalPages}
                                >
                                Next
                                </button>
                            </div>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>

      {/* Add Enrollment Modal */}
      {showAddModal && (
        <div className="modal d-block bg-black bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Enrollment</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Enrollment Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newEnrollment.enrollment_code}
                    onChange={(e) =>
                      setNewEnrollment({ ...newEnrollment, enrollment_code: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">User ID</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newEnrollment.user_id}
                    onChange={(e) =>
                      setNewEnrollment({ ...newEnrollment, user_id: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Unlock Enrollment At</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={newEnrollment.unlock_enrollment_at}
                    onChange={(e) =>
                      setNewEnrollment({ ...newEnrollment, unlock_enrollment_at: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={newEnrollment.type}
                    onChange={(e) =>
                      setNewEnrollment({ ...newEnrollment, type: e.target.value })
                    }
                  >
                    <option value="5">Jigyasa</option>
                    <option value="6">Pragya</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleAddEnrollment}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Enrollment Modal */}
      {showEditModal && enrollmentToEdit && (
        <div className="modal d-block bg-black bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Enrollment</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Enrollment Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={enrollmentToEdit.enrollment_code}
                    onChange={(e) =>
                      setEnrollmentToEdit({ ...enrollmentToEdit, enrollment_code: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">User ID</label>
                  <input
                    type="number"
                    className="form-control"
                    value={enrollmentToEdit.user_id}
                    onChange={(e) =>
                      setEnrollmentToEdit({ ...enrollmentToEdit, user_id: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Unlock Enrollment At</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={enrollmentToEdit.unlock_enrollment_at || ""}
                    onChange={(e) =>
                      setEnrollmentToEdit({
                        ...enrollmentToEdit,
                        unlock_enrollment_at: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={String(enrollmentToEdit.type)}
                    onChange={(e) =>
                      setEnrollmentToEdit({ ...enrollmentToEdit, type: parseInt(e.target.value) })
                    }
                  >
                    <option value="5">Jigyasa</option>
                    <option value="6">Pragya</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleUpdateEnrollment}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Enrollment Modal */}
      {showDeleteModal && enrollmentToDelete && (
        <div className="modal d-block bg-black bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete enrollment with code: {enrollmentToDelete.enrollment_code}?
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteEnrollment}>
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
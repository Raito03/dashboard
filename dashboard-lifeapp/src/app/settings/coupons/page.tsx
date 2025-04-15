'use client'
import '@tabler/core/dist/css/tabler.min.css';
// import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import React from 'react';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
import { Sidebar } from '@/components/ui/sidebar';
import { IconSearch, IconBell, IconSettings, IconDownload, IconX, IconTrash, IconEdit, IconPlus, IconFilterOff } from '@tabler/icons-react';
import { ChevronDown } from 'lucide-react';

// const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
const api_startpoint = 'http://152.42.239.141:5000'
// const api_startpoint = 'http://127.0.0.1:5000'


interface Coupon {
    id: number;
    title: string;
    category_id: number;
    coin: string;
    link: string;
    details: string;
    index: number;
    coupon_media_id: number;
    created_at: string;
    updated_at: string;
}

export default function SettingsCoupons() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    // const [currentPage, setCurrentPage] = useState(1);
    // const [itemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
     const [itemsPerPage, setItemsPerPage] = useState(10);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    
    // Form states
    const [formData, setFormData] = useState({
        title: '',
        category_id: '',
        coin: '',
        link: '',
        details: '',
        index: '',
        coupon_media_id: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, [startDate, endDate]);

    const [loading, setLoading] = useState(false);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const response = await fetch(`${api_startpoint}/api/coupons?${params}`);
        const data = await response.json();
        setCoupons(data.data);
        } catch (error) {
        console.error('Error fetching coupons:', error);
        } finally {
        setLoading(false);
        }
    };



      // Clear filters and reset data
    // Update the clear filters function
    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        // We can use setTimeout to ensure state updates before calling fetchCoupons
        // or we can rely on the useEffect to trigger the fetch when states change
    };

    // Make sure your useEffect properly handles empty values
    useEffect(() => {
        fetchCoupons();
    }, [currentPage, itemsPerPage, startDate, endDate]);

    // Open edit modal with coupon data
    const openEditModal = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setFormData({
        title: coupon.title,
        category_id: String(coupon.category_id),
        coin: coupon.coin,
        link: coupon.link,
        details: coupon.details,
        index: String(coupon.index),
        coupon_media_id: String(coupon.coupon_media_id)
        });
        setShowEditModal(true);
    };

    const handleDelete = async () => {
        if (deleteId) {
          await fetch(`${api_startpoint}/api/coupons/${deleteId}`, { method: 'DELETE' });
          setShowDeleteModal(false);
          fetchCoupons();
        }
    }

    // Form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = showEditModal && selectedCoupon 
        ? `${api_startpoint}/api/coupons/${selectedCoupon.id}`
        : `${api_startpoint}/api/coupons`;
        
        const method = showEditModal ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
        });
        
        if (response.ok) {
        setShowAddModal(false);
        setShowEditModal(false);
        fetchCoupons();
        }
    };

    // Pagination
    // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = coupons.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(coupons.length / itemsPerPage);

  const PaginationControls = () => (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <div className="text-muted">
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, coupons.length)} of {coupons.length} entries
      </div>
      
      <div className="d-flex gap-2 align-items-center">
        <select
          className="form-select form-select-sm"
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          {[10, 25, 50, 100].map(size => (
            <option key={size} value={size}>{size} per page</option>
          ))}
        </select>

        <button
          className="btn btn-outline-secondary"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <div className="w-1/3 p-0">
          <span className="p-0 d-flex">
            Page {currentPage} of {totalPages}
          </span>
        </div>   

        <button
          className="btn btn-outline-secondary"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );

  // Format date function
    const formatDate = (dateString: string): string => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        } catch (e) {
            return '';
        }
    };
    return (
        <div className={`page bg-light ${inter.className} font-sans`}>
            <Sidebar />
            <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                <div className='page-body'>
                    <div className='container-xl pt-0 pb-4'>
                        <div className="card">
                            <div className="card-header">
                                <div className="flex justify-between items-center">
                                <h3 className="card-title">Coupons ({totalCount})</h3>
                                <div className="mx-2 flex gap-2">
                                    <input
                                    type="date"
                                    className="form-control"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    />
                                    <input
                                    type="date"
                                    className="form-control"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={fetchCoupons}
                                        disabled={loading || (!startDate && !endDate)}
                                    >
                                        {loading ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        ) : (
                                        <IconSearch size={16} />
                                        )}
                                        Apply Filters
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={clearFilters}
                                        title="Clear filters"
                                        >
                                        <IconFilterOff size={16} />
                                    </button>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setShowAddModal(true);
                                            setFormData({
                                            title: '',
                                            category_id: '',
                                            coin: '',
                                            link: '',
                                            details: '',
                                            index: '',
                                            coupon_media_id: ''
                                            });
                                        }}
                                        >
                                        <IconPlus size={16} className="mr-1" />
                                        Add Coupon
                                    </button>
                                </div>
                                </div>
                            </div>
                            <div className="table-responsive">
                                {loading ? (
                                    <div className="d-flex justify-content-center align-items-center" 
                                        style={{ position: 'absolute', inset: 0 }}>
                                        <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                    ) : (
                                    <table className="table table-vcenter table-hover">
                                    <thead>
                                        <tr>
                                        <th>Title</th>
                                        <th>Coin</th>
                                        <th>Created At</th>
                                        <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map(coupon => (
                                        <tr key={coupon.id}>
                                            <td>{coupon.title}</td>
                                            <td>{coupon.coin}</td>
                                            <td>{new Date(coupon.created_at).toLocaleString('en-GB', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: false
                                                })}{formatDate(coupon.created_at)}
                                            </td>
                                            <td>
                                            <button
                                                className="btn btn-icon"
                                                onClick={() => {
                                                setSelectedCoupon(coupon);
                                                setShowEditModal(true);
                                                setFormData({
                                                    title: coupon.title,
                                                    category_id: String(coupon.category_id),
                                                    coin: coupon.coin,
                                                    link: coupon.link,
                                                    details: coupon.details,
                                                    index: String(coupon.index),
                                                    coupon_media_id: String(coupon.coupon_media_id)
                                                });
                                                }}
                                            >
                                                <IconEdit size={16} />
                                            </button>
                                            <button
                                                className="btn btn-icon text-danger"
                                                onClick={() => {
                                                    setDeleteId(coupon.id);
                                                    setShowDeleteModal(true);
                                                }}
                                            >
                                                <IconTrash size={16} />
                                            </button>
                                            </td>
                                        </tr>
                                        ))}
                                    </tbody>
                                    </table>
                                )}
                            </div>
                            <div className="card-footer">
                                <PaginationControls />
                            </div>
                        </div>
                    </div>
                </div>
                {/* // Add Modal */}
                {showAddModal && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Add New Coupon</h5>
                            <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowAddModal(false)}
                            >
                            {/* <IconX size={16} /> */}
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                <label className="form-label">Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                                </div>
                                
                                <div className="col-md-6">
                                <label className="form-label">Category ID</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                                    required
                                />
                                </div>

                                <div className="col-md-6">
                                <label className="form-label">Coin</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.coin}
                                    onChange={(e) => setFormData({...formData, coin: e.target.value})}
                                    required
                                />
                                </div>

                                <div className="col-md-6">
                                <label className="form-label">Link</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.link}
                                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                                />
                                </div>

                                <div className="col-md-6">
                                <label className="form-label">Index</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.index}
                                    onChange={(e) => setFormData({...formData, index: e.target.value})}
                                    required
                                />
                                </div>

                                <div className="col-md-6">
                                <label className="form-label">Media ID</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.coupon_media_id}
                                    onChange={(e) => setFormData({...formData, coupon_media_id: e.target.value})}
                                    required
                                />
                                </div>

                                <div className="col-12">
                                <label className="form-label">Details</label>
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    value={formData.details}
                                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                                />
                                </div>
                            </div>
                            </div>
                            <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowAddModal(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Create Coupon
                            </button>
                            </div>
                        </form>
                        </div>
                    </div>
                    </div>
                </>
                )}

                {/* // Edit Modal */}
                {showEditModal && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal fade show d-block">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Edit Coupon</h5>
                            <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowEditModal(false)}
                            >
                            {/* <IconX size={16} /> */}
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                <label className="form-label">Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                                </div>
                                
                                <div className="col-md-6">
                                <label className="form-label">Category ID</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                                    required
                                />
                                </div>

                                <div className="col-md-6">
                                <label className="form-label">Coin</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.coin}
                                    onChange={(e) => setFormData({...formData, coin: e.target.value})}
                                    required
                                />
                                </div>

                                <div className="col-md-6">
                                <label className="form-label">Link</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.link}
                                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                                />
                                </div>

                                <div className="col-md-6">
                                <label className="form-label">Index</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.index}
                                    onChange={(e) => setFormData({...formData, index: e.target.value})}
                                    required
                                />
                                </div>

                                <div className="col-md-6">
                                <label className="form-label">Media ID</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.coupon_media_id}
                                    onChange={(e) => setFormData({...formData, coupon_media_id: e.target.value})}
                                    required
                                />
                                </div>

                                <div className="col-12">
                                <label className="form-label">Details</label>
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    value={formData.details}
                                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                                />
                                </div>
                            </div>
                            </div>
                            <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowEditModal(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Save Changes
                            </button>
                            </div>
                        </form>
                        </div>
                    </div>
                    </div>
                </>
                )}
                    {/* Delete Confirmation Modal */}
                    {showDeleteModal && (
                    <div className="modal-backdrop fade show"></div>
                    )}
                    <div className={`modal fade ${showDeleteModal ? 'show d-block' : ''}`}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Delete Coupon</h5>
                            <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowDeleteModal(false)}
                            >
                            {/* <IconX size={16} /> */}
                            </button>
                        </div>
                        <div className="modal-body">
                            Are you sure you want to delete this coupon? This action cannot be undone.
                        </div>
                        <div className="modal-footer">
                            <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowDeleteModal(false)}
                            >
                            Cancel
                            </button>
                            <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleDelete}
                            >
                            Delete
                            </button>
                        </div>
                        </div>
                    </div>
                    </div>
            </div>
        </div>
    );
}
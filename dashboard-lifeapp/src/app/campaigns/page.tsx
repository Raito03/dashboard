'use client'
import React, { useState, useEffect, useCallback, useMemo, useRef, FormEvent, ChangeEvent } from 'react';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/ui/sidebar';
import '@tabler/core/dist/css/tabler.min.css';
import NumberFlow from '@number-flow/react';
import { IconEdit, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { ChevronDown } from 'lucide-react';
const inter = Inter({ subsets: ['latin'] });
//const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
const api_startpoint = 'http://152.42.239.141:5000'
// const api_startpoint = 'http://127.0.0.1:5000'


interface Campaign {
    id: number;
    created_by: number;
    name: string;
    title: string;
    body: string;
    media_id: number | null;
    school_id: number | string;
    school_name: string;
    city: string;
    state: string;
    scheduled_date: string | null;
    scheduled_at?: string | null;
    completed_at?: string | null;
    users: string; // assuming JSON string representation of an array
    success_users: string; // JSON string
    failed_users: string; // JSON string
    created_at: string;
    updated_at: string;
    media_path?:string;
    media_url?: string;
  }
export default function Campaigns() {
    // State for campaign table data
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const perPage = 50;

  // State for Add/Edit modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string|null>(null)

  // State for form fields (for add & edit)
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    body: '',
    school_id: '', // you may want to use a dropdown later
    city: '',
    state: '',
    scheduled_date: '', // expects a datetime string
    media: null as File | null,
  });

  // Function to fetch campaigns (with pagination)
  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      // GET request with pagination using query parameters:
      const response = await fetch(`${api_startpoint}/admin/push-notification-campaigns?page=${currentPage}&per_page=${perPage}`);
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      const data = await response.json();
      setCampaigns(data.campaigns);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [currentPage]);

  // Helper to parse JSON strings for the array fields and return length
  const getArrayLength = (value: string): number => {
    try {
      const arr = JSON.parse(value);
      if (Array.isArray(arr)) return arr.length;
      return 0;
    } catch (error) {
      return 0;
    }
  };

  // Handle form field changes (for add/edit modal)
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file input separately
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, media: e.target.files![0] }));
    }
  };

  // Add Campaign (POST)
  // Add Campaign (POST) with improved error handling
  const handleAddCampaign = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate form data
    if (!formData.name || !formData.title || !formData.body || !formData.school_id) {
      alert("Please fill in all required fields: Name, Title, Body, and School ID");
      setIsLoading(false);
      return;
    }
    
    // Check if school_id is numeric
    if (isNaN(parseInt(formData.school_id))) {
      alert("School ID must be a number");
      setIsLoading(false);
      return;
    }
    
    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("title", formData.title);
    fd.append("body", formData.body);
    fd.append("school_id", formData.school_id);
    
    // Only append non-empty values
    if (formData.city) fd.append("city", formData.city);
    if (formData.state) fd.append("state", formData.state);
    if (formData.scheduled_date) fd.append("scheduled_date", formData.scheduled_date);
    if (formData.media) fd.append("media", formData.media);
    
    try {
      const response = await fetch(`${api_startpoint}/admin/push-notification-campaigns`, {
        method: 'POST',
        body: fd,
      });
      
      // Handle both success and error responses
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to add campaign");
      }
      
      console.log("Campaign added:", result);
      setShowAddModal(false);
      
      // Clear form data
      setFormData({
        name: '',
        title: '',
        body: '',
        school_id: '',
        city: '',
        state: '',
        scheduled_date: '',
        media: null,
      });
      
      // Refresh the campaign list
      fetchCampaigns();
      
    } catch (error) {
      console.error("Error adding campaign:", error);
      alert(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // Update Campaign (PUT)
  const handleUpdateCampaign = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("title", formData.title);
    fd.append("body", formData.body);
    fd.append("school_id", formData.school_id);
    fd.append("city", formData.city);
    fd.append("state", formData.state);
    fd.append("scheduled_date", formData.scheduled_date);
    if (formData.media) {
      fd.append("media", formData.media);
    }
    try {
      const response = await fetch(`${api_startpoint}/admin/push-notification-campaigns/${selectedCampaign.id}`, {
        method: 'PUT',
        body: fd,
      });
      if (!response.ok) throw new Error("Failed to update campaign");
      const result = await response.json();
      console.log("Campaign updated:", result);
      setShowEditModal(false);
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Delete Campaign (DELETE)
  const handleDeleteCampaign = async () => {
    if (!selectedCampaign) return;
    try {
      const response = await fetch(`${api_startpoint}/admin/push-notification-campaigns/${selectedCampaign.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("Failed to delete campaign");
      const result = await response.json();
      console.log("Campaign deleted:", result);
      setShowDeleteModal(false);
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Handlers for opening modals with pre-filling form data from campaign row
  const openEditModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      title: campaign.title,
      body: campaign.body,
      school_id: campaign.school_id.toString(),
      city: campaign.city,
      state: campaign.state,
      scheduled_date: campaign.scheduled_date || '',
      media: null, // file input remains empty
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDeleteModal(true);
  };

  return (
    <div className={`page bg-body ${inter.className} font-sans`}>
      <Sidebar />
      <div className="page-wrapper" style={{ marginLeft: '250px' }}>
        <div className="page-body">
          <div className="container-xl pt-4 pb-4 space-y-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="text-xl font-semibold">Push Notification Campaigns</h2>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <IconPlus className="me-2" /> Add Campaign
              </button>
            </div>
            {/* Campaigns Table */}
            {isLoading ? (
              <div className="text-center py-10">
                <div className="spinner-border text-purple" role="status" style={{ width: "3rem", height: "3rem" }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading campaigns...</p>
              </div>
            ) : error ? (
              <div className="text-center text-danger">
                <p>Error: {error}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Sr No.</th>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Body</th>
                      <th>School</th>
                      <th>State</th>
                      <th>City</th>
                      <th>Scheduled Date</th>
                      <th>Total Users</th>
                      <th>Success Users</th>
                      <th>Failed Users</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign, index) => (
                      <tr key={campaign.id}>
                        <td>{(currentPage - 1) * perPage + index + 1}</td>
                        <td>
                          {campaign.media_url?.match(/\.(jpe?g|png|gif)$/i)
                              ? <img
                                  src={campaign.media_url}
                                  className="w-12 h-12 object-cover cursor-pointer"
                                  onClick={()=>setLightboxUrl(campaign.media_url!)}
                                  />
                              : campaign.media_url
                                  ? <button
                                      className="btn btn-link"
                                      onClick={()=>window.open(campaign.media_url,'_blank')}
                                      >📄 File</button>
                                  : '—'}
                      </td>
                        <td>{campaign.name}</td>
                        <td>{campaign.title}</td>
                        <td>{campaign.body}</td>
                        <td>{campaign.school_name || campaign.school_id}</td>
                        <td>{campaign.state}</td>
                        <td>{campaign.city}</td>
                        <td>{campaign.scheduled_date || '-'}</td>
                        <td>{typeof campaign.users === "string" ? getArrayLength(campaign.users) : 0}</td>
                        <td>{typeof campaign.success_users === "string" ? getArrayLength(campaign.success_users) : 0}</td>
                        <td>{typeof campaign.failed_users === "string" ? getArrayLength(campaign.failed_users) : 0}</td>
                        <td>
                          <button className="btn btn-sm btn-secondary me-2" onClick={() => openEditModal(campaign)}>
                            <IconEdit size={16} />
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => openDeleteModal(campaign)}>
                            <IconTrash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination Controls (if needed) */}
                {/* You may want to add buttons for Previous and Next pages here */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Campaign Modal */}
      {showAddModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <form onSubmit={handleAddCampaign} encType="multipart/form-data">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Campaign</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Body</label>
                    <textarea
                      name="body"
                      className="form-control"
                      value={formData.body}
                      onChange={handleInputChange}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-2">
                    <label className="form-label">School ID</label>
                    <input
                      type="text"
                      name="school_id"
                      className="form-control"
                      value={formData.school_id}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      name="state"
                      className="form-control"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Scheduled Date & Time</label>
                    <input
                      type="datetime-local"
                      name="scheduled_date"
                      className="form-control"
                      value={formData.scheduled_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Media File</label>
                    <input
                      type="file"
                      name="media"
                      className="form-control"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                    <IconX className="me-1" size={16} /> Close
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <IconPlus className="me-1" size={16} /> Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {showEditModal && selectedCampaign && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <form onSubmit={handleUpdateCampaign} encType="multipart/form-data">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Campaign</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <div className="modal-body">
                  {/* Fields prefilled from formData which we set when opening the modal */}
                  <div className="mb-2">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Body</label>
                    <textarea
                      name="body"
                      className="form-control"
                      value={formData.body}
                      onChange={handleInputChange}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-2">
                    <label className="form-label">School ID</label>
                    <input
                      type="text"
                      name="school_id"
                      className="form-control"
                      value={formData.school_id}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      name="state"
                      className="form-control"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Scheduled Date & Time</label>
                    <input
                      type="datetime-local"
                      name="scheduled_date"
                      className="form-control"
                      value={formData.scheduled_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Media File (leave blank to keep current)</label>
                    <input
                      type="file"
                      name="media"
                      className="form-control"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    <IconX className="me-1" size={16} /> Close
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <IconEdit className="me-1" size={16} /> Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Campaign Modal */}
      {showDeleteModal && selectedCampaign && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Campaign</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this campaign?</p>
                <p><strong>{selectedCampaign.name}</strong></p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  <IconX className="me-1" size={16} /> Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteCampaign}>
                  <IconTrash className="me-1" size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
            className="position-fixed start-0 end-0 top-0 bottom-0 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center"
            style={{ zIndex: 1050 }}
            onClick={() => setLightboxUrl(null)}
        >
            <div className="position-relative">
                <img
                    src={lightboxUrl}
                    alt="Preview"
                    className="img-fluid rounded max-w-full max-h-full"
                    style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                />
                <button
                    className="position-absolute top-0 end-0 btn btn-sm btn-dark rounded-circle"
                    style={{ margin: '0.5rem' }}
                    onClick={e => { e.stopPropagation(); setLightboxUrl(null) }}
                >
                    <IconX size={16} />
                </button>
            </div>
        </div>
      )}
    </div>
  )
}
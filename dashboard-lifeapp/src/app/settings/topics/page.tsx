'use client'
import React, { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import '@tabler/core/dist/css/tabler.min.css';
import { IconPlus, IconTrash, IconEdit } from '@tabler/icons-react';
import { Sidebar } from '@/components/ui/sidebar';

const inter = Inter({ subsets: ['latin'] });
const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
//const api_startpoint = 'http://127.0.0.1:5000'

// Define types for our data
type Subject = {
  id: number;
  title: string; // JSON string, e.g. '{"en": "CBSE"}'
};

type Level = {
  id: number;
  title: string; // JSON string, e.g. '{"en": "Level 1"}'
};

type Topic = {
  id: number;
  title: string; // JSON string
  la_subject_id: string;
  la_level_id: string;
  status: string; // "1" for active, "0" for inactive
  allow_for: string;
  type: string;
};

export default function SettingsTopics() {
  // Data arrays
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  
  // Search filters for topics page
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // "1", "0", or "all"
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [filters, setFilters] = useState({ la_subject_id: '', la_level_id: '', status: '' });
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  
  // Modal states for topics management
  const [showTopicAddModal, setShowTopicAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [topicToEdit, setTopicToEdit] = useState<Topic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [newTopic, setNewTopic] = useState({
    title: '',
    la_subject_id: '',
    la_level_id: '',
    status: '1',
    allow_for: '1',
    type: '2',
  });

  // Fetch subjects and levels on mount
  useEffect(() => {
    // Fetch all subjects (no filter on status for subjects if needed)
    fetch(`${api_startpoint}/api/subjects_list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'all' }) // Send all if needed
    })
      .then((res) => res.json())
      .then(data => setSubjects(data))
      .catch((err) => console.error("Failed to fetch subjects:", err));
      
    // Fetch levels (assuming no filter required)
    fetch(`${api_startpoint}/api/levels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 1 })
    })
      .then((res) => res.json())
      .then(data => setLevels(data))
      .catch((err) => console.error("Failed to fetch levels:", err));
  }, []);

  // Whenever the filter selections change, update filters state and fetch topics
  useEffect(() => {
    // Set filters using selected values.
    // For status, if "all" is selected, we send an empty filter.
    setFilters({
      la_subject_id: selectedSubject,
      la_level_id: selectedLevel,
      status: selectedStatus === "all" ? "" : selectedStatus,
    });
    setCurrentPage(1);
  }, [selectedStatus, selectedSubject, selectedLevel]);
  
  // Fetch topics each time filters update
  useEffect(() => {
    // Only fetch if subject and level are selected; status is optional.
    if (filters.la_subject_id && filters.la_level_id) {
      setIsLoading(true);
      fetch(`${api_startpoint}/api/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      })
        .then((res) => res.json())
        .then(data => {
          setTopics(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error("Failed to fetch topics:", err))
        .finally(() => setIsLoading(false));
    } else {
      setTopics([]);
    }
  }, [filters]);

  // Pagination calculations
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const paginatedTopics = topics.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(topics.length / itemsPerPage);

  // Handlers for modals
  const handleAddTopic = async () => {
    try {
      const res = await fetch(`${api_startpoint}/api/add_topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTopic)
      });
      const data = await res.json();
      if (data.success) {
        setShowTopicAddModal(false);
        setNewTopic({ title: '', la_subject_id: '', la_level_id: '', status: '1', allow_for: '1', type: '2' });
        // Re-fetch topics with current filters
        fetch(`${api_startpoint}/api/topics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters)
        })
          .then(res => res.json())
          .then(data => setTopics(Array.isArray(data) ? data : []));
      }
    } catch (error) {
      console.error("Error adding topic:", error);
    }
  };

  const openEditModal = (topic: Topic) => {
    setTopicToEdit(topic);
    setShowEditModal(true);
  };

  const handleUpdateTopic = async () => {
    if (!topicToEdit) return;
    try {
      const res = await fetch(`${api_startpoint}/api/update_topic/${topicToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicToEdit)
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setTopicToEdit(null);
        // Refresh topics
        fetch(`${api_startpoint}/api/topics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters)
        })
          .then(res => res.json())
          .then(data => setTopics(Array.isArray(data) ? data : []));
      }
    } catch (error) {
      console.error("Error updating topic:", error);
    }
  };

  const openDeleteModal = (topic: Topic) => {
    setTopicToDelete(topic);
    setShowDeleteModal(true);
  };

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;
    try {
      const res = await fetch(`${api_startpoint}/api/delete_topic/${topicToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(false);
        setTopicToDelete(null);
        // Refresh topics
        fetch(`${api_startpoint}/api/topics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters)
        })
          .then(res => res.json())
          .then(data => setTopics(Array.isArray(data) ? data : []));
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

  return (
    <div className={`page bg-body ${inter.className} font-sans`}>
      <Sidebar />
      <div className="page-wrapper" style={{ marginLeft: '250px' }}>
        <div className="page-body">
          <div className="container-xl pt-4 pb-4 space-y-4">
            {/* Header and Search Filters */}
            <div className="d-flex flex-column gap-3 mb-4">
                <h2 className="mb-0">Manage Topics</h2>
                <div className='mt-0'>
                    <div className="mb-2">
                        <button 
                            className="btn btn-primary" 
                            onClick={() => setShowTopicAddModal(true)}
                        >
                            Add Topic/Set
                        </button>
                    </div>
                    <span className="text-muted">Filter Topics:</span>
                </div>
                <div className=" d-flex flex-row gap-3">
                    {/* Status Filter */}
                    <div className="d-flex gap-2">
                        {["Active", "Inactive", "All"].map((statusOption) => {
                        const value = statusOption === "All" ? "all" : statusOption === "Active" ? "1" : "0";
                        return (
                            <button
                            key={value}
                            className={`p-2 border rounded ${selectedStatus === value ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                            onClick={() => setSelectedStatus(value)}
                            >
                            {statusOption}
                            </button>
                        );
                        })}
                    </div>
                    {/* Subject Filter */}
                    {selectedStatus && (
                        <div className="d-flex gap-2">
                        <select
                            className="form-select"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            <option value="">Select Subject</option>
                            {subjects.map((sub: Subject) => (
                            <option key={sub.id} value={sub.id}>
                                {JSON.parse(sub.title).en}
                            </option>
                            ))}
                        </select>
                        </div>
                    )}
                    {/* Level Filter */}
                    {selectedSubject && (
                        <div className="d-flex gap-2">
                        <select
                            className="form-select"
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                        >
                            <option value="">Select Level</option>
                            {levels.map((lv: Level) => (
                            <option key={lv.id} value={lv.id}>
                                {JSON.parse(lv.title).en}
                            </option>
                            ))}
                        </select>
                        </div>
                    )}

                </div>
              
              {/* Topics Filter */}
              {/* {selectedLevel && (
                <div className="d-flex gap-2">
                  <select
                    className="form-select"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                  >
                    <option value="">Select Topic</option>
                    {topics.map((topic: Topic) => (
                      <option key={topic.id} value={topic.id}>
                        {JSON.parse(topic.title).en}
                      </option>
                    ))}
                  </select>
                </div>
              )} */}
            </div>

            {/* Topics Table */}
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Topics (Total: {topics.length})</h5>
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-black text-blue"></div>
                    </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Topic Title</th>
                          <th>Subject</th>
                          <th>Level</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTopics.map((topic: Topic) => {
                          const subject = subjects.find((s: Subject) => String(s.id) === String(topic.la_subject_id));
                          const level = levels.find((l: Level) => String(l.id) === String(topic.la_level_id));
                          return (
                            <tr key={topic.id}>
                              <td>{topic.id}</td>
                              <td>{JSON.parse(topic.title).en}</td>
                              <td>{subject ? JSON.parse(subject.title).en : 'N/A'}</td>
                              <td>{level ? JSON.parse(level.title).en : 'N/A'}</td>
                              <td>{String(topic.status) === '1' ? 'Active' : 'Inactive'}</td>
                              <td>
                                <button className="btn btn-secondary btn-sm me-2" onClick={() => openEditModal(topic)}>
                                  <IconEdit /> Edit
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => openDeleteModal(topic)}>
                                  <IconTrash /> Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Pagination Controls */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Topic/Set Modal */}
        {showTopicAddModal && (
        <div className="modal d-block bg-black bg-opacity-50" tabIndex={-1}>
            <div className="modal-dialog">
            <div className="modal-content">
                <div className="modal-header">
                <h5 className="modal-title">Add New Set/Topic</h5>
                <button type="button" className="btn-close" onClick={() => setShowTopicAddModal(false)}></button>
                </div>
                <div className="modal-body">
                <div className="mb-2">
                    <label className="form-label">Topic Title</label>
                    <input 
                    type="text" 
                    className="form-control" 
                    value={newTopic.title} 
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                    />
                </div>
                <div className="mb-2">
                    <label className="form-label">Subject</label>
                    <select 
                    className="form-select" 
                    value={newTopic.la_subject_id || ""}
                    onChange={(e) => setNewTopic({ ...newTopic, la_subject_id: e.target.value })}
                    >
                    <option value=''>Select Subject</option>
                    {subjects.map((sub: Subject) => (
                        <option key={sub.id} value={sub.id}>
                        {JSON.parse(sub.title).en}
                        </option>
                    ))}
                    </select>
                </div>
                <div className="mb-2">
                    <label className="form-label">Level</label>
                    <select 
                    className="form-select" 
                    value={newTopic.la_level_id || ""}
                    onChange={(e) => setNewTopic({ ...newTopic, la_level_id: e.target.value })}
                    >
                    <option value=''>Select Level</option>
                    {levels.map((lv: Level) => (
                        <option key={lv.id} value={lv.id}>
                        {JSON.parse(lv.title).en}
                        </option>
                    ))}
                    </select>
                </div>
                <div className="mb-2">
                    <label className="form-label">Status</label>
                    <select 
                    className="form-select" 
                    value={newTopic.status}
                    onChange={(e) => setNewTopic({ ...newTopic, status: e.target.value })}
                    >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                    </select>
                </div>
                {/* New Type Dropdown */}
                <div className="mb-2">
                    <label className="form-label">Type</label>
                    <select 
                    className="form-select" 
                    value={newTopic.type}
                    onChange={(e) => setNewTopic({ ...newTopic, type: e.target.value })}
                    >
                    <option value="2">Quiz</option>
                    <option value="3">Riddle</option>
                    <option value="4">Puzzle</option>
                    </select>
                </div>
                </div>
                <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleAddTopic}>Submit</button>
                </div>
            </div>
            </div>
        </div>
        )}


      {/* Edit Topic Modal */}
      {showEditModal && topicToEdit && (
        <div className="modal d-block bg-black bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Topic</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Topic Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={topicToEdit.title || ""}
                    onChange={(e) => setTopicToEdit({ ...topicToEdit!, title: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-select"
                    value={topicToEdit.la_subject_id || ""}
                    onChange={(e) => setTopicToEdit({ ...topicToEdit!, la_subject_id: e.target.value })}
                  >
                    <option value=''>Select Subject</option>
                    {subjects.map((sub: Subject) => (
                      <option key={sub.id} value={sub.id}>
                        {JSON.parse(sub.title).en}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Level</label>
                  <select
                    className="form-select"
                    value={topicToEdit.la_level_id || ""}
                    onChange={(e) => setTopicToEdit({ ...topicToEdit!, la_level_id: e.target.value })}
                  >
                    <option value=''>Select Level</option>
                    {levels.map((lv: Level) => (
                      <option key={lv.id} value={lv.id}>
                        {JSON.parse(lv.title).en}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={topicToEdit.status || "1"}
                    onChange={(e) => setTopicToEdit({ ...topicToEdit!, status: e.target.value })}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleUpdateTopic}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Topic Modal */}
      {showDeleteModal && topicToDelete && (
        <div className="modal d-block bg-black bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete Topic</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete the topic: {JSON.parse(topicToDelete.title).en}?
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDeleteTopic}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

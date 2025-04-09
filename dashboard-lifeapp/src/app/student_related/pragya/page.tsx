'use client'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/ui/sidebar';
import '@tabler/core/dist/css/tabler.min.css';
import NumberFlow from '@number-flow/react';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { ChevronDown } from 'lucide-react';

import { IconLoader2 } from '@tabler/icons-react';

const inter = Inter({ subsets: ['latin'] });
// const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
const api_startpoint = 'http://152.42.239.141:5000'


interface Mission {
    id: number;
    title: string;
    description: string;
    question: string;
    type: string;
    allow_for: string;
    subject: string;
    level: string;
    status: number;
}

export default function StudentRelatedPragya() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [levels, setLevels] = useState<any[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        level: '',
        type: '',
        allow_for: '',
        title: '',
        description: '',
        question: '',
        image: null,
        document: null,
        status: ''
    });

    const itemsPerPage = 10;
    
    
    const fetchMissions = async () => {
        try {
        const res = await fetch(`${api_startpoint}/api/missions_resource`, {
            method:'POST'
        });
        const data = await res.json();
        setMissions(data);
        } catch (err) {
        console.error('Error fetching missions:', err);
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchMissions();

        fetch(`${api_startpoint}/api/subjects_list`, { method: 'POST' })
        .then(res => res.json())
        .then(setSubjects);

        fetch(`${api_startpoint}/api/levels`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify({ page: 1 })
          })
            .then(res => res.json())
            .then(data => {
              console.log('Levels response:', data);
              setLevels(data);  // <- might need to change to setLevels(data.levels) or similar
            });
    }, []);
  
    

    const handleInputChange = (e: any) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({ ...prev, [name]: files ? files[0] : value }));
    };
    
    const handleSubmit = async () => {
        const form = new FormData();
        Object.entries(formData).forEach(([key, val]) => {
            if (val !== null && val !== undefined) {
              form.append(key, val);
            }
        });
          

        const res = await fetch(`${api_startpoint}/api/add_mission`, {
            method: 'POST',
            body: form
        });

        const result = await res.json();
        if (res.ok) {
            fetchMissions();
            setOpenModal(false);
        } else {
            alert('Error: ' + result.error);
        }
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [missionToDelete, setMissionToDelete] = useState<any>(null);


    const handleDelete = async () => {
        const res = await fetch(`${api_startpoint}/api/delete_mission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: missionToDelete?.id })
        });
    
        if (res.ok) {
        setMissions(prev => prev.filter(m => m.id !== missionToDelete.id));
        setShowDeleteModal(false);
        } else {
        alert('Failed to delete mission.');
        }
    };
  
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    const handleEditChange = (field: string, value: any) => {
        setEditData((prev: any) => ({
          ...prev,
          [field]: value
        }));
    };
    

    const handleEditSubmit = async () => {
        const formData = new FormData();
        for (const key in editData) {
          if (editData[key] != null) {
            formData.append(key, editData[key]);
          }
        }
      
        const res = await fetch(`${api_startpoint}/api/update_mission`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: formData,
        });
      
        if (res.ok) {
          const updated = await res.json();
          if (updated.success) {
            setMissions((prev) =>
              prev.map((m) => (m.id === editData.id ? { ...m, ...editData } : m))
            );
            setShowEditModal(false);
          }
        } else {
          alert('Update failed');
        }
    };
    
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('Pragya');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [filteredData, setFilteredData] = useState<Mission[]>([]);

    // Replace the handleSearch function with useEffect
    useEffect(() => {
    const filtered = missions.filter((mission) => {
      return (
        (filterStatus === '' || String(mission.status) === filterStatus) &&
        (filterType === '' || String(mission.type) === filterType) &&
        (filterSubject === '' || String(mission.subject) === filterSubject) &&
        (filterLevel === '' || String(mission.level) === filterLevel)
      );
    });
    setFilteredData(filtered);
  }, [missions, filterStatus, filterType, filterSubject, filterLevel]);  // Add dependencies

    const handleClearFilters = () => {
    setFilterStatus('');
    setFilterType('');
    setFilterSubject('');
    setFilteredData(missions);
    };

    // useEffect(() => {
    // setFilteredData(missions); // initially show all
    // }, [missions]);

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentMissions = filteredData.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
      }, [filteredData]);
    return (
        <div className={`page bg-body ${inter.className} font-sans`}>
            <Sidebar />
            <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                <div className="page-body">
                    <div className="container-xl pt-4 pb-4 space-y-4">
                        <h2 className="text-xl font-semibold">Pragya</h2>
                        <button className="px-4 py-2 bg-sky-900 text-white rounded w-[15%]" onClick={() => setOpenModal(true)}>Add New Pragya</button>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-800"></div>
                            </div>
                        ) : (
                            <>
                            <div className="overflow-x-auto">
                                <div className="mb-4 p-4 bg-gray-100 rounded-xl flex flex-wrap items-center gap-4">
                                    {/* Status Filter */}
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="border rounded px-3 py-2"
                                    >
                                        <option value="">All Status</option>
                                        <option value="1">Active</option>
                                        <option value="0">Inactive</option>
                                    </select>

                                    {/* Type Filter */}
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="border rounded px-3 py-2"
                                    >
                                        <option value="">All Types</option>
                                        <option value="Pragya">Pragya</option>
                                        <option value="Jigyasa">Jigyasa</option>
                                        <option value="Mission">Mission</option>
                                        {/* <option value="Quiz">Quiz</option>
                                        <option value="Riddle">Riddle</option>
                                        <option value="Puzzle">Puzzle</option> */}
                                        
                                    </select>

                                    {/* Subject Filter */}
                                    <select
                                        value={filterSubject}
                                        onChange={(e) => setFilterSubject(e.target.value)}
                                        className="border rounded px-3 py-2"
                                    >
                                        <option value="">All Subjects</option>
                                        {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.title}>
                                            {JSON.parse(subject.title).en}
                                        </option>
                                        ))}
                                    </select>
                                    <select
                                        className="border rounded px-3 py-2"
                                        value={filterLevel}
                                        onChange={(e) => setFilterLevel(e.target.value)}
                                    >
                                        <option value="">All</option>
                                        {levels.map((level, idx) => (
                                        <option key={idx} value={level.title}>
                                            {JSON.parse(level.title).en}
                                        </option>
                                        ))}
                                    </select>
                                    
                                    {/* Action Buttons */}
                                    {/* <button
                                        onClick={() => handleSearch()}
                                        className="bg-sky-950 text-white px-4 py-2 rounded"
                                    >
                                        Search
                                    </button> */}
                                    <button
                                         onClick={() => {
                                            setFilterStatus('');
                                            setFilterType('Pragya');
                                            setFilterSubject('');
                                            setFilterLevel('');
                                          }}
                                        className="border border-gray-800 text-gray-700 px-4 py-2 rounded"
                                    >
                                        Clear
                                    </button>
                                </div>

                                <table className="min-w-full table-auto border border-gray-200 rounded-lg">
                                <thead className="bg-gray-100 text-sm">
                                    <tr>
                                    <th className="p-2 border">ID</th>
                                    <th className="p-2 border">Title</th>
                                    <th className="p-2 border">Description</th>
                                    <th className="p-2 border">Question</th>
                                    <th className="p-2 border">Type</th>
                                    <th className="p-2 border">Allow For</th>
                                    <th className="p-2 border">Subject</th>
                                    <th className="p-2 border">Level</th>
                                    <th className="p-2 border">Status</th>
                                    <th className="p-2 border">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentMissions.map((m) => (
                                    <tr key={m.id} className="text-sm">
                                        <td className="p-2 border">{m.id}</td>
                                        <td className="p-2 border">{JSON.parse(m.title).en}</td>
                                        <td className="p-2 border">{JSON.parse(m.description).en}</td>
                                        <td className="p-2 border">{JSON.parse(m.question).en}</td>
                                        <td className="p-2 border">{m.type}</td>
                                        <td className="p-2 border">{m.allow_for}</td>
                                        <td className="p-2 border">{JSON.parse(m.subject).en}</td>
                                        <td className="p-2 border">{JSON.parse(m.level).en}</td>
                                        <td className="p-2 border">{m.status == 1? 'Active': 'Inactive'}</td>
                                        <td className="p-2 border flex gap-2 justify-center">
                                            <div className=" ">
                                            <IconEdit className="text-blue-500 cursor-pointer" 
                                                onClick={() => {
                                                    setEditData(m); // `m` is your mission row
                                                    setShowEditModal(true);
                                                }}
                                            />
                                            <IconTrash className="text-red-500 cursor-pointer" 
                                                onClick={() => {
                                                    setMissionToDelete(m);
                                                    setShowDeleteModal(true);
                                                }} 
                                            />
                                            </div>
                                        
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                                <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-1 bg-sky-950 text-white rounded disabled:opacity-50"
                                >
                                Previous
                                </button>
                                <span className="text-sm">
                                Page {currentPage} of {totalPages} ({filteredData.length} rows found)
                                </span>
                                <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-1 bg-sky-950 text-white rounded disabled:opacity-50"
                                >
                                Next
                                </button>
                            </div>
                            </>
                        )}


                        {openModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 mt-0 flex justify-center items-center z-50">
                                <div className="bg-white p-6 gap-1 rounded-xl shadow-lg max-w-xl w-full ">
                                    <h2 className="text-xl font-semibold mb-4">Add New Mission</h2>

                                    <label className="block mt-2">Subject</label>
                                    <select name="subject" className="w-full border rounded p-2" onChange={handleInputChange}>
                                    <option value="">Select subject</option>
                                    {subjects.map((s: any) => <option key={s.id} value={s.id}>{JSON.parse(s.title).en}</option>)}
                                    </select>

                                    <label className="block mt-2">Level</label>
                                    <select name="level" className="w-full border rounded p-2" onChange={handleInputChange}>
                                    <option value="">Select level</option>
                                    {levels.map((l: any) => <option key={l.id} value={l.id}>{JSON.parse(l.title).en}</option>)}
                                    </select>

                                    <label className="block mt-2">Type</label>
                                    <select name="type" className="w-full border rounded p-2" onChange={handleInputChange}>
                                    <option value="">Select type</option>
                                    <option value="1">Mission</option>
                                    {/* <option value="2">Quiz</option>
                                    <option value="3">Riddle</option>
                                    <option value="4">Puzzle</option> */}
                                    <option value="5">Jigyasa</option>
                                    <option value="6">Pragya</option>
                                    </select>

                                    <label className="block mt-2">Allow For</label>
                                    <select name="allow_for" className="w-full border rounded p-2" onChange={handleInputChange}>
                                    <option value="">Select audience</option>
                                    <option value="1">All</option>
                                    <option value="2">Teacher</option>
                                    </select>

                                    <label className="block mt-2">Status</label>
                                    <select name="status" className="w-full border rounded p-2" onChange={handleInputChange}>
                                        <option value="">Select Status</option>
                                        <option value="1">Active</option>
                                        <option value="0">Inactive</option>
                                    </select>

                                    <label className="block mt-2">Title</label>
                                    <input type="text" name="title" className="w-full border rounded p-2" onChange={handleInputChange} />

                                    <label className="block mt-2">Description</label>
                                    <textarea name="description" className="w-full border rounded p-2" onChange={handleInputChange} />

                                    <label className="block mt-2">Question</label>
                                    <textarea name="question" className="w-full border rounded p-2" onChange={handleInputChange} />

                                    <label className="block mt-2">Image</label>
                                    <input type="file" name="image" className="w-full" onChange={handleInputChange} />

                                    <label className="block mt-2">Document</label>
                                    <input type="file" name="document" className="w-full" onChange={handleInputChange} />

                                    <div className="mt-2 flex justify-between">
                                    <button className="px-4 py-2 bg-gray-900 rounded" onClick={() => setOpenModal(false)}>Cancel</button>
                                    <button className="px-4 py-2 bg-sky-950 text-white rounded" onClick={handleSubmit}>Submit</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showDeleteModal && (
                            <div className="fixed inset-0 bg-black bg-opacity-50  mt-0 flex justify-center items-center z-50">
                                <div className="bg-white rounded-xl shadow p-6 w-full max-w-md">
                                <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
                                <p>Are you sure you want to delete <strong>{JSON.parse(missionToDelete?.title).en}</strong>?</p>
                                <div className="flex justify-end gap-4 mt-6">
                                    <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-1 rounded border border-gray-400"
                                    >
                                    Cancel
                                    </button>
                                    <button
                                    onClick={handleDelete}
                                    className="px-4 py-1 rounded bg-red-600 text-white"
                                    >
                                    Delete
                                    </button>
                                </div>
                                </div>
                            </div>
                        )}


                        {showEditModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 mt-0 flex justify-center items-center z-50">
                            <div className="bg-white rounded-xl shadow p-6 w-full max-w-lg">
                            <h2 className="text-xl font-semibold mb-4">Edit Mission</h2>
                            <div className="flex flex-col gap-1">
                                <label className="block mt-1">Title</label>
                                <input
                                value={editData.title}
                                onChange={(e) => handleEditChange('title', e.target.value)}
                                placeholder="Title"
                                className="border px-3 py-1 rounded"
                                />
                                <label className="block mt-1">Description</label>
                                <textarea
                                value={editData.description}
                                onChange={(e) => handleEditChange('description', e.target.value)}
                                placeholder="Description"
                                className="border px-3 py-1 rounded"
                                />

                                <label className="block mt-1">Question</label>
                                <textarea
                                value={editData.question}
                                onChange={(e) => handleEditChange('question', e.target.value)}
                                placeholder="Question"
                                className="border px-3 py-1 rounded"
                                />

                                {/* Subject */}
                                <label className="block mt-1">Subject</label>
                                <select
                                value={editData.subject}
                                onChange={(e) => handleEditChange('subject', e.target.value)}
                                className="border px-3 py-1 rounded"
                                >
                                <option value="">Select Subject</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>
                                    {JSON.parse(s.title).en}
                                    </option>
                                ))}
                                </select>

                                {/* Level */}
                                <label className="block mt-1">Level</label>
                                <select
                                value={editData.level}
                                onChange={(e) => handleEditChange('level', e.target.value)}
                                className="border px-3 py-1 rounded"
                                >
                                <option value="">Select Level</option>
                                {levels.map((l) => (
                                    <option key={l.id} value={l.id}>
                                    {JSON.parse(l.title).en}
                                    </option>
                                ))}
                                </select>

                                {/* Type */}
                                <label className="block mt-1">Type</label>
                                <select
                                value={editData.type}
                                onChange={(e) => handleEditChange('type', e.target.value)}
                                className="border px-3 py-1 rounded"
                                >
                                <option value="1">Mission</option>
                                <option value="2">Quiz</option>
                                <option value="3">Riddle</option>
                                <option value="4">Puzzle</option>
                                <option value="5">Jigyasa</option>
                                <option value="6">Pragya</option>
                                </select>

                                {/* Allow For */}
                                <label className="block mt-1">Allow For</label>
                                <select
                                value={editData.allow_for}
                                onChange={(e) => handleEditChange('allow_for', e.target.value)}
                                className="border px-3 py-1 rounded"
                                >
                                <option value="1">All</option>
                                <option value="2">Teacher</option>
                                </select>

                                {/* Status */}
                                <label className="block mt-1">Status</label>
                                <select
                                value={editData.status}
                                onChange={(e) => handleEditChange('status', e.target.value)}
                                className="border px-3 py-1 rounded"
                                >
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                                </select>

                                <div className="flex justify-end gap-4 mt-4">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-1 border rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditSubmit}
                                    className="px-4 py-1 bg-sky-950 text-white rounded"
                                >
                                    Save
                                </button>
                                </div>
                            </div>
                            </div>
                        </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
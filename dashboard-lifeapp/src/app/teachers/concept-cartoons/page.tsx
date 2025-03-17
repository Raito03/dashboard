'use client'
import '@tabler/core/dist/css/tabler.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect, useRef, useMemo, useCallback  } from 'react'
// import NumberFlow from '@number-flow/react'
import React from 'react';
import { Poppins } from 'next/font/google';
import Sidebar from '../../sidebar';
import { IconSearch, IconBell, IconSettings, IconUserFilled, IconUserExclamation, IconUser, IconUserScan } from '@tabler/icons-react';


import {
  BarChart3,
  ChevronDown,
  Download,
  Plus,
  Search,
  XCircle,
} from "lucide-react";

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '600', '700'], // Choose needed weights
    variable: '--font-poppins', // Matches the CSS variable
});


export default function conceptCartoons() {
    const [tableData, setTableData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const rowsPerPage = 50;
    const [isTableLoading, setIsTableLoading] = useState(false);
    const paginatedData = tableData.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const handleClear = () => {
        setSelectedStatus("");
        setSelectedSubject("");
        // Clear other filters...
        setTableData([]);
    };
    const handleSearch = async () =>{
        const filters = {
            status: selectedStatus,
            subject: selectedSubject
        };
        
        setIsTableLoading(true);
    
        try {
            const res = await fetch('http://127.0.0.1:5000/api/teacher_concept_cartoons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });
            
            if (!res.ok) {
                throw new Error(`API responded with status: ${res.status}`);
            }
            
            const data = await res.json();
            
            // Debug the response
            console.log("API response:", data);
            
            // Check if data is an array or can be converted to one
            if (Array.isArray(data)) {
                setTableData(data);
            } else if (data && typeof data === 'object') {
                // If it's an object with numeric keys, convert to array
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
            
            setCurrentPage(0); // Reset to first page on new search
        } catch (error) {
            console.error("Search error:", error);
            setTableData([]);
        } finally {
            setIsTableLoading(false);
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
                                    // onClick={handleSearch}
                                    >
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
    )
}
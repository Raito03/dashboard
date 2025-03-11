'use client'
import '@tabler/core/dist/css/tabler.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect, useRef, useMemo, useCallback  } from 'react'
import NumberFlow from '@number-flow/react'
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
interface SearchableDropdownProps {
    options: string[];
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    isLoading?: boolean; // Add this prop
}

function SearchableDropdown({ options, placeholder, value, onChange, isLoading = false }: SearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ✅ Debounce input changes to optimize search performance
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchTerm(searchTerm);
        }, 300); // 300ms debounce delay

        return () => clearTimeout(handler);
    }, [searchTerm]);

    // ✅ Use useMemo to avoid filtering on every render
    const filteredOptions = useMemo(() => {
        return options.filter((option) =>
            typeof option === "string" && option.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

  
    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className="flex w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? "text-gray-900" : "text-gray-500"}>
                    {isLoading ? "Loading..." : (value || placeholder)}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500"/>
            </div>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="p-2">
                        <input
                            type="text"
                            className="w-full rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-purple-500 focus:outline-none"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-48 overflow-auto">
                        {filteredOptions.map((option, index) => (
                            <div
                                key={index}
                                className="cursor-pointer px-3 py-2 text-gray-900 hover:bg-purple-50"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                    setSearchTerm("");
                                }}
                            >
                                {option}
                            </div>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div className="px-3 py-2 text-gray-500">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
  

export default function schoolDashboard() {
    const [totalStudents, setTotalStudents] = useState<number>(0)
    const [selectedState, setSelectedState] = useState("");
    useEffect(() => {
        async function fetchStudentCount() {
        try {
            const res = await fetch('http://127.0.0.1:5000/api/total-student-count')
            const data = await res.json()
            if (data && data.length > 0) {
                setTotalStudents(data[0].count)
            }
        } catch (error) {
            console.error('Error fetching user count:', error)
        }
        }
        fetchStudentCount()
    }, [])

    const [states, setStates] = useState<string[]>([]);
    useEffect(() => {
        async function fetchStates() {
            try {
                const res = await fetch('http://127.0.0.1:5000/api/state_list')
                const data: { state: string }[] = await res.json();
                if (Array.isArray(data)) {
                    setStates(data.map((item) => (item.state ? item.state : "")));
                } else {
                    console.error("Unexpected API response format:", data);
                    setStates([]);
                }
            } catch (error) {
                console.error("Error fetching state list:", error);
                setStates([]);
            }
            }
            fetchStates()
        }, []
    )
    
    const [city, setCity] = useState<string[]>([])
    const [selectedCity, setSelectedCity] = useState("")
    const [isCityLoading, setIsCityLoading] = useState(false)
    
    // Fetch cities properly using useEffect
    useEffect(() => {
        async function fetchCity() {
            setIsCityLoading(true)
            try {
                const res = await fetch('http://127.0.0.1:5000/api/city_list')
                const data: { city: string }[] = await res.json();
                if (Array.isArray(data)) {
                    setCity(data.map((item) => item.city));
                } else {
                    console.error("Unexpected API response format:", data);
                    setCity([]);
                }
            } catch (error) {
                console.error("Error fetching city list:", error);
                setCity([]);
            } finally {
                setIsCityLoading(false)
            }
        }
        
        fetchCity()
    }, []) 
 
 
    
   
    return(
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
                    {/* Metrics Grid */}
                    <div className="row g-4 mb-4">
                        {[
                            { title: 'Total Students', value: totalStudents, icon: <IconUser />, color: 'bg-purple' },
                            { title: 'Active Students', value: 256, icon: <IconUserFilled />, color: 'bg-teal' },
                            { title: 'Inactive Students', value: 2559, icon: <IconUserExclamation />, color: 'bg-orange' },
                            { title: 'Highest Online User Count', value: 36987, icon: <IconUserScan />, color: 'bg-blue', suffix: '' },
                        ].map((metric, index) => (
                            <div className="col-12 col-sm-6 col-xl-3" key={index}>
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-body">
                                <div className="d-flex align-items-center gap-3">
                                    <div className={`${metric.color} rounded-circle p-3 text-white`}>
                                    {React.cloneElement(metric.icon, { size: 24 })}
                                    </div>
                                    <div>
                                    <div className="text-muted mb-1">{metric.title}</div>
                                    <div className="h2 mb-0">
                                        <NumberFlow
                                        value={metric.value}
                                        suffix={metric.suffix || ''}
                                        className="fw-bold text-dark"
                                        transformTiming={{endDelay:6, duration:750, easing:'cubic-bezier(0.42, 0, 0.58, 1)'}}
                                        />
                                    </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                        ))}
                    </div>


                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Search & Filter</h5>
                            <div className="row g-3">
                                {/* Dropdowns Row 1 */}
                                <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select">
                                        <option value="">All Missions</option>
                                        <option value="mission1">Mission 1</option>
                                        <option value="mission2">Mission 2</option>
                                        <option value="mission3">Mission 3</option>
                                    </select>
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select">
                                        <option value="">Select School</option>
                                        <option value="school1">School 1</option>
                                        <option value="school2">School 2</option>
                                        <option value="school3">School 3</option>
                                    </select>
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select">
                                        <option value="">Select Grade</option>
                                        <option value="1">Grade 1</option>
                                        <option value="2">Grade 2</option>
                                        <option value="3">Grade 3</option>
                                        <option value="4">Grade 4</option>
                                        <option value="5">Grade 5</option>
                                    </select>
                                </div>

                                <div className="col-12 col-md-6 col-lg-3">
                                    <SearchableDropdown
                                        options={states}
                                        placeholder="Select State"
                                        value={selectedState}
                                        onChange={setSelectedState}
                                        
                                    />
                                </div>

                                {/* Dropdowns Row 2 */}
                                <div className="col-12 col-md-6 col-lg-3">
                                    <SearchableDropdown
                                        options={city}
                                        placeholder="Select city"
                                        value={selectedCity}
                                        onChange={setSelectedCity}
                                        isLoading={isCityLoading}
                                    />
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select">
                                        <option value="">Select Mission Requested</option>
                                        <option value="requested1">Requested 1</option>
                                        <option value="requested2">Requested 2</option>
                                        <option value="requested3">Requested 3</option>
                                    </select>
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select">
                                        <option value="">Select Mission Approved</option>
                                        <option value="approved1">Approved 1</option>
                                        <option value="approved2">Approved 2</option>
                                        <option value="approved3">Approved 3</option>
                                    </select>
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select">
                                        <option value="">Select Earn Coins</option>
                                        <option value="0-100">0-100 Coins</option>
                                        <option value="101-500">101-500 Coins</option>
                                        <option value="501-1000">501-1000 Coins</option>
                                        <option value="1000+">1000+ Coins</option>
                                    </select>
                                </div>

                                {/* Dropdowns & Inputs Row 3 */}
                                <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select">
                                        <option value="">Select User Type</option>
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <input
                                        type="date"
                                        placeholder="From Date"
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <input
                                        type="date"
                                        placeholder="To Date"
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <input
                                        type="tel"
                                        placeholder="Search With Mobile Number"
                                        className="form-control"
                                    />
                                </div>

                                {/* Inputs Row 4 */}
                                <div className="col-12 col-md-6 col-lg-3">
                                    <input
                                        type="text"
                                        placeholder="Search With District Name"
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <input
                                        type="text"
                                        placeholder="Search With Block Name"
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <input
                                        type="text"
                                        placeholder="Search With Cluster Name"
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <input
                                        type="text"
                                        placeholder="Search With School code"
                                        className="form-control"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="d-flex flex-wrap gap-2 mt-4">
                                <button className="btn btn-success d-inline-flex align-items-center">
                                    <Search className="me-2" size={16} />
                                    Search
                                </button>
                                
                                <button className="btn btn-warning d-inline-flex align-items-center text-dark">
                                    <XCircle className="me-2" size={16} />
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex flex-wrap gap-2">
                        <button className="btn btn-purple d-inline-flex align-items-center text-white" style={{ backgroundColor: '#6f42c1' }}>
                            <Download className="me-2" size={16} />
                            Export
                        </button>

                        <button className="btn btn-success d-inline-flex align-items-center">
                            <Plus className="me-2" size={16} />
                            Add Student
                        </button>

                        <button className="btn btn-purple d-inline-flex align-items-center text-white" style={{ backgroundColor: '#6f42c1' }}>
                            <BarChart3 className="me-2" size={16} />
                            View Graph
                        </button>
                    </div>

                </div>
            </div>


        </div>
    )
} 
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
    isLoading?: boolean;
    maxDisplayItems?: number;
}

function SearchableDropdown({
    options,
    placeholder,
    value,
    onChange,
    isLoading = false,
    maxDisplayItems = 100
}: SearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Implement debounce manually
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm]);

    // Virtual list approach for large datasets
    const filteredOptions = useMemo(() => {
        if (!debouncedSearchTerm.trim()) {
            return options.slice(0, maxDisplayItems);
        }
        
        const searchLower = debouncedSearchTerm.toLowerCase();
        
        // Use more efficient filtering for large datasets
        return options
            .filter(option => 
                typeof option === "string" && 
                option.toLowerCase().includes(searchLower)
            )
            .slice(0, maxDisplayItems);
    }, [options, debouncedSearchTerm, maxDisplayItems]);

    // Handle clicks outside the dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
        setSearchTerm("");
        setDebouncedSearchTerm("");
    };
  
    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className="flex w-full cursor-pointer items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                onClick={() => setIsOpen(!isOpen)}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
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
                            autoFocus
                        />
                    </div>
                    <div className="max-h-48 overflow-auto">
                        {isLoading ? (
                            <div className="px-3 py-2 text-gray-500">Loading options...</div>
                        ) : (
                            <>
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option, index) => (
                                        <div
                                            key={index}
                                            className="cursor-pointer px-3 py-2 text-gray-900 hover:bg-purple-50"
                                            onClick={() => handleSelect(option)}
                                        >
                                            {option}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-gray-500">No results found</div>
                                )}
                                {options.length > maxDisplayItems && filteredOptions.length === maxDisplayItems && (
                                    <div className="px-3 py-2 text-gray-500 text-xs">
                                        Showing first {maxDisplayItems} results. Refine your search to see more.
                                    </div>
                                )}
                            </>
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
    const [isStatesLoading, setIsStatesLoading] = useState(false);

    useEffect(() => {
        async function fetchStates() {
            // Check cache first
            const cachedStates = sessionStorage.getItem('stateList');
            if (cachedStates) {
                setStates(JSON.parse(cachedStates));
                return;
            }
            
            setIsStatesLoading(true);
            try {
                const res = await fetch('http://127.0.0.1:5000/api/state_list');
                const data: { state: string }[] = await res.json();
                
                if (Array.isArray(data)) {
                    const stateList = data
                        .map((item) => (item.state ? item.state.trim() : ""))
                        .filter(state => state !== ""); // Filter out empty states
                    
                    setStates(stateList);
                    // Cache the results
                    sessionStorage.setItem('stateList', JSON.stringify(stateList));
                } else {
                    console.error("Unexpected API response format:", data);
                    setStates([]);
                }
            } catch (error) {
                console.error("Error fetching state list:", error);
                setStates([]);
            } finally {
                setIsStatesLoading(false);
            }
        }
        
        fetchStates();
    }, []);

    // For city fetching - optimized but independent of state
    const [cities, setCities] = useState<string[]>([]);
    const [isCitiesLoading, setIsCitiesLoading] = useState(false);
    const [selectedCity, setSelectedCity] = useState("");
    useEffect(() => {
        async function fetchCities() {
            // Check cache first
            const cachedSchools = sessionStorage.getItem('cityList');
            if (cachedSchools) {
                setCities(JSON.parse(cachedSchools));
                return;
            }
            
            setIsCitiesLoading(true);
            try {
                const res = await fetch('http://127.0.0.1:5000/api/city_list');
                const data: { city: string }[] = await res.json();
                
                if (Array.isArray(data)) {
                    // Process data in chunks to avoid UI freezing with large datasets
                    const processCityBatch = (startIndex: number, batchSize: number) => {
                        const endIndex = Math.min(startIndex + batchSize, data.length);
                        const batch = data
                            .slice(startIndex, endIndex)
                            .map(item => item.city ? item.city.trim() : "")
                            .filter(city => city !== "");
                        
                        setCities(prevCities => [...prevCities, ...batch]);
                        
                        if (endIndex < data.length) {
                            // Process next batch in the next tick to avoid blocking the UI
                            setTimeout(() => processCityBatch(endIndex, batchSize), 0);
                        } else {
                            // All done, cache the results
                            sessionStorage.setItem('cityList', JSON.stringify([...cities, ...batch]));
                            setIsCitiesLoading(false);
                        }
                    };
                    
                    // Start processing in batches (100 items at a time)
                    setCities([]); // Reset before starting
                    processCityBatch(0, 100);
                } else {
                    console.error("Unexpected API response format:", data);
                    setCities([]);
                    setIsCitiesLoading(false);
                }
            } catch (error) {
                console.error("Error fetching city list:", error);
                setCities([]);
                setIsCitiesLoading(false);
            }
        }
        
        fetchCities();
    }, []);
 
    


    // For city fetching - optimized but independent of state
    const [schools, setSchools] = useState<string[]>([]);
    const [isSchoolsLoading, setIsSchoolsLoading] = useState(false);
    const [selectedSchools, setSelectedSchools] = useState("");
    useEffect(() => {
        async function fetchSchools() {
            // Check cache first
            const cachedSchools = sessionStorage.getItem('SchoolList');
            if (cachedSchools) {
                setSchools(JSON.parse(cachedSchools));
                return;
            }
            
            setIsSchoolsLoading(true);
            try {
                const res = await fetch('http://127.0.0.1:5000/api/school_list');
                const data: { name: string }[] = await res.json();
                
                if (Array.isArray(data)) {
                    // Process data in chunks to avoid UI freezing with large datasets
                    const processSchoolsBatch = (startIndex: number, batchSize: number) => {
                        const endIndex = Math.min(startIndex + batchSize, data.length);
                        const batch = data
                            .slice(startIndex, endIndex)
                            .map(item => item.name ? item.name.trim() : "")
                            .filter(name => name !== "");
                        
                        setSchools(prevSchools => [...prevSchools, ...batch]);
                        
                        if (endIndex < data.length) {
                            // Process next batch in the next tick to avoid blocking the UI
                            setTimeout(() => processSchoolsBatch(endIndex, batchSize), 0);
                        } else {
                            // All done, cache the results
                            sessionStorage.setItem('SchoolList', JSON.stringify([...schools, ...batch]));
                            setIsSchoolsLoading(false);
                        }
                    };
                    
                    // Start processing in batches (100 items at a time)
                    setSchools([]); // Reset before starting
                    processSchoolsBatch(0, 100);
                } else {
                    console.error("Unexpected API response format:", data);
                    setSchools([]);
                    setIsSchoolsLoading(false);
                }
            } catch (error) {
                console.error("Error fetching School list:", error);
                setSchools([]);
                setIsSchoolsLoading(false);
            }
        }
        
        fetchSchools();
    }, []);
    



    const [selectedGrade, setSelectedGrade] = useState("");
    const [selectedMissionType, setSelectedMissionType] = useState("");
    const [selectedMissionAcceptance, setSelectedMissionAcceptance] = useState("")
    const [selectedMissionRequestedNo, setSelectedMissionRequestedNo] = useState("")
    const [selectedMissionAcceptedNo, setSelectedMissionAcceptedNo] =useState("")
    const [selectedEarnCoins, setSelectedEarnCoins] = useState("");
    const [selectedFromDate, setSelectedFromDate] = useState(""); // New state for From Date
    const [selectedToDate, setSelectedToDate] = useState("");     // New state for To Date
    const [tableData, setTableData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const rowsPerPage = 50;
    const [isTableLoading, setIsTableLoading] = useState(false);
    // Handler for search button
    const handleSearch = async () => {
        const filters = {
            state: selectedState,
            school: selectedSchools,
            city: selectedCity,
            grade: selectedGrade,
            mission_type: selectedMissionType,
            mission_acceptance: selectedMissionAcceptance,
            mission_requested_no: selectedMissionRequestedNo, // Add these filters
            mission_accepted_no: selectedMissionAcceptedNo,    // Add these filters
            earn_coins: selectedEarnCoins, // Add this line
            from_date: selectedFromDate, // Include the From Date filter
            to_date: selectedToDate      // Include the To Date filter
        };

        setIsTableLoading(true); // Set loading to true when search starts

        try {
            const res = await fetch('http://127.0.0.1:5000/api/student_dashboard_search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });
            const data = await res.json();
            setTableData(data);
            setCurrentPage(0); // Reset to first page on new search
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsTableLoading(false); // Set loading to false when search completes (success or error)
        }
    };

    // Determine paginated data
    const paginatedData = tableData.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);


    const handleClear = () => {
        setSelectedState("");
        setSelectedCity("");
        setSelectedSchools("");
        setSelectedGrade("");
        setSelectedMissionType("");
        setSelectedMissionAcceptance("");
        setSelectedMissionAcceptedNo("");
        setSelectedMissionRequestedNo("");
        setSelectedEarnCoins("");
        setSelectedFromDate(""); // Clear the From Date
        setSelectedToDate("");   // Clear the To Date
        // Clear other filters...
        setTableData([]);
    };

    // Add this function in your schoolDashboard component before the return statement

    const exportToCSV = () => {
        // Return early if there's no data to export
        if (tableData.length === 0) {
        alert("No data to export. Please perform a search first.");
        return;
        }
    
        try {
        // Get all the headers (keys) from the first data row
        const headers = Object.keys(tableData[0]);
        
        // Create CSV header row
        let csvContent = headers.join(',') + '\n';
        
        // Add data rows
        tableData.forEach(row => {
            const values = headers.map(header => {
            const cellValue = row[header] === null || row[header] === undefined ? '' : row[header];
            
            // Handle values that contain commas, quotes, or newlines
            const escapedValue = String(cellValue).replace(/"/g, '""');
            
            // Wrap in quotes to handle special characters
            return `"${escapedValue}"`;
            });
            
            csvContent += values.join(',') + '\n';
        });
        
        // Create a blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link element and trigger the download
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `student_data_export_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        } catch (error) {
        console.error("Error exporting CSV:", error);
        alert("An error occurred while exporting data. Please try again.");
        }
    };
    
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
                                    <select className="form-select" value={selectedMissionType} onChange={(e) => setSelectedMissionType(e.target.value)}>
                                        <option value="">All Missions Types</option>
                                        <option value="Mission">Mission</option>
                                        <option value="Jigyasa">Jigyasa</option>
                                        <option value="Pragya">Pragya</option>
                                    </select>
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select" value={selectedMissionAcceptance} onChange={(e) => setSelectedMissionAcceptance(e.target.value)} >
                                        <option value="">Missions Approved/Requested</option>
                                        <option value="accepted">Missions Approved</option>
                                        <option value="requested">Missions Requested</option>
                                        <option value="rejected">Mission Rejected</option>
                                    </select>
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <SearchableDropdown
                                        options={schools}
                                        placeholder="Select School"
                                        value={selectedSchools}
                                        onChange={setSelectedSchools}
                                        isLoading={isSchoolsLoading}
                                        maxDisplayItems={200}
                                        
                                    />
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                                        <option value="">Select Grade</option>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                                            <option key={grade} value={grade.toString()}>
                                                Grade {grade}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-12 col-md-6 col-lg-3">
                                    <SearchableDropdown
                                        options={states}
                                        placeholder="Select State"
                                        value={selectedState}
                                        onChange={setSelectedState}
                                        isLoading={isStatesLoading}
                                        maxDisplayItems={200}
                                        
                                    />
                                </div>

                                {/* Dropdowns Row 2 */}
                                <div className="col-12 col-md-6 col-lg-3">
                                    <SearchableDropdown
                                        options={cities}
                                        placeholder="Select city"
                                        value={selectedCity}
                                        onChange={setSelectedCity}
                                        isLoading={isCitiesLoading}
                                        maxDisplayItems={200}
                                    />
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select" value={selectedMissionRequestedNo} onChange={(e) => setSelectedMissionRequestedNo(e.target.value)}>
                                        <option value="">Select Mission Requested</option>
                                        {Array.from({ length: 20 }, (_, i) => i + 1).map(requesteds => (
                                            <option key={requesteds} value={requesteds.toString()}>
                                                Requests made - {requesteds}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select" value={selectedMissionAcceptedNo} onChange={(e) => setSelectedMissionAcceptedNo(e.target.value)}>
                                        <option value="">Select Mission Approved</option>
                                        {Array.from({ length: 20 }, (_, i) => i + 1).map(approves => (
                                            <option key={approves} value={approves.toString()}>
                                                Approves made - {approves}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select" value={selectedEarnCoins} 
                                        onChange={(e) => setSelectedEarnCoins(e.target.value)}
                                    >
                                        <option value="">Select Earn Coins</option>
                                        <option value="0-100">0-100 Coins</option>
                                        <option value="101-500">101-500 Coins</option>
                                        <option value="501-1000">501-1000 Coins</option>
                                        <option value="1000+">1000+ Coins</option>
                                    </select>
                                </div>

                                {/* Dropdowns & Inputs Row 3 */}
                                {/* <div className="col-12 col-md-6 col-lg-3">
                                    <select className="form-select">
                                        <option value="">Select User Type</option>
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div> */}
                                <div className="col-12 col-md-6 col-lg-3">
                                    <input
                                        type="date"
                                        placeholder="From Date"
                                        className="form-control"
                                        value={selectedFromDate}
                                        onChange={(e) => setSelectedFromDate(e.target.value)}
                                    />
                                </div>
                                <div className="col-12 col-md-6 col-lg-3">
                                    <input
                                        type="date"
                                        placeholder="To Date"
                                        className="form-control"
                                        value={selectedToDate}
                                        onChange={(e) => setSelectedToDate(e.target.value)}
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
                                <button className="btn btn-success d-inline-flex align-items-center" onClick={handleSearch}>
                                    <Search className="me-2" size={16} />
                                    Search
                                </button>
                                
                                <button className="btn btn-warning d-inline-flex align-items-center text-dark" onClick={handleClear}>
                                    <XCircle className="me-2" size={16} />
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex flex-wrap gap-2">
                        <button className="btn btn-purple d-inline-flex align-items-center text-white" style={{ backgroundColor: '#6f42c1' }} onClick={exportToCSV}>
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
                    

                    
                    {/* Paginated Results Table */}
                    <div className="card shadow-sm border-0 mt-2">
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
                                                    <th>ID</th>
                                                    <th>Name</th>
                                                    <th>School</th>
                                                    <th>Guardian</th>
                                                    <th>Email</th>
                                                    <th>Username</th>
                                                    <th>Mobile</th>
                                                    <th>DOB</th>
                                                    <th>User Type</th>
                                                    <th>Grade</th>
                                                    <th>City</th>
                                                    <th>State</th>
                                                    <th>Address</th>
                                                    <th>Earn Coins</th>
                                                    <th>Heart Coins</th>
                                                    <th>Brain Coins</th>
                                                    <th>School ID</th>
                                                    <th>School Code</th>
                                                    <th>Registered At</th>
                                                    <th>Mission ID</th>
                                                    <th>Total Requested</th>
                                                    <th>Total Accepted</th>
                                                    <th>User Description</th>
                                                    <th>User Comments</th>
                                                    <th>Mission Approved At</th>
                                                    <th>Mission Rejected At</th>
                                                    <th>Mission Requested At</th>
                                                    <th>Mission Type</th>
                                                    <th>Mission Title</th>
                                                    <th>Mission Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedData.map((row, index) => (
                                                    <tr key={index}>
                                                        <td>{row.id}</td>
                                                        <td>{row.name}</td>
                                                        <td>{row.school_name}</td>
                                                        <td>{row.guardian_name}</td>
                                                        <td>{row.email}</td>
                                                        <td>{row.username}</td>
                                                        <td>{row.mobile_no}</td>
                                                        <td>{row.dob}</td>
                                                        <td>{row.user_type}</td>
                                                        <td>{row.grade}</td>
                                                        <td>{row.city}</td>
                                                        <td>{row.state}</td>
                                                        <td>{row.address}</td>
                                                        <td>{row.earn_coins}</td>
                                                        <td>{row.heart_coins}</td>
                                                        <td>{row.brain_coins}</td>
                                                        <td>{row.school_id}</td>
                                                        <td>{row.school_code}</td>
                                                        <td>{row.registered_at}</td>
                                                        <td>{row.la_mission_id}</td>
                                                        <td>{row.total_missions_requested || 0}</td>
                                                        <td>{row.total_missions_accepted || 0}</td>
                                                        <td>{row.description}</td>
                                                        <td>{row.comments}</td>
                                                        <td>{row.approved_at}</td>
                                                        <td>{row.rejected_at}</td>
                                                        <td>{row.requested_at}</td>
                                                        <td>{row.mission_type}</td>
                                                        <td>{row.mission_title}</td>
                                                        <td>{row.mission_description}</td>
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

function useDebounce(arg0: () => void, arg1: number, arg2: string[]) {
    throw new Error('Function not implemented.');
}

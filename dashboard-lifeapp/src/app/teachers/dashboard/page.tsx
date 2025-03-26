'use client'
import '@tabler/core/dist/css/tabler.min.css';
// import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect, useRef, useMemo, useCallback  } from 'react'
// import NumberFlow from '@number-flow/react'
import React from 'react';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
import { Sidebar } from '@/components/ui/sidebar';
import { IconSearch, IconBell, IconSettings, IconUserFilled, IconUserExclamation, IconUser, IconUserScan, IconMapPin } from '@tabler/icons-react';


import {
  BarChart3,
  ChevronDown,
  Download,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import NumberFlow from '@number-flow/react';

import dynamic from 'next/dynamic'


const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false });
interface DemographData {
    state: string;
    count: string;
}
interface DemographChartdata {
    code: string;
    value: number;
}

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
    const [displayedItems, setDisplayedItems] = useState(maxDisplayItems);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    // Implement debounce for search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            // Reset displayed items when search changes
            setDisplayedItems(maxDisplayItems);
        }, 300);
        
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, maxDisplayItems]);

    // Get filtered options based on search term
    const filteredOptions = useMemo(() => {
        if (!debouncedSearchTerm.trim()) {
            return options;
        }
        
        const searchLower = debouncedSearchTerm.toLowerCase();
        
        return options.filter(option => 
            typeof option === "string" && 
            option.toLowerCase().includes(searchLower)
        );
    }, [options, debouncedSearchTerm]);

    // Handle scroll event to implement infinite scrolling
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const scrollPosition = scrollTop + clientHeight;
        
        // If user has scrolled to near bottom, load more items
        if (scrollHeight - scrollPosition < 50 && displayedItems < filteredOptions.length) {
            setDisplayedItems(prev => Math.min(prev + maxDisplayItems, filteredOptions.length));
        }
    }, [displayedItems, filteredOptions.length, maxDisplayItems]);

    // Add scroll event listener
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
        }
        
        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, [handleScroll]);

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
        setDisplayedItems(maxDisplayItems);
    };

    // The options to display - limited by displayedItems count
    const visibleOptions = useMemo(() => {
        return filteredOptions.slice(0, displayedItems);
    }, [filteredOptions, displayedItems]);

    // Calculate if there are more items to load
    const hasMoreItems = filteredOptions.length > displayedItems;
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
                    <div 
                        className="max-h-48 overflow-auto"
                        ref={scrollContainerRef}
                    >
                        {isLoading ? (
                            <div className="px-3 py-2 text-gray-500">Loading options...</div>
                        ) : (
                            <>
                                {visibleOptions.length > 0 ? (
                                    visibleOptions.map((option, index) => (
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
                                
                                {/* Show loading more indicator */}
                                {hasMoreItems && (
                                    <div className="flex items-center justify-center px-3 py-2 text-gray-500 border-t border-gray-100 bg-gray-50">
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-purple-500"></div>
                                        <span>Loading more... ({visibleOptions.length} of {filteredOptions.length})</span>
                                    </div>
                                )}
                                
                                {/* Show total count if filtered */}
                                {debouncedSearchTerm && filteredOptions.length > 0 && (
                                    <div className="px-3 py-2 text-xs text-center text-gray-500 bg-gray-50 border-t border-gray-100">
                                        Found {filteredOptions.length} matching results
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

//const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
const api_startpoint = 'http://127.0.0.1:5000'

export default function TeachersDashboard() {
    const [states, setStates] = useState<string[]>([]);
    const [isStatesLoading, setIsStatesLoading] = useState(false);
    const [selectedState, setSelectedState] = useState("");

    useEffect(() => {
        async function fetchStates() {
            // Check cache first
            const cachedStates = sessionStorage.getItem("stateList");
            if (cachedStates) {
                setStates(JSON.parse(cachedStates));
                return;
            }

            setIsStatesLoading(true);
            try {
                const res = await fetch(`${api_startpoint}/api/state_list_teachers`);
                const data: { state: string }[] = await res.json();

                if (Array.isArray(data)) {
                    const stateList = data
                        .map((item) => (item.state ? item.state.trim() : ""))
                        .filter((state) => state !== ""); // Filter out empty states

                    setStates(stateList);
                    // Cache the results
                    sessionStorage.setItem("stateList", JSON.stringify(stateList));
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

    const fetchCities = async (state: string) => {
        if (!state) return;
    
        console.log("Fetching cities for state:", state);
    
        setIsCitiesLoading(true);
        try {
            const res = await fetch(`${api_startpoint}/api/city_list_teachers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: state })
            });
    
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
    
            const data = await res.json();
    
            console.log("Raw API Response:", data); // ✅ Check if cities are being received
    
            if (Array.isArray(data) && data.length > 0) {
                let cityList: string[] = data.map(city => 
                    typeof city === 'string' ? city.trim() : city.city ? city.city.trim() : ''
                ).filter(city => city !== "");
    
                setCities(cityList);
                sessionStorage.setItem(`cityList_${state}`, JSON.stringify(cityList));
    
                console.log(`✅ Loaded ${cityList.length} cities for ${state}`);
            } else {
                console.warn("⚠ No cities found for state:", state);
                setCities([]); // Clear cities if none found
            }
        } catch (error) {
            console.error("❌ Error fetching city list:", error);
            setCities([]);
        } finally {
            setIsCitiesLoading(false);
        }
    };
    

    useEffect(() => {
        if (selectedState) {
            console.log("🟢 State changed to:", selectedState);
            setCities([]); // Reset cities when state changes
            setSelectedCity(""); // Reset selected city
            fetchCities(selectedState);
        }
    }, [selectedState]);
    

    const [selectedSchoolCode, setSelectedSchoolCode] = useState<string>("");
    const [selectedLifeLab, setSelectedLifeLab] = useState<string>("");
    const [tableData, setTableData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const rowsPerPage = 50;
    const [isTableLoading, setIsTableLoading] = useState(false);

    const handleSearch = async () => {
        const filters = {
            state: selectedState,
            city: selectedCity,
            school_code: selectedSchoolCode,
            is_life_lab: selectedLifeLab,
        };
    
        setIsTableLoading(true);
    
        try {
            const res = await fetch(`${api_startpoint}/api/teacher_dashboard_search`, {
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

    const paginatedData = tableData.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

    const handleClear = () => {
        setSelectedState("");
        setSelectedCity("");
        setSelectedLifeLab("");
        setSelectedSchoolCode("");
        // Clear other filters...
        setTableData([]);
    };

    const [totalTeachers, setTotalTeachers] = useState<number>(0);
    useEffect( () => {
        async function fetchTeacherCount() {
            try {
                const res = await fetch(`${api_startpoint}/api/teacher-count`, {
                    method: 'POST'
                })
                const data = await res.json()
                if (data && data.length > 0) {
                    setTotalTeachers(data[0].total_count)
                }
            } catch (error) {
                console.error('Error fetching user count:', error)
            }
        }
            fetchTeacherCount()
    }, [])


    

    const [chartOptions, setChartOptions] = useState<any>(null);
    const [geoData, setGeoData] = useState<DemographData[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [HighchartsLib, setHighchartsLib] = useState<any>(null);
    useEffect(() => {
        // Load Highcharts on client-side only
        // const HighchartsLoaded = require('highcharts/highmaps');
        
        const fetchData = async () => {
            const HighchartsLoaded = await import("highcharts/highmaps");

            setHighchartsLib(HighchartsLoaded);
            try {
                // Fetch India TopoJSON map
                const topoResponse = await fetch(
                    // "https://code.highcharts.com/mapdata/countries/in/custom/in-all-andaman-and-nicobar.topo.json"
                    "https://code.highcharts.com/mapdata/countries/in/custom/in-all-disputed.topo.json"
                );
                
                const topology = await topoResponse.json();

                // Fetch state-wise student count from API
                const apiResponse = await fetch(`${api_startpoint}/api/demograph-teachers`,{
                    method: 'POST'
                });
                const apiData: DemographData[] = await apiResponse.json();

                setGeoData(apiData); // Store API data for debugging or future use

                // Map API state names to Highcharts' region keys
                const stateMappings: Record<string, string> = {
                    "Tamil Nadu": "tamil nadu",     // Tamil Nadu gets "in-tn"
                    "Telangana": "telangana",       // Telangana gets "in-tg" (instead of "in-tn")
                    "Maharashtra": "maharashtra",
                    "Karnataka": "karnataka",
                    "Andhra Pradesh": "andhra pradesh",
                    "Gujarat": "gujarat",
                    "Madhya Pradesh": "madhya pradesh",
                    "Odisha": "odisha",
                    "West Bengal": "west bengal",
                    "Delhi": "nct of delhi",
                    "Uttar Pradesh": "uttar pradesh",
                    "Jharkhand": "jharkhand",
                    "Assam": "assam",
                    "Chhattisgarh": "chhattisgarh",
                    "Punjab": "punjab",
                    "Bihar": "bihar",
                    "Haryana": "haryana",
                    "Daman and Diu": "daman and diu",
                    "Chandigarh": "chandigarh",
                    // "Pondicherry": "in-py",
                    "Puducherry": "puducherry",
                    "Rajasthan": "rajasthan",
                    "Goa": "goa",
                    "Kerala": "kerala",
                    "Uttarakhand": "uttarakhand",
                    "Himachal Pradesh": "himachal pradesh",
                    // "Ladakh": "in-la",
                    "Lakshadweep": "lakshadweep",
                    "Sikkim": "nikkim",
                    "Nagaland": "nagaland",
                    "Dadara and Nagar Haveli": "dadara and nagar havelli",
                    "Jammu and Kashmir": "jammu and kashmir",
                    "Manipur": "manipur",
                    "Arunanchal Pradesh": "arunanchal pradesh",
                    "Meghalaya": "meghalaya",
                    "Mizoram": "mizoram",
                    "Tripura": "tripura",
                    "Andaman and Nicobar Islands": "andaman and nicobar",
                };

                // Transform API data into Highcharts format
                const chartData: DemographChartdata[] = apiData
                .map((item) => ({
                    code: stateMappings[item.state] || '', // Use empty string if no mapping found
                    value: Math.max(parseInt(item.count, 10), 1) // Ensure a minimum value of 1
                }))
                .filter((item) => item.code);


                // Set up the chart options
                const options = {
                    chart: {
                        map: topology,
                    },
                    title: {
                        text: "Teacher Distribution Across India",
                    },
                    subtitle: {
                        text: "Data sourced from lifeapp.users",
                    },
                    mapNavigation: {
                        enabled: true,
                        buttonOptions: {
                            verticalAlign: "bottom",
                        },
                    },
                    colorAxis: {
                        min: 1,
                        minColor: '#E6F2FF',
                        maxColor: '#0077BE',
                        type: 'logarithmic' // This helps differentiate states with vastly different counts
                    },
                    series: [
                        {
                            data: chartData.map((item) => [item.code, item.value]),
                            name: "Teacher Count",
                            states: {
                                hover: {
                                    color: "#BADA55",
                                },
                            },
                            dataLabels: {
                                enabled: true,
                                format: '{point.name}',
                                style: {
                                    fontSize: '8px'
                                }
                            },
                        },
                    ],
                };

                setChartOptions(options);
            } catch (error) {
                console.error("Error fetching data:", error);
                setErrorMessage("An error occurred while loading the chart.");
            }
        };

        fetchData();
    }, []);

    // State for modals
    const [showDemographicsModal, setShowDemographicsModal] = useState(false);
    
    const [schoolCount, setSchoolCount] = useState<number>(0);
    useEffect( () => {
        async function fetchSchoolCount() {
            try {
                const res = await fetch(`${api_startpoint}/api/school_count`, {
                    method: 'POST'
                })
                const data = await res.json()
                if (data && data.length > 0) {
                    setSchoolCount(data[0].count)
                }
            } catch (error) {
                console.error('Error fetching user count:', error)
            }
        }
        fetchSchoolCount()
    }, [])

    return (
        <div className={`page bg-light ${inter.className} font-sans`}>
            <Sidebar />

            {/* Main Content */}
            <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                {/* Top Navigation */}
                {/* <header className="navbar navbar-expand-md navbar-light bg-white shadow-sm border-bottom mb-3">
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
                </header> */}
                <div className='page-body'>
                    <div className='container-xl pt-0 pb-4'>
                        {/* Metrics Grid */}
                        <div className="row g-4 mb-4">
                            {[
                                { title: 'Total Teachers', value: totalTeachers, icon: <IconUser />, color: 'bg-purple' },
                                { title: 'Active Teachers', value: 0, icon: <IconUserFilled />, color: 'bg-teal' },
                                { title: 'Inactive Teachers', value: 0, icon: <IconUserExclamation />, color: 'bg-orange' },
                                { title: 'Highest Online User Count', value: 0, icon: <IconUserScan />, color: 'bg-blue', suffix: '' },
                            ].map((metric, index) => (
                                <div className="col-sm-6 col-lg-3" key={index}>
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center">
                                                {/* <div className={`${metric.color} rounded-circle p-3 text-white`}>
                                                {React.cloneElement(metric.icon, { size: 24 })}
                                                </div> */}
                                                <div>
                                                <div className="subheader">{metric.title}</div>
                                                    <div className="h1 mb-3">
                                                        <NumberFlow
                                                        value={metric.value}
                                                        suffix={metric.suffix || ''}
                                                        className="fw-semi-bold text-dark"
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

                        <div className="row g-4 mb-4">
                            <div className="col-sm-4 col-lg-4" 
                                onClick={() => setShowDemographicsModal(true)}
                                >
                                <div className="card cursor-pointer hover:shadow-lg transition-shadow">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-teal rounded-circle p-3 text-white me-3">
                                                <IconMapPin size={24} />
                                            </div>
                                            <div>
                                                <div className="subheader">View Teacher Demographics Map</div>
                                                <div className="text-muted">Click to explore Teacher distribution across India</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-sm-6 col-lg-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center">
                                                {/* <div className={`${metric.color} rounded-circle p-3 text-white`}>
                                                {React.cloneElement(metric.icon, { size: 24 })}
                                                </div> */}
                                                <div>
                                                <div className="subheader w-full">Total Number of Schools</div>
                                                    <div className="h1 mb-3">
                                                        <NumberFlow
                                                        value = {schoolCount}
                                                        // suffix={metric.suffix || ''}
                                                        className="fw-semi-bold text-dark"
                                                        transformTiming={{endDelay:6, duration:750, easing:'cubic-bezier(0.42, 0, 0.58, 1)'}}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                        </div>

                        {/* Demographics Map Modal */}
                        {showDemographicsModal && (
                            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-xl">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Student Distribution Across India</h5>
                                            <button 
                                                type="button" 
                                                className="btn-close" 
                                                onClick={() => setShowDemographicsModal(false)}
                                            ></button>
                                        </div>
                                        <div className="modal-body">
                                            {!HighchartsLib || !chartOptions ? (
                                                <div className="text-center">
                                                    <div className="spinner-border text-purple" role="status" style={{ width: "8rem", height: "8rem" }}></div>
                                                </div>
                                            ) : errorMessage ? (
                                                <div>Error: {errorMessage}</div>
                                            ) : (
                                                <HighchartsReact
                                                    highcharts={HighchartsLib}
                                                    constructorType="mapChart"
                                                    options={chartOptions}
                                                />
                                            )}
                                        </div>
                                        <div className="modal-footer">
                                            <button 
                                                type="button" 
                                                className="btn btn-secondary" 
                                                onClick={() => setShowDemographicsModal(false)}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="card shadow-sm border-0 mb-4">
                            <div className="card-body">
                                <h5 className="card-title mb-4">Search & Filter</h5>
                                <div className="row g-3">
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <SearchableDropdown
                                            options={states}
                                            placeholder="Select States"
                                            value={selectedState}
                                            onChange={(val) => setSelectedState(val)}
                                            isLoading={isStatesLoading}
                                            maxDisplayItems={200}
                                        />
                                    </div>
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <SearchableDropdown
                                            options={cities}
                                            placeholder="Select City"
                                            value={selectedCity}
                                            onChange={(val) => setSelectedCity(val)}
                                            isLoading={isCitiesLoading}
                                            maxDisplayItems={200}
                                            
                                        />
                                    </div>
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Enter School Code" 
                                            value={selectedSchoolCode}
                                            onChange={(e) => setSelectedSchoolCode(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <select className='form-select' value={selectedLifeLab} onChange={(e) => setSelectedLifeLab(e.target.value)}>
                                            <option value="">Life Lab User</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option> 

                                        </select>
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
                            {/* Paginated Results Table */}
                            <div className="card shadow-sm border-0 mt-2">
                                    <div className="card-body overflow-x-scroll">
                                        <h5 className="card-title mb-4">Results- {tableData.length} rows found</h5>
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
                                                                <th>Name</th>
                                                                <th>Email</th>
                                                                <th>Mobile</th>
                                                                <th>City</th>
                                                                <th>State</th>
                                                                <th>School ID</th>
                                                                <th>Is Life Lab</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {paginatedData.map((row, index) => (
                                                                <tr key={index}>
                                                                    <td>{row.name}</td>
                                                                    <td>{row.email}</td>
                                                                    <td>{row.mobile_no}</td>
                                                                    <td>{row.city}</td>
                                                                    <td>{row.state}</td>
                                                                    <td>{row.school_id}</td>
                                                                    <td>{row.is_life_lab}</td>
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
            </div>
        </div>
    )
}
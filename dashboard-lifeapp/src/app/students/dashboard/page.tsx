'use client'
import '@tabler/core/dist/css/tabler.min.css';
// import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect, useRef, useMemo, useCallback  } from 'react'
import NumberFlow from '@number-flow/react'
import React from 'react';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
// import Sidebar from '../../sidebar';
import { Sidebar } from '@/components/ui/sidebar';
import { IconSearch, IconBell, IconSettings, IconUserFilled, IconUserExclamation, IconUser, IconUserScan, IconMapPin, IconSchool, IconTrophy, IconDeviceAnalytics, IconEdit, IconTrash } from '@tabler/icons-react';

import ReactECharts from 'echarts-for-react';
import {
  BarChart3,
  ChevronDown,
  Download,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import error from 'next/error';

interface SearchableDropdownProps {
    options: string[];
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    isLoading?: boolean;
    maxDisplayItems?: number;
}

import dynamic from 'next/dynamic'


const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false });
// import Highcharts from 'highcharts/highmaps';
// const Highcharts = dynamic(() => import('highcharts/highmaps'), { ssr: false });

interface DemographData {
    state: string;
    count: string;
}

interface DemographChartdata {
    code: string;
    value: number;
}

interface StudentsByGrade {
    grade: number | null;
    count: number;
}

interface challengesCompletedData {
    count: number;
    la_mission_id: number | null;
    title: string;
    description: string;
}

interface MissionStatusData {
    period: string;
    "Mission Requested"?: number;
    "Mission Rejected"?: number;
    "Mission Approved"?: number;
    [key: string]: string | number | undefined; // Allow dynamic keys
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
  
const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
//const api_startpoint = 'http://127.0.0.1:5000'
export default function SchoolDashboard() {
    const [totalStudents, setTotalStudents] = useState<number>(0)
    const [selectedState, setSelectedState] = useState("");
    useEffect(() => {
        async function fetchStudentCount() {
        try {
            const res = await fetch(`${api_startpoint}/api/total-student-count`)
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
                const res = await fetch(`${api_startpoint}/api/state_list`);
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
                const cityList: string[] = data.map(city => 
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
    


    // For city fetching - optimized but independent of state
    const [schools, setSchools] = useState<string[]>([]);
    const [isSchoolsLoading, setIsSchoolsLoading] = useState(false);
    const [selectedSchools, setSelectedSchools] = useState("");
    useEffect(() => {
        async function fetchSchools() {
            // Check cache first
            const cachedSchools = sessionStorage.getItem('SchoolList');
            if (cachedSchools) {
                try {
                    const parsed = JSON.parse(cachedSchools);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setSchools(parsed);
                        return;
                    }
                } catch (err) {
                    console.error("Error parsing cached schools:", err);
                    // Continue to fetch if cache parse fails
                }
            }
            
            setIsSchoolsLoading(true);
            try {
                const res = await fetch(`${api_startpoint}/api/school_list`);
                const data: { name: string }[] = await res.json();
                
                if (Array.isArray(data)) {
                    // Create a reference to collect all processed schools
                    let allProcessedSchools: string[] = [];
                    
                    // Process data in chunks to avoid UI freezing with large datasets
                    const processSchoolsBatch = (startIndex: number, batchSize: number): void => {
                        const endIndex = Math.min(startIndex + batchSize, data.length);
                        const batch = data
                            .slice(startIndex, endIndex)
                            .map(item => item.name ? item.name.trim() : "")
                            .filter(name => name !== "");
                        
                        // Add to our complete collection
                        allProcessedSchools = [...allProcessedSchools, ...batch];
                        
                        // Update the state with what we've processed so far
                        setSchools(allProcessedSchools);
                        
                        if (endIndex < data.length) {
                            // Process next batch in the next tick to avoid blocking the UI
                            setTimeout(() => processSchoolsBatch(endIndex, batchSize), 0);
                        } else {
                            // All done, cache the results using our complete reference
                            sessionStorage.setItem('SchoolList', JSON.stringify(allProcessedSchools));
                            setIsSchoolsLoading(false);
                        }
                    };
                    
                    // Start processing in batches (100 items at a time)
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
    const [selectedMobileNo, setSelectedMobileNo] = useState("");
    const [selectedSchoolCode, setSelectedSchoolCode] = useState("");
    const rowsPerPage = 50;
    const [isTableLoading, setIsTableLoading] = useState(false);
    // Handler for search button
    const handleSearch = async () => {
        const filters = {
            state: selectedState,
            school: selectedSchools,
            city: selectedCity,
            grade: selectedGrade,
            mission_type: '',
            mission_acceptance: selectedMissionAcceptance,
            mission_requested_no: selectedMissionRequestedNo, // Add these filters
            mission_accepted_no: selectedMissionAcceptedNo,    // Add these filters
            earn_coins: selectedEarnCoins, // Add this line
            from_date: selectedFromDate, // Include the From Date filter
            to_date: selectedToDate,      // Include the To Date filter
            mobile_no: selectedMobileNo,
            schoolCode : selectedSchoolCode,
        };

        setIsTableLoading(true); // Set loading to true when search starts

        try {
            const res = await fetch(`${api_startpoint}/api/student_dashboard_search`, {
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
        // setSelectedMissionType("");
        setSelectedMissionAcceptance("");
        setSelectedMissionAcceptedNo("");
        setSelectedMissionRequestedNo("");
        setSelectedEarnCoins("");
        setSelectedFromDate(""); // Clear the From Date
        setSelectedToDate("");   // Clear the To Date
        // Clear other filters...
        setSelectedMobileNo("");
        setSelectedSchoolCode("");
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
                const apiResponse = await fetch(`${api_startpoint}/api/demograph-students`,{
                    method: 'POST'
                });
                const apiData: { count: string; state: string }[] = await apiResponse.json();

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
                        text: "Student Distribution Across India",
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
                            name: "Student Count",
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
  



    const [studentsByGrade, setStudentsByGrade] = useState<StudentsByGrade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const fetchStudentsByGrade = async () => {
            try {
                const response = await fetch(`${api_startpoint}/api/students-by-grade`, {
                    method: "POST"
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch students by grade');
                }
                const data: StudentsByGrade[] = await response.json();
                
                // Sort the data by grade, handling null last
                const sortedData = data.sort((a, b) => {
                    if (a.grade === null) return 1;
                    if (b.grade === null) return -1;
                    return (a.grade as number) - (b.grade as number);
                });
    
                setStudentsByGrade(sortedData);
                setIsLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                setIsLoading(false);
            }
        };
    
        fetchStudentsByGrade();
    }, []);

    // State for modals
    const [showDemographicsModal, setShowDemographicsModal] = useState(false);
    const [showGradeModal, setShowGradeModal] = useState(false);

    const [showChallengesModal, setShowChallengesModal] = useState(false);
    const [challengesData, setChallengesData] = useState<challengesCompletedData[]>([]);
    const [isChallengesLoading, setIsChallengesLoading] = useState(false);
    useEffect(() => {
        const fetchChallengesData = async () => {
            try{
                const response = await fetch(`${api_startpoint}/api/challenges-completed-per-mission`, {
                    method: "POST"
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch challenges-completed-per-mission ');
                }
                const data: challengesCompletedData[] = await response.json();
                setChallengesData(data);
                setIsChallengesLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                setIsLoading(false);
            }
        };
        fetchChallengesData()
    }, [])
    

    const [totalPointsEarned, setTotalPointsEarned] = useState<number>(0)
    useEffect(() => {
        async function fetchTotalPointsEarned() {
        try {
            const res = await fetch(`${api_startpoint}/api/total-points-earned`, {
                method: 'POST'
            })
            const data = await res.json()
            if (data && data.length > 0) {
                setTotalPointsEarned(data[0].total_points)
            }
        } catch (error) {
            console.error('Error fetching user count:', error)
        }
        }
        fetchTotalPointsEarned()
    }, [])

    const [totalPointsRedeemed, setTotalPointsRedeemed] = useState<number>(0)
    useEffect(() => {
        async function fetchTotalPointsRedeemed() {
            try {
                const res = await fetch(`${api_startpoint}/api/total-points-redeemed`, {
                    method: 'POST'
                })
                const data = await res.json()
                if (data && data.length > 0) {
                    setTotalPointsRedeemed(data[0].total_coins_redeemed)
                }
            } catch (error) {
                console.error('Error fetching user count:', error)
            }
            }
            fetchTotalPointsRedeemed()
    }, [])

    const [tmcAssignedByTeacher, setTmcAssignedByTeacher] = useState<number>(0)
    useEffect(() => {
        async function fetchTmcAssignedByTeacher() {
            try {
                const res = await fetch(`${api_startpoint}/api/total-missions-completed-assigned-by-teacher`, {
                    method: 'POST'
                })
                const data = await res.json()
                if (data && data.length > 0) {
                    setTmcAssignedByTeacher(data[0].total_missions_completed)
                }
            } catch (error) {
                console.error('Error fetching user count:', error)
            }
            }
            fetchTmcAssignedByTeacher()
    }, [])

    const [currentChallengesPage, setCurrentChallengesPage] = useState(0);
    const rowsPerPageChallenges = 10; // Number of rows per page

    const [missionStatusData, setMissionStatusData] = useState<MissionStatusData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [missionStatusError, setMissionStatusError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [grouping, setGrouping] = useState<string>('monthly'); // Default grouping

    // Key improvement: UseEffect to trigger data fetch when grouping changes
    useEffect(() => {
        if (modalOpen) {
            fetchMissionStatusData(grouping);
        }
    }, [grouping, modalOpen]);

    const fetchMissionStatusData = (selectedGrouping: string) => {
        setLoading(true);
        setMissionStatusError(null);
      
        fetch(`${api_startpoint}/api/mission-status-graph`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grouping: selectedGrouping }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Improved data transformation
            const groupedData: Record<string, MissionStatusData> = {};

            data.data.forEach((entry: any) => {
                const period = entry.period;
                if (!groupedData[period]) {
                    groupedData[period] = { 
                        period: period,
                        'Mission Requested': 0,
                        'Mission Rejected': 0,
                        'Mission Approved': 0
                    };
                }

                // Safely map mission status
                switch(entry.mission_status) {
                    case 'Mission Requested':
                        groupedData[period]['Mission Requested'] = entry.count;
                        break;
                    case 'Mission Rejected':
                        groupedData[period]['Mission Rejected'] = entry.count;
                        break;
                    case 'Mission Approved':
                        groupedData[period]['Mission Approved'] = entry.count;
                        break;
                }
            });

            // Convert to array and sort
            const sortedData = Object.values(groupedData).sort((a, b) => {
                const [yearA, weekA] = a.period.split('-').map(Number);
                const [yearB, weekB] = b.period.split('-').map(Number);
                return yearA !== yearB ? yearA - yearB : weekA - weekB;
            })

            setMissionStatusData(sortedData);
            setLoading(false);
        })
        .catch(err => {
            setMissionStatusError(err.message);
            setLoading(false);
        });
    };
      
    const MissionStatusChartOptions = {
        title: {
            text: 'Mission Status Over Time',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            top: 'bottom'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: missionStatusData.map(item => item.period),
            boundaryGap: grouping === 'lifetime' ? true : false,
            axisLabel: {
                // Rotate labels for better readability
                rotate: grouping === 'daily' ? 45 : 0,
                interval: 0 // Show all labels
            }
        },
        yAxis: {
            type: 'value'
        },
        dataZoom: [
            {
                type: 'inside',
                start: 0,
                end: 100
            },
            {
                type: 'slider',
                start: 0,
                end: 100
            }
        ],
        series: [
            {
                name: 'Mission Requested',
                type: 'bar',
                stack: 'total',
                data: missionStatusData.map(item => item['Mission Requested'] || 0),
                itemStyle: { color: '#FFD700' } // Yellow
            },
            {
                name: 'Mission Rejected',
                type: 'bar',
                stack: 'total',
                data: missionStatusData.map(item => item['Mission Rejected'] || 0),
                itemStyle: { color: '#FF4500' } // Red
            },
            {
                name: 'Mission Approved',
                type: 'bar',
                stack: 'total',
                data: missionStatusData.map(item => item['Mission Approved'] || 0),
                itemStyle: { color: '#32CD32' } // Green
            }
        ]
    };
    
    const handleModalOpen = () => {
        fetchMissionStatusData(grouping);
        setModalOpen(true);
    };
      
    const handleModalClose = () => {
        setModalOpen(false);
    };
    return(
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
                                { title: 'Total Students', value: totalStudents, icon: <IconUser />, color: 'bg-purple' },
                                { title: 'Active Students', value: 0, icon: <IconUserFilled />, color: 'bg-teal' },
                                { title: 'Inactive Students', value: 0, icon: <IconUserExclamation />, color: 'bg-orange', suffix:'' },
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

                        {/* Metrics Grid */}
                        <div className="row g-4 mb-4">
                            {[
                                { title: 'Total Points Earned', value: totalPointsEarned, icon: <IconUser />, color: 'bg-purple' },
                                { title: 'Total Points Redeemed', value: totalPointsRedeemed, icon: <IconUserFilled />, color: 'bg-teal' },
                                { title: 'Teacher Assign Mission Completes', value: tmcAssignedByTeacher, icon: <IconUserExclamation />, color: 'bg-orange', suffix:'' },
                                // { title: 'Highest Online User Count', value: 36987, icon: <IconUserScan />, color: 'bg-blue', suffix: '' },
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
                        {/* New Cards for Modal Triggers */}
                        <div className="row g-4 mb-4">
                            <div className="col-sm-4 col-lg-4" onClick={() => setShowGradeModal(true)}>
                                <div className="card cursor-pointer hover:shadow-lg transition-shadow">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-purple rounded-circle p-3 text-white me-3">
                                                <IconSchool size={24} />
                                            </div>
                                            <div>
                                                <div className="subheader">View Students by Grade</div>
                                                <div className="text-muted">Click to expand detailed grade distribution</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-sm-4 col-lg-4" onClick={() => setShowDemographicsModal(true)}>
                                <div className="card cursor-pointer hover:shadow-lg transition-shadow">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-teal rounded-circle p-3 text-white me-3">
                                                <IconMapPin size={24} />
                                            </div>
                                            <div>
                                                <div className="subheader">View Student Demographics Map</div>
                                                <div className="text-muted">Click to explore student distribution across India</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-sm-4 col-lg-4" onClick={() => setShowChallengesModal(true)}>
                                <div className="card cursor-pointer hover:shadow-lg transition-shadow">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-info rounded-circle p-3 text-white me-3">
                                                <IconTrophy size={24} />
                                            </div>
                                            <div>
                                                <div className="subheader">View Challenges Completed per Mission</div>
                                                <div className="text-muted">Click to see mission completion details</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-sm-4 col-lg-4" onClick={handleModalOpen}>
                                <div className="card cursor-pointer hover:shadow-lg transition-shadow">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-orange rounded-circle p-3 text-white me-3">
                                                <IconDeviceAnalytics size={24} />
                                            </div>
                                            <div>
                                                <div className="subheader">View Mission Status Analytics</div>
                                                <div className="text-muted">Click to see mission status details</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* <div className="row g-4 mb-4">
                            {
                                isLoading ? (
                                    <div className="card ">
                                        <div className="card-body text-center">
                                            <div className="spinner-border text-purple" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <p className="mt-2">Loading students by grade...</p>
                                        </div>
                                    </div>
                                ): error? (
                                    <div className="card ">
                                        <div className="card-body text-center text-danger">
                                            <p>Error: {error}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="card shadow-sm border-0 mt-4">
                                        <div className="card-body">
                                            <h5 className="card-title mb-4">Students by Grade</h5>
                                            <div className="table-responsive">
                                                <table className="table table-striped table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Grade</th>
                                                            <th>Number of Students</th>
                                                            <th>Percentage</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {studentsByGrade.map((gradeData, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    {gradeData.grade === null 
                                                                        ? 'Unspecified' 
                                                                        : `Grade ${gradeData.grade}`}
                                                                </td>
                                                                <td>{gradeData.count.toLocaleString()}</td>
                                                                <td>
                                                                    {((gradeData.count / totalStudents) * 100).toFixed(2)}%
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="table-active">
                                                            <td><strong>Total</strong></td>
                                                            <td><strong>{totalStudents.toLocaleString()}</strong></td>
                                                            <td><strong>100%</strong></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        </div> */}
                        {/* <div>
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
                        </div> */}
                        {/* Modals */}
                        {/* Mission Status Modal */}
                        {modalOpen && (
                            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative overflow-auto">
                                    <h2 className="text-lg font-bold mb-4">Mission Status Analytics</h2>

                                    {/* Grouping Dropdown */}
                                    <select 
                                        value={grouping} 
                                        onChange={(e) => setGrouping(e.target.value)} 
                                        className="mb-4 p-2 border rounded"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="lifetime">Lifetime</option>
                                    </select>

                                    {/* Loading and Error States */}
                                    {loading && (
                                        <div className="text-center py-4">Loading data...</div>
                                    )}
                                    
                                    {missionStatusError && (
                                        <div className="text-red-500 text-center py-4">
                                            {missionStatusError}
                                        </div>
                                    )}

                                    {/* Chart */}
                                    {!loading && !missionStatusError && (
                                        <ReactECharts 
                                            option={MissionStatusChartOptions} 
                                            style={{ height: '400px', width: '100%' }}
                                        />
                                    )}

                                    {/* Close button */}
                                    <button 
                                        onClick={handleModalClose} 
                                        className="mt-4 p-2 bg-red-500 text-white rounded"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Grade Distribution Modal */}
                        {showGradeModal && (
                            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-lg">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Students by Grade Distribution</h5>
                                            <button 
                                                type="button" 
                                                className="btn-close" 
                                                onClick={() => setShowGradeModal(false)}
                                            ></button>
                                        </div>
                                        <div className="modal-body">
                                            {isLoading ? (
                                                <div className="text-center">
                                                    <div className="spinner-border text-purple" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <p className="mt-2">Loading students by grade...</p>
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
                                                                <th>Grade</th>
                                                                <th>Number of Students</th>
                                                                <th>Percentage</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {studentsByGrade.map((gradeData, index) => (
                                                                <tr key={index}>
                                                                    <td>
                                                                        {gradeData.grade === null 
                                                                            ? 'Unspecified' 
                                                                            : `Grade ${gradeData.grade}`}
                                                                    </td>
                                                                    <td>{gradeData.count.toLocaleString()}</td>
                                                                    <td>
                                                                        {((gradeData.count / totalStudents) * 100).toFixed(2)}%
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="table-active">
                                                                <td><strong>Total</strong></td>
                                                                <td><strong>{totalStudents.toLocaleString()}</strong></td>
                                                                <td><strong>100%</strong></td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                        <div className="modal-footer">
                                            <button 
                                                type="button" 
                                                className="btn btn-secondary" 
                                                onClick={() => setShowGradeModal(false)}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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
                        {/*Total number of challenges submitted by students  in each level for each subject in the Life app*/}
                        {showChallengesModal && (
                            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-lg">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Challenges Completed per Mission</h5>
                                            <button 
                                                type="button" 
                                                className="btn-close" 
                                                onClick={() => setShowChallengesModal(false)}
                                            ></button>
                                        </div>
                                        <div className="modal-body">
                                            {isChallengesLoading ? (
                                                <div className="text-center">
                                                    <div className="spinner-border text-info" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <p className="mt-2">Loading challenges data...</p>
                                                </div>
                                            ) : challengesData.length === 0 ? (
                                                <div className="text-center text-muted">
                                                    <p>No challenges data available.</p>
                                                </div>
                                            ) : (
                                                (() => {
                                                    const totalChallenges = challengesData.reduce((sum, row) => sum + row.count, 0);
                                                    
                                                    // Paginate the data
                                                    const paginatedChallengesData = challengesData.slice(
                                                        currentChallengesPage * rowsPerPageChallenges,
                                                        (currentChallengesPage + 1) * rowsPerPageChallenges
                                                    );

                                                    return (
                                                        <div className="table-responsive">
                                                            <table className="table table-striped table-hover">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Mission ID</th>
                                                                        <th>Title</th>
                                                                        <th>Level</th>
                                                                        <th>Student Count</th>
                                                                        <th>Percentage</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {paginatedChallengesData.map((row, index) => {
                                                                        let title = '';
                                                                        try {
                                                                            const parsedTitle = JSON.parse(row.title);
                                                                            title = parsedTitle.en || '';
                                                                        } catch (error) {
                                                                            title = row.title;
                                                                        }
                                                                        let level = '';
                                                                        try {
                                                                            const parsedTitle = JSON.parse(row.description);
                                                                            level = parsedTitle.en || '';
                                                                        } catch (error) {
                                                                            level = row.description;
                                                                        }

                                                                        const percentage = totalChallenges > 0 ? ((row.count / totalChallenges) * 100).toFixed(3) : '0.00';
                                                                        
                                                                        return (
                                                                            <tr key={index}>
                                                                                <td>{row.la_mission_id}</td>
                                                                                <td>{title}</td>
                                                                                <td>{level}</td>
                                                                                <td>{row.count.toLocaleString()}</td>
                                                                                <td>{percentage}%</td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                                <tfoot>
                                                                    <tr className="table-active">
                                                                        <td colSpan={2}><strong>Total</strong></td>
                                                                        <td><strong/></td>
                                                                        <td><strong>{totalChallenges.toLocaleString()}</strong></td>
                                                                        
                                                                        <td><strong>100%</strong></td>
                                                                    </tr>
                                                                </tfoot>
                                                            </table>

                                                            {/* Pagination Controls */}
                                                            <div className="d-flex justify-content-between mt-3">
                                                                <button 
                                                                    className="btn btn-secondary"
                                                                    onClick={() => setCurrentChallengesPage(prev => Math.max(prev - 1, 0))}
                                                                    disabled={currentChallengesPage === 0}
                                                                >
                                                                    Previous
                                                                </button>
                                                                <div className="d-flex align-items-center">
                                                                    <span className="mx-2">
                                                                        Page {currentChallengesPage + 1} of {Math.ceil(challengesData.length / rowsPerPageChallenges) || 1}
                                                                    </span>
                                                                </div>
                                                                <button 
                                                                    className="btn btn-secondary"
                                                                    onClick={() => setCurrentChallengesPage(prev => 
                                                                        (prev + 1) * rowsPerPageChallenges < challengesData.length ? prev + 1 : prev)}
                                                                    disabled={(currentChallengesPage + 1) * rowsPerPageChallenges >= challengesData.length}
                                                                >
                                                                    Next
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })()
                                            )}
                                        </div>
                                        <div className="modal-footer">
                                            <button 
                                                type="button" 
                                                className="btn btn-secondary" 
                                                onClick={() => setShowChallengesModal(false)}
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
                                    {/* Dropdowns Row 1 */}
                                    {/* <div className="col-12 col-md-6 col-lg-3">
                                        <select className="form-select" value={selectedMissionType} onChange={(e) => setSelectedMissionType(e.target.value)}>
                                            <option value="">All Missions Types</option>
                                            <option value="Mission">Mission</option>
                                            <option value="Jigyasa">Jigyasa</option>
                                            <option value="Pragya">Pragya</option>
                                        </select>
                                    </div> */}
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <select className="form-select" value={selectedMissionAcceptance} onChange={(e) => setSelectedMissionAcceptance(e.target.value)} >
                                            <option value="">All Missions</option>
                                            <option value="accepted">Missions Approved</option>
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
                                    <div className="col-12 col-md-6 col-lg-3 text-gray-500">
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
                                            value={selectedMobileNo}
                                            onChange={(e) => setSelectedMobileNo(e.target.value)}
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
                                            value={selectedSchoolCode}
                                            onChange={(e) => setSelectedSchoolCode(e.target.value)}
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
                                                        <th>Total Requested</th>
                                                        <th>Total Accepted</th>
                                                        <th>Actions</th>
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
                                                            <td>{row.total_missions_requested || 0}</td>
                                                            <td>{row.total_missions_accepted || 0}</td>
                                                            <td >
                                                                <button
                                                                className="btn btn-sm btn-primary me-2 "
                                                                //onClick={() => handleEdit(row)}
                                                                >
                                                                <IconEdit size={16} />
                                                                </button>
                                                                <button
                                                                className="btn btn-sm btn-danger "
                                                                //onClick={() => handleDelete(row)}
                                                                >
                                                                <IconTrash size={16} />
                                                                </button>
                                                            </td>
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
    )
} 

function useDebounce(arg0: () => void, arg1: number, arg2: string[]) {
    throw new Error('Function not implemented.');
}

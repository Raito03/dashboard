'use client'
import '@tabler/core/dist/css/tabler.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react'
import React from 'react';
import { Poppins } from 'next/font/google';
import Sidebar from '../../sidebar';
import { IconSearch, IconBell, IconSettings, IconDownload } from '@tabler/icons-react';

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    variable: '--font-poppins',
});

// Define TypeScript interface for coupon data
interface CouponRedemption {
    'Student Name': string;
    'School Name': string;
    'Mobile Number': string;
    state: string;
    city: string;
    grade: string | number;
    'Coupon Title': string;
    'Coins Redeemed': number;
    user_id: number;
    'Coupon Redeemed Date': string;
}

export default function CouponsRedeemed() {
    const [isClient, setIsClient] = useState(false);
    const [coupons, setCoupons] = useState<CouponRedemption[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Set isClient to true after component mounts
    useEffect(() => {
        setIsClient(true);
        // Fetch all coupons initially
        fetchCoupons('');
    }, []);

    // Function to fetch coupons from the backend with an optional search term
    const fetchCoupons = async (query: string) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/api/coupon_redeem_search?search=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const tableData = await response.json();
            setCoupons(tableData as CouponRedemption[]);
            setError(null);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    // When the search button is clicked, fetch coupons based on the search term.
    const handleSearch = () => {
        fetchCoupons(searchTerm);
    };
    

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    
    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Student Name', 'School Name', 'Mobile Number', 'State', 'City', 'Grade', 'Coins Redeemed', 'User ID', 'Coupon Redeemed Date'];
        const csvRows = [headers.join(',')];
        coupons.forEach(coupon => {
            const row = [
                coupon['Student Name'] || '',
                coupon['School Name'] || '',
                coupon['Mobile Number'] || '',
                coupon.state || '',
                coupon.city || '',
                coupon.grade || '',
                coupon['Coupon Title'] || '',
                coupon['Coins Redeemed'] || '',
                coupon.user_id,
                coupon['Coupon Redeemed Date'] || ''
            ];
            csvRows.push(row.join(','));
        });
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'coupon_redemptions.csv';
        link.click();
    };

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

    if (!isClient) {
        return (
            <div className={`page bg-light ${poppins.variable} font-sans`}>
                <Sidebar />
                <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                    <header className="navbar navbar-expand-md navbar-light bg-white shadow-sm border-bottom mb-3">
                        <div className="container-fluid">
                            <div className="d-flex align-items-center w-full">
                                <span className='font-bold text-xl text-black'>LifeAppDashboard</span>
                            </div>
                        </div>
                    </header>
                    <div className='container-xl pt-0 pb-4'>
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Coupon Redemptions</h3>
                            </div>
                            <div className="card-body">
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`page bg-light ${poppins.variable} font-sans`}>
            <Sidebar />
            <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                <header className="navbar navbar-expand-md navbar-light bg-white shadow-sm border-bottom mb-3">
                    <div className="container-fluid">
                        <div className="d-flex align-items-center w-full">
                            <span className='font-bold text-xl text-black'>LifeAppDashboard</span>
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
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Coupon Redemptions</h3>
                        </div>
                        <div className="card-body">
                            <div className="d-flex mb-3 gap-3 flex-wrap">
                                <div className="me-auto">
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <IconSearch size={18} />
                                        </span>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Search..." 
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                        />
                                    </div>
                                </div>
                                <button className="btn btn-primary" onClick={handleSearch}>
                                    <IconSearch size={18} className="me-1" /> Search
                                </button>
                                <button className="btn btn-primary" onClick={exportToCSV}>
                                    <IconDownload size={18} className="me-1" /> Export
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="alert alert-danger" role="alert">
                                    Error loading data: {error}
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-vcenter table-hover">
                                        <thead>
                                            <tr>
                                                <th>Student Name</th>
                                                <th>School Name</th>
                                                <th>Mobile Number</th>
                                                <th>State</th>
                                                <th>City</th>
                                                <th>Grade</th>
                                                <th>Coupon Title</th>
                                                <th>Coins Redeemed</th>
                                                <th>User ID</th>
                                                <th>Redeemed Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {coupons.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="text-center">No redemptions found</td>
                                                </tr>
                                            ) : (
                                                coupons.map((coupon, index) => (
                                                    <tr key={index}>
                                                        <td>{coupon['Student Name']}</td>
                                                        <td>{coupon['School Name']}</td>
                                                        <td>{coupon['Mobile Number']}</td>
                                                        <td>{coupon.state}</td>
                                                        <td>{coupon.city}</td>
                                                        <td>{coupon.grade}</td>
                                                        <td>{coupon['Coupon Title']}</td>
                                                        <td>{coupon['Coins Redeemed']}</td>
                                                        <td>{coupon.user_id}</td>
                                                        <td>{formatDate(coupon['Coupon Redeemed Date'])}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

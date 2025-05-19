'use client'
import React, { useState, useEffect, useCallback, useMemo, useRef, FormEvent, ChangeEvent } from 'react';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/ui/sidebar';
import '@tabler/core/dist/css/tabler.min.css';
import NumberFlow from '@number-flow/react';
import { IconEdit, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { ChevronDown } from 'lucide-react';
import { error } from 'console';
import Error from 'next/error';
import ReactDOM from 'react-dom';
import AddCampaignModal from './AddCampaignModal';  // import only
const inter = Inter({ subsets: ['latin'] });
//const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
const api_startpoint = 'http://152.42.239.141:5000'
// const api_startpoint = 'http://127.0.0.1:5000'



interface Campaign {
  id: number;
  game_type: number;
  reference_id: number;
  title: string;
  description: string;
  scheduled_for: string;
  created_at: string;
  updated_at: string;
}

export default function Campaigns() {
    // State for campaign table data
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading]     = useState(false);
    const [modal, setModal] = useState<
      false | { mode: 'add' | 'edit'; campaign?: Campaign }
    >(false);
  
    const fetchCampaigns = async () => {
      setLoading(true);
      const res = await fetch(`${api_startpoint}/api/campaigns`);
      const data = await res.json();
      setCampaigns(data);
      setLoading(false);
    };
  
    useEffect(() => {
      fetchCampaigns();
    }, []);
  
    const openAdd = () => setModal({ mode: 'add' });
    const openEdit = (camp: Campaign) => setModal({ mode: 'edit', campaign: camp });
    const closeModal = () => setModal(false);
  
    const handleDelete = async (id: number) => {
      if (!confirm('Delete this campaign?')) return;
      await fetch(`${api_startpoint}/api/campaigns/${id}`, { method: 'DELETE' });
      fetchCampaigns();
    };

  return (
    <div className={`page bg-body ${inter.className} font-sans`}>
      <Sidebar />
      <div className="page-wrapper" style={{ marginLeft: '250px' }}>
        <div className="page-body">
          <div className="container-xl pt-4 pb-4 space-y-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="text-xl font-semibold">Campaigns</h2>
              <button className="btn btn-primary" onClick={openAdd}>
                <IconPlus className="me-2" /> Add Campaign
              </button>
            </div>
            {/* Campaigns Table */}
            {loading ? (
              <div className="text-center py-10">
                <div className="spinner-border text-purple" role="status" style={{ width: "3rem", height: "3rem" }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading campaigns...</p>
              </div>
            // ) : Error ? (
            //   <div className="text-center text-danger">
            //     <p>Error: {}</p>
            //   </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                    {['ID','Type','Ref ID','Title','Desc','Scheduled','Created','Updated','Actions']
                  .map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c, index) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.game_type}</td>
                        <td>{c.reference_id}</td>
                        <td>{c.title}</td>
                        <td>{c.description}</td>
                        <td>{c.scheduled_for}</td>
                        <td>{c.created_at}</td>
                        <td>{c.updated_at}</td>
                        <td className="flex gap-2">
                          <IconEdit
                            className="cursor-pointer"
                            onClick={() => openEdit(c)}
                          />
                          <IconTrash
                            className="cursor-pointer text-red-600"
                            onClick={() => handleDelete(c.id)}
                          />
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
          {modal && (
            <AddCampaignModal
              mode={modal.mode}
              initial={modal.campaign}
              onClose={() => { closeModal(); fetchCampaigns(); }}
            />
          )}
        </div>
      </div>

    </div>
  )
}
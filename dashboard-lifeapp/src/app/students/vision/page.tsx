'use client'
import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Inter } from 'next/font/google';
import '@tabler/core/dist/css/tabler.min.css';
import { Sidebar } from '@/components/ui/sidebar';

const inter = Inter({ subsets: ['latin'] });
// const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
const api_startpoint = 'http://152.42.239.141:5000'
// const api_startpoint = 'http://127.0.0.1:5000'


interface SessionRow {
    answer_id:       number;
    vision_title:    string;
    question_title:  string;
    user_name:       string;
    teacher_name:    string;
    answer_text:     string | null;
    answer_option:   string | null;
    media_url:       string | null;
    score:           number | null;
    answer_type:     'text' | 'option' | 'image';
    created_at:      string;
}

export default function VisionSessionsPage() {
    const [rows, setRows] = useState<SessionRow[]>([]);
    const [page, setPage] = useState(1);
    const [perPage] = useState(25);
    const [qtype, setQtype] = useState('');
    const [assignedBy, setAssignedBy] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [loading, setLoading] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  
    const fetchSessions = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('per_page', perPage.toString());
      if (qtype) params.set('question_type', qtype);
      if (assignedBy) params.set('assigned_by', assignedBy);
      if (dateStart) params.set('date_start', dateStart);
      if (dateEnd) params.set('date_end', dateEnd);
  
      const res = await fetch(`${api_startpoint}/api/vision_sessions?${params}`);
      const result = await res.json();
        // Ensure data is an array
        const sessions = Array.isArray(result.data) ? result.data : [];
        setRows(sessions);
      setLoading(false);
    };
  
    useEffect(() => { fetchSessions(); }, [page, qtype, assignedBy, dateStart, dateEnd]);
  
    const handleScoreBlur = async (id: number, value: string) => {
      const newScore = Number(value);
      if (!isNaN(newScore)) {
        await fetch(`${api_startpoint}/api/vision_sessions/${id}/score`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: newScore })
        });
        fetchSessions();
      }
    };
    return (
        <div className={`page bg-body ${inter.className} font-sans`}>
            <Sidebar />
            <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                <div className="page-body">
                    <div className="container-xl pt-4 pb-4 space-y-4">
                        <div className="flex gap-4">
                            <select value={qtype} onChange={(e) => setQtype(e.target.value)}
                                    className="border p-2 rounded">
                                <option value="">All Types</option>
                                <option value="option">MCQ</option>
                                <option value="text">Reflection</option>
                                <option value="image">Image</option>
                            </select>
                            <select value={assignedBy} onChange={e => setAssignedBy(e.target.value)}
                                    className="border p-2 rounded">
                                <option value="">All</option>
                                <option value="teacher">Assigned by Teacher</option>
                                <option value="self">Self-assigned</option>
                            </select>
                            <input type="date" value={dateStart} onChange={e=>setDateStart(e.target.value)}
                                className="border p-2 rounded" />
                            <input type="date" value={dateEnd} onChange={e=>setDateEnd(e.target.value)}
                                className="border p-2 rounded" />
                        </div>
                        {/* Table */}
                        {loading ? <div className='w-8 h-8 border-t-2 border-sky-700 animate-spin rounded-full'></div> : (
                        <table className="w-full table-auto border">
                            <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Vision</th>
                                <th className="p-2 border">Question</th>
                                <th className="p-2 border">User</th>
                                <th className="p-2 border">Teacher</th>
                                <th className="p-2 border">Answer Text</th>
                                <th className="p-2 border">Answer Option</th>
                                <th className="p-2 border">Image Answer</th>
                                <th className="p-2 border">Score</th>
                                <th className="p-2 border">Date</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map(r => (
                                <tr key={r.answer_id}>
                                <td className="p-2 border">{r.vision_title}</td>
                                <td className="p-2 border">{r.question_title}</td>
                                <td className="p-2 border">{r.user_name}</td>
                                <td className="p-2 border">{r.teacher_name}</td>
                                <td className="p-2 border">{r.answer_type === 'text' ? r.answer_text : ''}</td>
                                <td className="p-2 border">{r.answer_type === 'option' ? r.answer_option : ''}</td>
                                <td className="p-2 border">
                                    {r.answer_type === 'image' && r.media_url && (
                                    <img
                                        src={r.media_url}
                                        alt="Answer"
                                        className="h-12 w-12 object-cover cursor-pointer"
                                        onClick={() => setLightboxUrl(r.media_url!)}
                                    />
                                    )}
                                </td>
                                <td className="p-2 border">
                                    <input
                                    type="number"
                                    defaultValue={r.score ?? ''}
                                    onBlur={e => handleScoreBlur(r.answer_id, e.target.value)}
                                    className="w-16 border p-1 rounded"
                                    />
                                </td>
                                <td className="p-2 border">{new Date(r.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        )}

                        {/* Lightbox Modal */}
                        {lightboxUrl && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <img src={lightboxUrl} className="max-h-[90vh] object-contain" />
                            <button
                                className="absolute top-4 right-4 text-white text-2xl"
                                onClick={() => setLightboxUrl(null)}
                            >×</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
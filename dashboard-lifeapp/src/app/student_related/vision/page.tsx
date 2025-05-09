'use client'
import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Inter } from 'next/font/google';
import '@tabler/core/dist/css/tabler.min.css';
import { Sidebar } from '@/components/ui/sidebar';
import NumberFlow from '@number-flow/react';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';

const inter = Inter({ subsets: ['latin'] });
// const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
const api_startpoint = 'http://152.42.239.141:5000'
// const api_startpoint = 'http://127.0.0.1:5000'


interface ModalProps {
    mode: 'add' | 'edit';
    initial?: VisionRow;
    onClose: ()=>void;
    onSuccess: ()=>void;
}
  
function AddEditModal({ mode, initial, onClose, onSuccess }: ModalProps) {
    const isEdit = mode==='edit';
    // form state
    const [title, setTitle] = useState(initial?.title||'');
    const [desc,  setDesc]  = useState(initial?.description||'');
    const [you,   setYou]   = useState(initial?.youtube_url||'');
    const [forAll,setForAll]= useState(initial?initial.allow_for.toString():'1');
    const [subj,  setSubj]  = useState(initial?initial.subject_id.toString():'');
    const [lvl,   setLvl]   = useState(initial?initial.level_id.toString():'');
    const [stat,  setStat]  = useState(initial?initial.status.toString():'1');
    const [q,     setQ]     = useState(initial?.question||'');
    const [qtype, setQtype] = useState(initial?.question_type||'mcq');
    // Parse initial options JSON if provided, otherwise default
    const initialOpts: Record<string,string> = initial && initial.options
    ? (typeof initial.options === 'string'
        ? JSON.parse(initial.options)
        : initial.options)
    : { a: '', b: '', c: '', d: '' };
    const [opts, setOpts] = useState<Record<string,string>>(initialOpts);
    const [ans,   setAns]   = useState(initial?.correct_answer||'');
    const [subjects, setSubjects] = useState<any[]>([]);
    const [levels, setLevels] = useState<any[]>([]);
    const [isAddLoading, setIsAddLoading] = useState(false);
    const handleSave = async () => {
        setIsAddLoading(true)
      const payload: any = {
        title, description: desc, youtube_url: you,
        allow_for:forAll, subject_id:subj, level_id:lvl, status:stat,
        question: q, question_type:qtype
      };
      if (qtype==='mcq') {
        payload.options = opts;
        payload.correct_answer = ans;
      }
      const url = isEdit ? `${api_startpoint}/api/visions/${initial!.vision_id}` : `${api_startpoint}/api/visions`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if (res.ok) {onSuccess(); setIsAddLoading(false);}
      else {alert('Error'); setIsAddLoading(false);}
    };
    
    useEffect(() => { 
        fetch(`${api_startpoint}/api/subjects_list`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // Add this line
            body: JSON.stringify({ status: '1'}) // Optional, but ensures valid POST request
          })
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
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 mt-0">
        <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {isEdit?'Edit':'Add'} Vision Question
          </h3>
          <div className="space-y-3">
            <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)}
                   className="w-full border p-2 rounded" />
            <textarea placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)}
                      className="w-full border p-2 rounded" rows={3} />
            <input placeholder="YouTube URL" value={you} onChange={e=>setYou(e.target.value)}
                   className="w-full border p-2 rounded" />
            <select value={forAll} onChange={e=>setForAll(e.target.value)}
                    className="w-full border p-2 rounded">
                        {/* <option value="">Allow For</option> */}
              <option value="1">All</option>
              <option value="2">Teacher</option>
            </select>
            <select value={subj} onChange={e=>setSubj(e.target.value)} className="w-full border p-2 rounded">
              <option value="">Select Subject</option>
                {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>  {/* Use subject.id as value */}
                            {JSON.parse(subject.title).en}
                        </option>
                    ))}
            </select>
            <select value={lvl} onChange={e=>setLvl(e.target.value)} className="w-full border p-2 rounded">
              <option value="">Select Level</option>
                {levels.map((level) => (
                        <option key={level.id} value={level.id}>  {/* Use level.id as value */}
                            {JSON.parse(level.title).en}
                        </option>
                    ))}
            </select>
            <select value={stat} onChange={e=>setStat(e.target.value)} className="w-full border p-2 rounded">
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
  
            {/* Question fields */}
            <textarea placeholder="Question" value={q} onChange={e=>setQ(e.target.value)}
                      className="w-full border p-2 rounded" rows={2} />
            <select
                value={qtype}
                onChange={e => setQtype(e.target.value as 'mcq' | 'reflection' | 'image')}
                className="w-full border p-2 rounded"
                >
                <option value="mcq">MCQ</option>
                <option value="reflection">Reflection</option>
                <option value="image">Image</option>
            </select>

            {qtype==='mcq' && (
              <>
                {(['a','b','c','d'] as const).map(k => (
                  <input key={k}
                    placeholder={`Option ${k.toUpperCase()}`}
                    value={opts[k]||''}
                    onChange={e=>setOpts({...opts,[k]:e.target.value})}
                    className="w-full border p-2 rounded"
                  />
                ))}
                <select value={ans} onChange={e=>setAns(e.target.value)}
                        className="w-full border p-2 rounded">
                  <option value="">Correct Answer</option>
                  {(['a','b','c','d'] as const).map(k => (
                    <option key={k} value={k}>{k.toUpperCase()}</option>
                  ))}
                </select>
              </>
            )}
  
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={handleSave} className="px-4 flex py-2 rounded bg-sky-600 text-white">
                {isAddLoading && <div className='animate-spin rounded-full w-3 h-3 border-t-2 border-white mr-2'></div>}
                {isAddLoading? 'Saving..':'Save'}</button>
            </div>
          </div>
        </div>
      </div>
    );
}

interface VisionRow {
    vision_id:   number;
    title:       string;
    description: string;
    youtube_url: string | null;
    allow_for:   number;
    subject_id:  number;
    subject:     string;
    level_id:    number;
    level:       string;
    status:      number;
    question_id: number;
    question:    string;
    question_type: 'mcq' | 'reflection' | 'image';
    options:     Record<string,string> | null;
    correct_answer: string | null;
}

export default function VisionsPage() {
    const [rows, setRows] = useState<VisionRow[]>([]);
    const [loading, setLoading] = useState(false);
  
    // Filters
    const [fStatus, setFStatus] = useState<string>('');
    const [fSubject, setFSubject] = useState<string>('');
    const [fLevel,   setFLevel]   = useState<string>('');
    const [fType,    setFType]    = useState<string>('');
  
    // Modal states
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editRow, setEditRow] = useState<VisionRow | null>(null);
  
    // counts
    const totalCount = rows.length;
  
    // Fetch data
    async function fetchVisions() {
      setLoading(true);
      const params = new URLSearchParams();
      if (fStatus)  params.set('status', fStatus);
      if (fSubject) params.set('subject_id', fSubject);
      if (fLevel)   params.set('level_id', fLevel);
      if (fType)    params.set('question_type', fType);
  
      const res = await fetch(`${api_startpoint}/api/visions?${params}`);
      const data: VisionRow[] = await res.json();
      setRows(data);
      setLoading(false);
    }
    

    const [subjects, setSubjects] = useState<any[]>([]);
    const [levels, setLevels] = useState<any[]>([]);

    useEffect(() => { 
        fetchVisions(); 
        fetch(`${api_startpoint}/api/subjects_list`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // Add this line
            body: JSON.stringify({status: '1'}) // Optional, but ensures valid POST request
          })
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

    }, [fStatus, fSubject, fLevel, fType]);
  
    return (
        <div className={`page bg-body ${inter.className} font-sans`}>
            <Sidebar />
            <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                <div className="page-body">
                    <div className="container-xl pt-4 pb-4 space-y-4">
                        <div className="card w-40">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <div>
                                        <div className="subheader">Total Questions</div>
                                        <div className="h1 mb-3">
                                            <NumberFlow
                                            value={totalCount}
                                            className="fw-semi-bold text-dark"
                                            transformTiming={{endDelay:6, duration:750, easing:'cubic-bezier(0.42, 0, 0.58, 1)'}}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Filters */}
                        <div className="flex gap-4">
                            <select value={fStatus} onChange={e => setFStatus(e.target.value)}
                                    className="border p-2 rounded">
                            <option value="">All Status</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                            </select>
                            <select value={fSubject} onChange={e => setFSubject(e.target.value)}
                                    className="border p-2 rounded">
                                <option value="">All Subjects</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>  {/* Use subject.id as value */}
                                        {JSON.parse(subject.title).en}
                                    </option>
                                ))}
                            </select>
                            <select value={fLevel} onChange={e => setFLevel(e.target.value)}
                                    className="border p-2 rounded">
                                <option value="">All Levels</option>
                                {levels.map((level) => (
                                    <option key={level.id} value={level.id}>  {/* Use level.id as value */}
                                        {JSON.parse(level.title).en}
                                    </option>
                                ))}
                            </select>
                            <select value={fType} onChange={e => setFType(e.target.value)}
                                    className="border p-2 rounded">
                            <option value="">All Types</option>
                            <option value="mcq">MCQ</option>
                            <option value="reflection">Reflection</option>
                            <option value="image">Image</option>
                            </select>

                            <button onClick={() => setShowAdd(true)}
                                    className="ml-auto bg-sky-600 text-white px-4 py-2 rounded">
                            Add Vision Question
                            </button>
                        </div>
                        {/* Table */}
                        {loading ? (
                            <div className="w-90 h-90 text-center">
                                <div className=' animate-spin rounded-full w-12 h-12 border-t-2 border-sky-800 text-center'></div>
                            </div>
                        ) : (
                            <table className="w-full table-auto border">
                            <thead>
                                <tr className="bg-gray-100">
                                <th className="p-2 border">Q ID</th>
                                <th className="p-2 border">Title</th>
                                <th className="p-2 border">Description</th>
                                <th className="p-2 border">YouTube</th>
                                <th className="p-2 border">Allow For</th>
                                <th className="p-2 border">Subject</th>
                                <th className="p-2 border">Level</th>
                                <th className="p-2 border">Status</th>
                                <th className="p-2 border">Question</th>
                                <th className="p-2 border">Type</th>
                                <th className="p-2 border">Options</th>
                                <th className="p-2 border">Answer</th>
                                <th className="p-2 border">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                <tr key={r.question_id}>
                                    <td className="p-2 border">{r.question_id}</td>
                                    <td className="p-2 border">{r.title}</td>
                                    <td className="p-2 border">{r.description}</td>
                                    <td className="p-2 border">
                                    {r.youtube_url ? <a href={r.youtube_url} target="_blank">Link</a> : '-'}
                                    </td>
                                    <td className="p-2 border">
                                    {r.allow_for===1?'All':'Teacher'}
                                    </td>
                                    <td className="p-2 border">{r.subject}</td>
                                    <td className="p-2 border">{r.level}</td>
                                    <td className="p-2 border">
                                    {r.status===1?'Active':'Inactive'}
                                    </td>
                                    <td className="p-2 border">{r.question}</td>
                                    <td className="p-2 border">{r.question_type}</td>
                                    <td className="p-2 border">
                                    {r.question_type==='mcq' ? JSON.stringify(r.options) : ''}
                                    </td>
                                    <td className="p-2 border">
                                    {r.question_type==='mcq' ? r.correct_answer: ''}
                                    </td>
                                    <td className="p-2 border flex gap-2 justify-center">
                                    {/* Edit/Delete icons */}
                                    <IconEdit onClick={() => { setEditRow(r); setShowEdit(true);} }
                                            className="text-blue-600"/>
                                    <IconTrash onClick={async ()=>{
                                        await fetch(`${api_startpoint}/api/visions/${r.vision_id}`, {method:'DELETE'});
                                        fetchVisions();
                                    }}
                                            className="text-red-600"/>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                        )}
                        {/* Add Modal */}
                        {showAdd && (
                            <AddEditModal
                            mode="add"
                            onClose={()=>setShowAdd(false)}
                            onSuccess={()=>{setShowAdd(false); fetchVisions();}}
                            />
                        )}
                        {/* Edit Modal */}
                        {showEdit && editRow && (
                            <AddEditModal
                            mode="edit"
                            initial={editRow}
                            onClose={()=>{setShowEdit(false); setEditRow(null);}}
                            onSuccess={()=>{setShowEdit(false); fetchVisions();}}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
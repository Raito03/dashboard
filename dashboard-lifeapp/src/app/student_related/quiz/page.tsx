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
const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
//const api_startpoint = 'http://127.0.0.1:5000'



interface QuizQuestion {
    id: number;
    question_title: string;
    subject_title: string;
    level_title: string;
    status: string;
    question_type?: string;
    options: {
        title: string;
        is_answer: number;
    }[];
};

type Title = { en: string };

type Subject = {
  id: number;
  title: string;
};

type Level = {
  id: number;
  title: string;
};

export default function StudentRelatedQuiz() {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);

    const [filters, setFilters] = useState({ subject_id: '', level_id: '', status: '' });
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);

    const [newQuestion, setNewQuestion] = useState({
        question_title: '',
        subject_id: '',
        level_id: '',
        status: '1',
        type: '2',
        question_type: '1',
        options: ['', '', '', ''],
        correct_index: 0,
    });

    useEffect(() => {
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

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        setLoading(true);
        const payload = {
            subject_id: filters.subject_id,
            level_id: filters.level_id,
            status: filters.status
        };
        const res = await fetch(`${api_startpoint}/api/quiz_questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        const grouped = data.reduce((acc: any, curr: any) => {
            if (!acc[curr.id]) {
                acc[curr.id] = {
                    id: curr.id,
                    question_title: curr.question_title,
                    subject_title: curr.subject_title,
                    level_title: curr.level_title,
                    status: curr.status,
                    options: []
                };
            }
            acc[curr.id].options.push({
                title: curr.answer_option,
                is_answer: curr.is_answer
            });
            return acc;
        }, {});

        setQuestions(Object.values(grouped));
        setLoading(false);
    };

    const handleAddQuestion = async () => {
        const payload = {
            ...newQuestion,
            options: newQuestion.options.map((opt, idx) => ({
                title: opt,
                is_correct: idx === newQuestion.correct_index ? 1 : 0
            }))
        };
        await fetch(`${api_startpoint}/api/add_quiz_question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        setShowModal(false);
        fetchData();
    };

    const confirmDeleteQuestion = (id: number) => {
        setQuestionToDelete(id);
        setConfirmDelete(true);
    };

    const handleDelete = async () => {
        if (!questionToDelete) return;
        await fetch(`${api_startpoint}/api/delete_quiz_question/${questionToDelete}`, {
            method: 'DELETE',
        });
        setConfirmDelete(false);
        setQuestionToDelete(null);
        fetchData();
    };

    const [currentPage, setCurrentPage] = useState(1);
    const questionsPerPage = 10;

    const indexOfLast = currentPage * questionsPerPage;
    const indexOfFirst = indexOfLast - questionsPerPage;
    const paginatedQuestions = questions.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(questions.length / questionsPerPage);

    return  (
        <div className={`page bg-body ${inter.className} font-sans`}>
            <Sidebar />
            <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                <div className="page-body">
                    <div className="container-xl pt-4 pb-4 space-y-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="d-flex flex-col gap-0">
                                <h2 className="text-xl font-semibold pb-0 mb-0">Quiz Questions</h2>
                                <h5 className=' text-muted pb-0 mb-0'>{questions.length} quiz questions found</h5>
                            </div>
                            
                            <button className="btn btn-primary d-flex align-items-center" onClick={() => setShowModal(true)}><IconPlus className="me-2" /> Add New Quiz</button>
                        </div>

                        <div className="row g-2 mb-4">
                            <div className="col-md-4">
                                <label className="form-label">Subject</label>
                                <select className="form-select "  style={{ color: 'black !important' }} onChange={(e) => setFilters({ ...filters, subject_id: e.target.value })}>
                                    <option value=''>All Subjects</option>
                                    {subjects.map(sub => <option key={sub.id} value={sub.id}>{JSON.parse(sub.title).en}</option>)}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Level</label>
                                <select className="form-select" onChange={(e) => setFilters({ ...filters, level_id: e.target.value })}>
                                    <option value=''>All Levels</option>
                                    {levels.map(lv => <option key={lv.id} value={lv.id}>{JSON.parse(lv.title).en}</option>)}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Status</label>
                                <select className="form-select" onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                                    <option value=''>All</option>
                                    <option value='1'>Active</option>
                                    <option value='0'>Inactive</option>
                                </select>
                            </div>
                        </div>

                        {loading ? 
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-800 text-blue"></div>
                            </div>
                             : (
                            <div className="space-y-4">
                                {paginatedQuestions.map(q => (
                                    <div key={q.id} className="card p-4">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div>
                                                <div className="fw-bold">{JSON.parse(q.question_title).en}</div>
                                                <div className="text-muted small">
                                                    Subject: {JSON.parse(q.subject_title).en} | Level: {JSON.parse(q.level_title).en}
                                                </div>
                                            </div>
                                            <button className="btn btn-danger" onClick={() => confirmDeleteQuestion(q.id)}><IconTrash /> Delete</button>
                                        </div>
                                        <div className="row">
                                            {q.options.map((opt, idx) => (
                                                <div key={idx} className="col-md-6">
                                                    <div className={`border rounded p-2 mb-2 ${opt.is_answer ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                                                        {JSON.parse(opt.title).en}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <button
                                        className="btn btn-secondary"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                    >
                                        Previous
                                    </button>
                                    <span>Page {currentPage} of {totalPages}</span>
                                    <button
                                        className="btn btn-secondary"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                    >
                                        Next
                                    </button>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showModal && (
                <div className="modal d-block bg-black bg-opacity-50" tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add New Quiz</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-2">
                                    <label className="form-label">Question Title</label>
                                    <textarea className="form-control" value={newQuestion.question_title} onChange={(e) => setNewQuestion({ ...newQuestion, question_title: e.target.value })} />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">Subject</label>
                                    <select className="form-select" value={newQuestion.subject_id} onChange={(e) => setNewQuestion({ ...newQuestion, subject_id: e.target.value })}>
                                        {subjects.map(sub => <option key={sub.id} value={sub.id}>{JSON.parse(sub.title).en}</option>)}
                                    </select>
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">Level</label>
                                    <select className="form-select" value={newQuestion.level_id} onChange={(e) => setNewQuestion({ ...newQuestion, level_id: e.target.value })}>
                                        {levels.map(lv => <option key={lv.id} value={lv.id}>{JSON.parse(lv.title).en}</option>)}
                                    </select>
                                </div>
                                <div className="mb-2">
                                    {newQuestion.options.map((opt, i) => (
                                        <div key={i} className="mb-2">
                                            <label className="form-label">Option {i + 1}</label>
                                            <input className="form-control" value={opt} onChange={(e) => {
                                                const newOpts = [...newQuestion.options];
                                                newOpts[i] = e.target.value;
                                                setNewQuestion({ ...newQuestion, options: newOpts });
                                            }} />
                                        </div>
                                    ))}
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">Correct Option</label>
                                    <select className="form-select" value={newQuestion.correct_index} onChange={(e) => setNewQuestion({ ...newQuestion, correct_index: parseInt(e.target.value) })}>
                                        {newQuestion.options.map((_, idx) => (
                                            <option key={idx} value={idx}>Option {idx + 1}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={handleAddQuestion}>Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {confirmDelete && (
                <div className="modal d-block" tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button type="button" className="btn-close" onClick={() => setConfirmDelete(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this question?</p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
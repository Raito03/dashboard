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

interface QuizSession {
    id: number;
    la_quiz_game_id: number;
    user_id: number;
    total_questions: number;
    total_correct_answers: number;
    coins: number;
    created_at: string;
    updated_at: string;
}

interface QuestionDetail {
    game_code: string;
    question_id: number;
    question_title: string;
    la_level_id: number;
    la_topic_id: number;
    game_type: string;
    question_type: string;
    is_answer: number;
    answer_option: string;
}

// Add this interface for your component props
interface ExpandedQuestionsProps {
    questions: QuestionDetail[];
    gameId: number;
}
  
  // Then update the component with proper type annotations
function ExpandedQuestions({ questions, gameId }: ExpandedQuestionsProps) {
    const [questionsPage, setQuestionsPage] = useState(1);
    const questionsPerPage = 5;
    
    // Process questions to remove duplicates
    const processedQuestions = useMemo(() => Object.values(
      questions.reduce((acc: Record<number, any>, q: QuestionDetail) => {
        if (!acc[q.question_id]) {
          acc[q.question_id] = {
            question_title: JSON.parse(q.question_title).en,
            options: {}  // Object to track unique options
          };
        }
        
        // Parse the answer option 
        const optionText = JSON.parse(q.answer_option).en;
        
        // Use the option text as a key to ensure uniqueness
        if (!acc[q.question_id].options[optionText] || q.is_answer === 1) {
          acc[q.question_id].options[optionText] = {
            answer_option: optionText,
            is_answer: q.is_answer === 1
          };
        }
        
        return acc;
      }, {})
    ), [questions]);
    
    const totalQuestionPages = Math.ceil(processedQuestions.length / questionsPerPage);
    const startIndex = (questionsPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    const currentQuestions = processedQuestions.slice(startIndex, endIndex);
    
    // Reset to page 1 when questions change
    useEffect(() => {
      setQuestionsPage(1);
    }, [gameId]);
    
    return (
      <div className="max-w-3xl mx-auto px-4">
        <h3 className="text-lg font-medium text-center mb-4">Questions for Game ID: {gameId}</h3>
        
        <div className="flex flex-col items-center space-y-4">
          {currentQuestions.map((question, idx) => (
            <div key={idx} className="p-4 border rounded shadow bg-white w-full">
              <div className="text-base font-medium mb-3 text-center">{question.question_title}</div>
              <div className="flex flex-row justify-center gap-2 flex-wrap">
                {Object.values(question.options).map((option: any, i: number) => (
                  <div
                    key={i}
                    className={`px-4 py-2 rounded shadow text-white ${option.is_answer ? "bg-green-500" : "bg-red-500"}`}
                  >
                    {option.answer_option}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {processedQuestions.length > questionsPerPage && (
          <div className="flex justify-between items-center mt-6 border-t pt-4">
            <button
              onClick={() => setQuestionsPage(prev => Math.max(prev - 1, 1))}
              disabled={questionsPage === 1}
              className="px-3 py-1 bg-sky-950 text-white rounded disabled:opacity-50 text-sm"
            >
              Previous
            </button>
            <span className="text-sm">
              Page {questionsPage} of {totalQuestionPages} ({processedQuestions.length} questions)
            </span>
            <button
              onClick={() => setQuestionsPage(prev => Math.min(prev + 1, totalQuestionPages))}
              disabled={questionsPage === totalQuestionPages}
              className="px-3 py-1 bg-sky-950 text-white rounded disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
}

export default function StudentRelatedQuizSessions() {
    const [quizData, setQuizData] = useState<QuizSession[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [questions, setQuestions] = useState<QuestionDetail[]>([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 50;
    useEffect(() => {
        fetchData();
      }, []);
    
    const fetchData = async () => {
    setLoading(true);
    try {
        const res = await fetch(`${api_startpoint}/api/quiz_sessions`, {
            method:'POST'
        });
        const data = await res.json();
        setQuizData(data);
    } catch (err) {
        console.error("Failed to load quiz session data", err);
    } finally {
        setLoading(false);
    }
    };

    const handleQuestionsClick = async (gameId: number) => {
        if (expandedRow === gameId) {
          setExpandedRow(null);
          return;
        }
        setExpandedRow(gameId);
        setQuestionsLoading(true);
        try {
          const res = await fetch(`${api_startpoint}/api/game_questions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ game_code: gameId }),
          });
          const data = await res.json();
          setQuestions(data);
        } catch (err) {
          console.error('Failed to load questions', err);
        } finally {
          setQuestionsLoading(false);
        }
    };

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = quizData.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(quizData.length / itemsPerPage);
    return (
        <div className={`page bg-body ${inter.className} font-sans`}>
            <Sidebar />
            <div className="page-wrapper" style={{ marginLeft: '250px' }}>
                <div className="page-body">
                    <div className="container-xl pt-4 pb-4 space-y-4">
                        <h2 className="text-xl font-semibold">Quiz Game Sessions</h2>
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                            {/* <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-800"></div> */}
                            <IconLoader2 className="animate-spin" />
                            </div>
                        ) : (
                            <>
                            <div className="overflow-x-auto rounded-lg shadow">
                                <table className="table table-vcenter card-table w-full table-auto min-w-full bg-white border border-gray-200">
                                <thead className="min-w-full bg-gray-100 text-xs font-semibold uppercase text-gray-600">
                                    <tr>
                                    <th className=" text-left">ID</th>
                                    <th className=" text-left">Game ID</th>
                                    <th className=" text-left">User ID</th>
                                    <th className=" text-left">Total Questions</th>
                                    <th className=" text-left">Correct Answers</th>
                                    <th className=" text-left">Coins</th>
                                    <th className=" text-left">Created At</th>
                                    <th className=" text-left">Updated At</th>
                                    <th className="text-left">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-gray-700 ">
                                    {currentItems.map((entry) => (
                                        <React.Fragment key={entry.id}>
                                        <tr key={entry.id} className="border-t">
                                            <td className="">{entry.id}</td>
                                            <td className="">{entry.la_quiz_game_id}</td>
                                            <td className="">{entry.user_id}</td>
                                            <td className="">{entry.total_questions}</td>
                                            <td className="">{entry.total_correct_answers}</td>
                                            <td className="">{entry.coins}</td>
                                            <td className="">{entry.created_at}</td>
                                            <td className="">{entry.updated_at}</td>
                                            <td className="">
                                            <button
                                                onClick={() => handleQuestionsClick(entry.la_quiz_game_id)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Questions
                                            </button>
                                            </td>
                                        </tr>
                                        {/* {expandedRow === entry.la_quiz_game_id && (
                                            <div className="w-full mt-4 flex flex-col items-center ">
                                            {questionsLoading ? (
                                                <div className="flex justify-center py-4">
                                                    <IconLoader2 className="animate-spin" />
                                                </div>
                                            ) : (
                                                <div className="space-y-6 flex flex-col items-center w-full ">
                                                {Object.values(
                                                    questions.reduce((acc: Record<number, any>, q: QuestionDetail) => {
                                                    if (!acc[q.question_id]) {
                                                        acc[q.question_id] = {
                                                        question_title: JSON.parse(q.question_title).en,
                                                        options: []
                                                        };
                                                    }
                                                    acc[q.question_id].options.push({
                                                        answer_option: JSON.parse(q.answer_option).en,
                                                        is_answer: q.is_answer === 1
                                                    });
                                                    return acc;
                                                    }, {})
                                                ).map((question, idx) => (
                                                    <div key={idx} className="p-4 border rounded shadow bg-gray-50">
                                                    <div className="text-base font-medium mb-2">{question.question_title}</div>
                                                    <div className="flex gap-2 flex-row">
                                                        {question.options.map((option: any, i: number) => (
                                                        <div
                                                            key={i}
                                                            className={`px-4 py-2 rounded shadow text-white ${option.is_answer ? "bg-green-500" : "bg-red-500"}`}
                                                        >
                                                            {option.answer_option}
                                                        </div>
                                                        ))}
                                                    </div>
                                                    </div>
                                                ))}
                                                </div>
                                            )}
                                            </div>
                                        )} */}
                                        {expandedRow === entry.la_quiz_game_id && (
                                            <tr>
                                                <td colSpan={9} className="p-0">
                                                <div className="bg-gray-50 py-4 border-t border-b">
                                                    {questionsLoading ? (
                                                    <div className="flex justify-center py-4">
                                                        <IconLoader2 className="animate-spin" />
                                                    </div>
                                                    ) : (
                                                    <ExpandedQuestions 
                                                        questions={questions} 
                                                        gameId={entry.la_quiz_game_id} 
                                                    />
                                                    )}
                                                </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                    ))}
                                </tbody>
                                </table>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                                <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-1 bg-sky-950 text-white rounded disabled:opacity-50"
                                >
                                Previous
                                </button>
                                <span className="text-sm">
                                Page {currentPage} of {totalPages} ({quizData.length} rows found)
                                </span>
                                <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-1 bg-sky-950 text-white rounded disabled:opacity-50"
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
    
    );
}
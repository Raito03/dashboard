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
// const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
const api_startpoint = 'http://152.42.239.141:5000'

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

interface QuestionWithAnswer {
  question_position: number;
  question_id: number;
  question_title: string;      // JSON string, e.g. '{"en":"..."}'
  option_id: number;
  option_text: string;         // JSON string, e.g. '{"en":"..."}'
  is_correct_option: number;   // 1 or 0
  selected_by_user: number;    // 1 or 0
  user_is_correct: number;     // 1 or 0 (same for all options of this question)
  coins_awarded: number;       // coins for that question
}



// Add this interface for your component props
// interface ExpandedQuestionsProps {
//     questions: QuestionDetail[];
//     gameId: number;
// }


  // Then update the component with proper type annotations
// function ExpandedQuestions({ questions, gameId }: ExpandedQuestionsProps) {
//     const [questionsPage, setQuestionsPage] = useState(1);
//     const questionsPerPage = 5;
    
//     // Process questions to remove duplicates
//     const processedQuestions = useMemo(() => Object.values(
//       questions.reduce((acc: Record<number, any>, q: QuestionDetail) => {
//         if (!acc[q.question_id]) {
//           acc[q.question_id] = {
//             question_title: JSON.parse(q.question_title).en,
//             options: {}  // Object to track unique options
//           };
//         }
        
//         // Parse the answer option 
//         const optionText = JSON.parse(q.answer_option).en;
        
//         // Use the option text as a key to ensure uniqueness
//         if (!acc[q.question_id].options[optionText] || q.is_answer === 1) {
//           acc[q.question_id].options[optionText] = {
//             answer_option: optionText,
//             is_answer: q.is_answer === 1
//           };
//         }
        
//         return acc;
//       }, {})
//     ), [questions]);
    
//     const totalQuestionPages = Math.ceil(processedQuestions.length / questionsPerPage);
//     const startIndex = (questionsPage - 1) * questionsPerPage;
//     const endIndex = startIndex + questionsPerPage;
//     const currentQuestions = processedQuestions.slice(startIndex, endIndex);
    
//     // Reset to page 1 when questions change
//     useEffect(() => {
//       setQuestionsPage(1);
//     }, [gameId]);
    
//     return (
//       <div className="max-w-3xl mx-auto px-4">
//         <h3 className="text-lg font-medium text-center mb-4">Questions for Game ID: {gameId}</h3>
        
//         <div className="flex flex-col items-center space-y-4">
//           {currentQuestions.map((question, idx) => (
//             <div key={idx} className="p-4 border rounded shadow bg-white w-full">
//               <div className="text-base font-medium mb-3 text-center">{question.question_title}</div>
//               <div className="flex flex-row justify-center gap-2 flex-wrap">
//                 {Object.values(question.options).map((option: any, i: number) => (
//                   <div
//                     key={i}
//                     className={`px-4 py-2 rounded shadow text-white ${option.is_answer ? "bg-green-500" : "bg-red-500"}`}
//                   >
//                     {option.answer_option}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
        
//         {processedQuestions.length > questionsPerPage && (
//           <div className="flex justify-between items-center mt-6 border-t pt-4">
//             <button
//               onClick={() => setQuestionsPage(prev => Math.max(prev - 1, 1))}
//               disabled={questionsPage === 1}
//               className="px-3 py-1 bg-sky-950 text-white rounded disabled:opacity-50 text-sm"
//             >
//               Previous
//             </button>
//             <span className="text-sm">
//               Page {questionsPage} of {totalQuestionPages} ({processedQuestions.length} questions)
//             </span>
//             <button
//               onClick={() => setQuestionsPage(prev => Math.min(prev + 1, totalQuestionPages))}
//               disabled={questionsPage === totalQuestionPages}
//               className="px-3 py-1 bg-sky-950 text-white rounded disabled:opacity-50 text-sm"
//             >
//               Next
//             </button>
//           </div>
//         )}
//       </div>
//     );
// }

interface ExpandedQuestionsProps {
  questions: QuestionWithAnswer[];
}

function ExpandedQuestions({ questions }: ExpandedQuestionsProps) {
  // Group by question_position
  const byQuestion = React.useMemo(() => {
    const map: Record<number, {
      title: string;
      user_is_correct: boolean;
      coins_awarded: number;
      options: QuestionWithAnswer[];
    }> = {};

    for (const q of questions) {
      if (!map[q.question_position]) {
        map[q.question_position] = {
          title: JSON.parse(q.question_title).en,
          user_is_correct: q.user_is_correct === 1 && q.selected_by_user === 1,
          coins_awarded: q.coins_awarded,
          options: [],
        };
      }
      map[q.question_position].options.push(q);
    }

    // Convert to array and preserve order
    return Object.values(map).sort(
      (a, b) =>
        a.options[0].question_position - b.options[0].question_position
    );
  }, [questions]);

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-6">
      {byQuestion.map((q, idx) => {
        // Find the correct answer text
        const correctOpt = q.options.find(opt => opt.is_correct_option === 1);
        const correctText = correctOpt
          ? JSON.parse(correctOpt.option_text).en
          : "—";

        return (
          <div key={idx} className="p-4 border rounded shadow bg-white">
            {/* Question Title */}
            <div className="text-lg font-semibold mb-2">{q.title}</div>

            {/* Options: highlight only the one the user selected */}
            <div className="flex flex-wrap gap-2 mb-2">
              {q.options.map(opt => {
                const isSelected = opt.selected_by_user === 1;
                const isRight = opt.is_correct_option === 1;

                // default neutral style
                let bg = "bg-gray-200 text-gray-800";
                if (isSelected) {
                  bg = isRight
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white";
                }

                return (
                  <div
                    key={opt.option_id}
                    className={`px-3 py-1 rounded ${bg}`}
                  >
                    {JSON.parse(opt.option_text).en}
                  </div>
                );
              })}
            </div>

            {/* Feedback line */}
            <div className="text-sm mb-1">
              {q.user_is_correct
                ? `✅ You answered correctly and earned ${q.coins_awarded} coins.`
                : `❌ Incorrect — you earned ${q.coins_awarded} coins.`}
            </div>

            {/* Always show the correct answer */}
            <div className="text-sm font-medium">
              Correct answer: <span className="text-blue-600">{correctText}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}



export default function StudentRelatedQuizSessions() {
    const [quizData, setQuizData] = useState<QuizSession[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
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

    const handleQuestionsClick = async (gameId: number, userId: number) => {
        if (expandedRow === gameId) {
          setExpandedRow(null);
          return;
        }
        setExpandedRow(gameId);
        setQuestionsLoading(true);
        try {
          // const res = await fetch(`${api_startpoint}/api/game_questions`, {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //   },
          //   body: JSON.stringify({ game_code: gameId }),
          // });
          // const data = await res.json();
          // setQuestions(data);
          const res = await fetch(`${api_startpoint}/api/game_questions_with_answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              game_id: gameId,
              user_id: userId,      // pass through the user_id too
            }),
          });
          const data: QuestionWithAnswer[] = await res.json();
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
                                                onClick={() => handleQuestionsClick(entry.la_quiz_game_id, entry.user_id)}
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
                                                    <ExpandedQuestions questions={questions} />

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
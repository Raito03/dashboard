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
// const api_startpoint = 'http://127.0.0.1:5000'

interface QuizSession {
  id: number;
  user_id: number;
  game_id: number;
  subject_title: string;
  level_title: string;
  topic_title: string;
  time_taken: number;
  total_questions: number;
  total_correct_answers: number;
  user_name: string;
  school_name: string;
  earn_coins: number;
  heart_coins: number;
  brain_coins: number;
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

  // Filter states
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;

  // Fetch quiz sessions using the new API query
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${api_startpoint}/api/quiz_sessions`, { method: 'POST' });
        const data = await res.json();
        setQuizData(data);
      } catch (err) {
        console.error("Failed to load quiz session data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute unique subjects
  const subjects = useMemo(() => {
    const uniq = new Set(quizData.map(q => JSON.parse(q.subject_title).en));
    return Array.from(uniq);
  }, [quizData]);

  // Compute levels available for the selected subject
  const levels = useMemo(() => {
    if (!selectedSubject) return [];
    const filtered = quizData.filter(q => JSON.parse(q.subject_title).en === selectedSubject);
    const uniq = new Set(filtered.map(q => JSON.parse(q.level_title).en));
    return Array.from(uniq);
  }, [quizData, selectedSubject]);

  // Compute topics available for the selected subject and level
  const topics = useMemo(() => {
    if (!selectedSubject || !selectedLevel) return [];
    const filtered = quizData.filter(
      q => JSON.parse(q.subject_title).en === selectedSubject && JSON.parse(q.level_title).en === selectedLevel
    );
    const uniq = new Set(filtered.map(q => JSON.parse(q.topic_title).en));
    return Array.from(uniq);
  }, [quizData, selectedSubject, selectedLevel]);

  // Filter table data based on selected filters
  const filteredData = useMemo(() => {
    let data = quizData;
    if (selectedSubject) {
      data = data.filter(q => JSON.parse(q.subject_title).en === selectedSubject);
    }
    if (selectedLevel) {
      data = data.filter(q => JSON.parse(q.level_title).en === selectedLevel);
    }
    if (selectedTopic) {
      data = data.filter(q => JSON.parse(q.topic_title).en === selectedTopic);
    }
    return data;
  }, [quizData, selectedSubject, selectedLevel, selectedTopic]);

  // Pagination of filtered data
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Handle filter resets when higher level changes
  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedLevel('');
    setSelectedTopic('');
    setCurrentPage(1);
  };
  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
    setSelectedTopic('');
    setCurrentPage(1);
  };
  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setCurrentPage(1);
  };


  // Add these calculations in your component
  const uniqueUserCount = useMemo(() => {
    const uniqueUsers = new Set(filteredData.map(q => q.user_name));
    return uniqueUsers.size;
  }, [filteredData]);

  const uniqueSchoolCount = useMemo(() => {
    const uniqueSchools = new Set(filteredData.map(q => q.school_name));
    return uniqueSchools.size;
  }, [filteredData]);

  // Add this to your component's state
  const hasActiveFilters = selectedSubject || selectedLevel || selectedTopic;

  // Add this function to handle clearing filters
  const handleClearFilters = () => {
    setSelectedSubject('');
    setSelectedLevel('');
    setSelectedTopic('');
    setCurrentPage(1);
  };
  return (
    <div className={`page bg-body ${inter.className} font-sans`}>
      <Sidebar />
      <div className="page-wrapper" style={{ marginLeft: '250px' }}>
        <div className="page-body">
          <div className="container-xl pt-4 pb-4 space-y-4">
            <h2 className="text-xl font-semibold">Quiz Game Sessions</h2>
            
            {/* Filter Section */}
            <div className="space-y-2">
              <div className="flex flex-col gap-2">
                <h5 className='mb-0'>Select Subject</h5>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(subject => (
                    <div
                      key={subject}
                      onClick={() => handleSubjectSelect(subject)}
                      className={`cursor-pointer px-3 py-1 rounded border ${
                        selectedSubject === subject ? 'bg-sky-800 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {subject}
                    </div>
                  ))}
                </div>
                
              </div>
              {selectedSubject && levels.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h5 className='mb-0'>Select Level</h5>
                  <div className="flex flex-wrap gap-2">
                    {levels.map(level => (
                      <div
                        key={level}
                        onClick={() => handleLevelSelect(level)}
                        className={`cursor-pointer px-3 py-1 rounded border ${
                          selectedLevel === level ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {level}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedSubject && selectedLevel && topics.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h5 className='mb-0'>Select Topic</h5>
                  <div className="flex flex-wrap gap-2">
                    {topics.map(topic => (
                      <div
                        key={topic}
                        onClick={() => handleTopicSelect(topic)}
                        className={`cursor-pointer px-3 py-1 rounded border ${
                          selectedTopic === topic ? 'bg-indigo-800 text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {topic}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-1 w-[12%] rounded border bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
            <div className="flex flex-row gap-4">
              <div className="bg-white shadow rounded p-4 border border-gray-200">
                <div className="text-xs text-gray-500 uppercase mb-1">Total Game Sessions</div>
                <NumberFlow
                  value={filteredData.length}
                  className="text-2xl font-bold text-gray-800"
                  transformTiming={{ endDelay: 6, duration: 750, easing: 'cubic-bezier(0.42, 0, 0.58, 1)' }}
                />
              </div>
              <div className="bg-white shadow rounded p-4 border border-gray-200">
                <div className="text-xs text-gray-500 uppercase mb-1">Unique Students</div>
                <NumberFlow 
                  value={uniqueUserCount}
                  className="text-2xl font-bold text-gray-800"
                  transformTiming={{ endDelay: 6, duration: 750, easing: 'cubic-bezier(0.42, 0, 0.58, 1)' }}
                />
              </div>

              <div className="bg-white shadow rounded p-4 border border-gray-200">
                <div className="text-xs text-gray-500 uppercase mb-1">Unique Schools</div>
                <NumberFlow
                  value={uniqueSchoolCount}
                  className="text-2xl font-bold text-gray-800"
                  transformTiming={{ endDelay: 6, duration: 750, easing: 'cubic-bezier(0.42, 0, 0.58, 1)' }}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <IconLoader2 className="animate-spin" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg shadow">
                  <table className="table table-vcenter card-table w-full table-auto min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-100 text-xs font-semibold uppercase text-gray-600">
                      <tr>
                        <th className="text-left">User ID</th>
                        <th className="text-left">Game ID</th>
                        <th className="text-left">Subject</th>
                        <th className="text-left">Level</th>
                        <th className="text-left">Topic</th>
                        <th className="text-left">Time Taken</th>
                        <th className="text-left">Total Q</th>
                        <th className="text-left">Correct Q</th>
                        <th className="text-left">User Name</th>
                        <th className="text-left">School</th>
                        <th className="text-left">Earn Coins</th>
                        <th className="text-left">Heart Coins</th>
                        <th className="text-left">Brain Coins</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700">
                      {currentItems.map((entry, index) => (
                        <tr key={`${entry.id}-${index}`} className="border-t">
                          <td>{entry.user_id}</td>
                          <td>{entry.game_id}</td>
                          <td>{JSON.parse(entry.subject_title).en}</td>
                          <td>{JSON.parse(entry.level_title).en}</td>
                          <td>{JSON.parse(entry.topic_title).en}</td>
                          <td>{entry.time_taken}</td>
                          <td>{entry.total_questions}</td>
                          <td>{entry.total_correct_answers}</td>
                          <td>{entry.user_name}</td>
                          <td>{entry.school_name}</td>
                          <td>{entry.earn_coins}</td>
                          <td>{entry.heart_coins}</td>
                          <td>{entry.brain_coins}</td>
                          {/* Expanded row portion commented out
                          {expandedRow === entry.game_id && (
                            <tr key={`${entry.user_id}-${entry.game_id}-expanded`}>
                              <td colSpan={13} className="p-0">
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
                          */}
                        </tr>
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
                    Page {currentPage} of {totalPages} ({filteredData.length} rows found)
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
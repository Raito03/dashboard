'use client'
import '@tabler/core/dist/css/tabler.min.css';
// import 'bootstrap/dist/css/bootstrap.min.css';  // Import Bootstrap CSS
//import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Import Bootstrap JS (includes Popper.js)

import { useState, useEffect } from 'react'
import NumberFlow from '@number-flow/react'
import {
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  TooltipProps,
  BarChart,
  Legend as rechartsLegend,
  Bar
} from 'recharts'
import {
  IconSettings,
  IconSearch,
  IconBell,
  IconUsers,
  IconUserCheck,
  IconUserPlus,
  IconPercentage,
} from '@tabler/icons-react'
import { Bar as ChartJSBar, Pie as ChartJSPie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartJSTooltip,
  Legend,
  ArcElement
} from 'chart.js'
import React from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartJSTooltip, Legend, ArcElement)

// Define the type for your API data
interface SignupData {
  month: string | null
  count: number
}

import ReactECharts from 'echarts-for-react';

const groupings = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'lifetime'];

// import Sidebar from './sidebar';
import { title } from 'process';
import { Sidebar } from '@/components/ui/sidebar';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

//const api_startpoint = 'https://lifeapp-api-vv1.vercel.app'
const api_startpoint = 'http://152.42.239.141:5000'
// const api_startpoint = 'http://127.0.0.1:5000'

interface userTypeChart {
  count:number,
  userType: string | null
}

interface EchartSignup {
  period: string | null,
  count: number,
  user_type: string,
  Admin: string,
  Mentor: string,
  Student: string,
  Teacher:string,
  Unspecified: string
}

interface QuizHistogramEntry {
  count: number;
  subject: string;
  level: string;
  topic: string;
}


interface StudentsByGrade {
  grade: number | null;
  count: number;
}

interface TeachersByGrade {
  grade: number | null;
  count: number;
}

interface DemographChartdata {
  code: string;
  value: number;
}
interface DemographData {
  count: string;
  state: string;
}

export default function UserAnalyticsDashboard() {
  const [EchartData, setEChartData] = useState<EchartSignup[]>([]);
  const [grouping, setGrouping] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Function to fetch data from the API based on the selected grouping
  const fetchDataEcharts = (selectedGrouping: string) => {
    setLoading(true);
    const params = new URLSearchParams({
      grouping: selectedGrouping,
      // Uncomment and set these if you want to filter by date:
      // start_date: '2023-01-01',
      // end_date: '2023-12-31'
    });

    fetch(`${api_startpoint}/api/signing-user`, {
              method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({grouping: selectedGrouping})
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Assume API returns data in a { data: [{ period, count }, ...] } format
        // setEChartData(data.data);
        // setLoading(false);
        const groupedData = data.data.reduce((acc: any, entry: any) => {
          if (!acc[entry.period]) acc[entry.period] = { period: entry.period };
          acc[entry.period][entry.user_type] = entry.count;
          return acc;
        }, {});
  
        setEChartData(Object.values(groupedData));
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  // Fetch new data whenever the grouping changes
  useEffect(() => {
    fetchDataEcharts(grouping);
  }, [grouping]);
  // Configure the ECharts option
  const EchartOption = {
    title: {
      text: 'User Signups by Type Over Time',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      //
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
      data: EchartData.map(item => item.period),
      boundaryGap: grouping === 'lifetime' ? true : false,
      axisLabel: {
        // Rotate labels for daily grouping for better readability
        rotate: grouping === 'daily' ? 45 : 0
      }
    },
    yAxis: {
      type: 'value'
    },
    // Data zoom enables efficient panning and zooming on the chart
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
    // series: [
    //   {
    //     name: 'Signups',
    //     type: 'bar',
    //     data: EchartData.map(item => item.count),
    //     barMaxWidth: '50%',
    //     itemStyle: {
    //       color: '#5470C6'
    //     }
    //   }
    // ]
    series:  [
      {
        name: 'Admin',
        type: 'bar',
        stack: 'total',
        data: EchartData.map(item => item.Admin || 0),
        itemStyle: { color: '#1E3A8A' }
      },
      {
        name: 'Student',
        type: 'bar',
        stack: 'total',
        data: EchartData.map(item => item.Student || 0),
        itemStyle: { color: '#3B82F6' }
      },
      {
        name: 'Mentor',
        type: 'bar',
        stack: 'total',
        data: EchartData.map(item => item.Mentor || 0),
        itemStyle: { color: '#60A5FA' }
      },
      {
        name: 'Teacher',
        type: 'bar',
        stack: 'total',
        data: EchartData.map(item => item.Teacher || 0),
        itemStyle: { color: '#93C5FD' }
      },
      {
        name: 'Unspecified',
        type: 'bar',
        stack: 'total',
        data: EchartData.map(item => item.Unspecified || 0),
        itemStyle: { color: '#0F172A' }
      }
    ]
  };

  // Handle dropdown change to update the grouping
  const handleGroupingChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    setGrouping(e.target.value);
  };




  const [mounted, setMounted] = useState(false)
  const [chartData, setChartData] = useState<SignupData[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch user signups data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${api_startpoint}/api/user-signups`)
        const data = (await res.json()) as SignupData[]
        setChartData(data)

        const availableYears: string[] = Array.from(
          new Set(
            data
              .filter((item) => item.month)
              .map((item) => (item.month ? item.month.split('-')[0] : ''))
              .filter((year) => year !== '')
          )
        )

        if (availableYears.length > 0) {
          setSelectedYear(availableYears[0])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  const filteredData = selectedYear
    ? chartData.filter((item) => item.month && item.month.startsWith(selectedYear))
    : chartData

  const years: string[] = chartData.length
    ? Array.from(
        new Set(
          chartData
            .filter((item) => item.month)
            .map((item) => (item.month ? item.month.split('-')[0] : ''))
            .filter((year) => year !== '')
        )
      )
    : []

  // Fetch additional metrics (totalUsers, activeUsers, approvalRate)
  const [totalUsers, setTotalUsers] = useState<number>(0)
  useEffect(() => {
    async function fetchUserCount() {
      try {
        const res = await fetch(`${api_startpoint}/api/user-count`)
        const data = await res.json()
        if (data && data.length > 0) {
          setTotalUsers(data[0].count)
        }
      } catch (error) {
        console.error('Error fetching user count:', error)
      }
    }
    fetchUserCount()
  }, [])

  const [activeUsers, setActiveUsers] = useState<number>(0)
  useEffect(() => {
    async function fetchActiveUserCount() {
      try {
        const res = await fetch(`${api_startpoint}/api/active-user-count`)
        const data = await res.json()
        if (data && data.length > 0 && data[0].active_users !== undefined) {
          setActiveUsers(data[0].active_users)
        } else {
          setActiveUsers(0)
        }
      } catch (error) {
        console.error('Error fetching user count:', error)
        setActiveUsers(0)
      }
    }
    fetchActiveUserCount()
  }, [])

  const [newSignups, setNewSignups] = useState<number>(0)
  useEffect(() => {
    async function fetchNewSignups() {
      try {
        const res = await fetch(`${api_startpoint}/api/new-signups`)
        const data = await res.json()
        if (data && data.length > 0 && data[0].count !== undefined) {
          setNewSignups(data[0].count)
        } else {
          setNewSignups(0)
        }
      } catch (error) {
        console.error('Error fetching user count:', error)
        setNewSignups(0)
      }
    }
    fetchNewSignups()
  }, [])

  const [approvalRate, setApprovalRate] = useState<number>(0)
  useEffect(() => {
    async function fetchApprovalRate() {
      try {
        const res = await fetch(`${api_startpoint}/api/approval-rate`)
        const data = await res.json()
        if (data && data.length > 0 && data[0].Approval_Rate !== undefined) {
          setApprovalRate(data[0].Approval_Rate)
        } else {
          setApprovalRate(0)
        }
      } catch (error) {
        console.error('Error fetching approval rate:', error)
        setApprovalRate(0)
      }
    }
    fetchApprovalRate()
  }, [])

  // Coupon redeem chart data
  const [couponRedeemCount, setCouponRedeemCount] = useState<Array<{ amount: string; coupon_count: number }>>([])
  useEffect(() => {
    async function fetchCouponRedeemCount() {
      try {
        const res = await fetch(`${api_startpoint}/api/coupons-used-count`)
        const data = await res.json()
        if (data && Array.isArray(data) && data.length > 0) {
          setCouponRedeemCount(data)
        } else {
          setCouponRedeemCount([])
        }
      } catch (error) {
        console.error('Error fetching coupon counts:', error)
        setCouponRedeemCount([])
      }
    }
    fetchCouponRedeemCount()
  }, [])

  const pieChartData = {
    labels: couponRedeemCount.map((item) => item.amount),
    datasets: [
      {
        data: couponRedeemCount.map((item) => item.coupon_count),
        backgroundColor: ['#6549b9', '#FF8C42', '#1E88E5', '#43A047', '#FDD835', '#D81B60'],
        borderWidth: 0,
      },
    ],
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#333' } },
      tooltip: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    cutout: '70%',
    animation: { animateScale: true },
  }

  // Teacher assignment counts and chart data
  const [assignCounts, setAssignCounts] = useState<number[]>([])
  useEffect(() => {
    async function fetchTeacherAssignCounts() {
      try {
        const res = await fetch(`${api_startpoint}/api/teacher-assign-count`)
        const data = await res.json()
        const counts = data.map((item: { assign_count: number }) => item.assign_count)
        setAssignCounts(counts)
      } catch (error) {
        console.error('Error fetching teacher assignment counts:', error)
      }
    }
    fetchTeacherAssignCounts()
  }, [])

  const bins = [0, 5, 10, 15, 20, 25]
  const binLabels = ['1-5', '6-10', '11-15', '16-20', '21-25', '26+']
  const binData = Array(binLabels.length).fill(0)
  assignCounts.forEach((count) => {
    if (count <= 5) binData[0]++
    else if (count <= 10) binData[1]++
    else if (count <= 15) binData[2]++
    else if (count <= 20) binData[3]++
    else if (count <= 25) binData[4]++
    else binData[5]++
  })

  const teacherAssignData = {
    labels: binLabels,
    datasets: [
      {
        label: 'Number of Teachers',
        data: binData,
        backgroundColor: '#4A90E2',
        borderRadius: 5,
      },
    ],
  }

  const teacherAssignOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ChartJSTooltip: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        borderWidth: 1,
      },
      legend: { labels: { color: '#333' } },
    },
    scales: {
      x: { ticks: { color: '#333' }, grid: { color: '#eee' },
        title:{
          display: true,
          text: 'Assignment Count Range',
          color: '#333',
        } },
      y: { ticks: { color: '#333' }, grid: { color: '#eee' },
      title:{
        display: true,
        text: 'Number of Teachers',
        color: '#333',
      } },
    },
  }

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="card card-sm">
          <div className="card-body">
            <p className="mb-0">Month: {label}</p>
            <p className="mb-0">Count: {payload[0].value}</p>
          </div>
        </div>
      )
    }
    return null
  }

  // Add this state variable with your existing state declarations
  const [stateCounts, setStateCounts] = useState<Array<{ state: string; count_state: number }>>([]);

  // Add this useEffect block with your existing useEffect hooks
  useEffect(() => {
    async function fetchSchoolStateCounts() {
      try {
        const res = await fetch(`${api_startpoint}/api/count-school-state`);
        const data = await res.json();
        
        // Check if data exists and is an array with valid structure
        if (data && Array.isArray(data) && data.length > 0 && data[0].state !== undefined) {
          setStateCounts(data);
        } else {
          setStateCounts([]);
        }
      } catch (error) {
        console.error('Error fetching school state counts:', error);
        setStateCounts([]);
      }
    }
    fetchSchoolStateCounts();
  }, []);
  const schoolStateData = {
    labels: stateCounts.map((item) => item.state),
    datasets: [
      {
        label: 'No. of Schools',
        data: stateCounts.map((item) => item.count_state),
        backgroundColor: '#4A90E2',
        // Adding border radius to each bar
        borderRadius: 15,
        borderSkipped: false,
      },
    ],
  };
  const schoolChartOptions = {
    indexAxis: "y" as const, // Makes it a horizontal bar chart
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        font: { size: 16 },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#333',
        },
        grid: {
          color: '#eee',
        },
      },
      y: {
        ticks: {
          color: '#333',
        },
        grid: {
          color: '#eee',
        },
      },
    },
  };
  
  const [userTypeData, setUserTypeData] = useState<userTypeChart[]>([])
  useEffect(() => {
    async function fetchUserType() {
      try {
        const res = await fetch(`${api_startpoint}/api/user-type-chart`)
        const data = await res.json()
        if (data && data.length > 0) {
          setUserTypeData(data)
        }
      } catch (error) {
        console.error('Error fetching user type:', error)
      }
    }
    fetchUserType()
  }, [])

  // Prepare chart options
  const deepBlueColors = ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#0F172A'];

  const userTypeChartOptions = {
    backgroundColor: 'white',
    title: {
      text: 'User Type',
      left: 'center',
      top: 20,
      textStyle: {
        color: 'black'
      }
    },
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        name: 'Number of',
        type: 'pie',
        radius: '55%', // Creates a donut effect for better label spacing
        center: ['50%', '50%'],
        data: userTypeData.map((item, index) => ({
          value: item.count,
          name: item.userType || 'Unknown',
          itemStyle: { color: deepBlueColors[index % deepBlueColors.length] }
        })),
        label: {
          show: true,
          color: '#000',
          fontSize: 14,
          // formatter: '{b}: {c} ({d}%)' // Show name, count, and percentage
        },
        labelLine: {
          show: true,
          length: 15, // Line before text
          length2: 20, // Line connecting to the label
          lineStyle: {
            color: '#000',
            width: 0.5
          }
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function () {
          return Math.random() * 200;
        }
      }
    ]
  };

  const [histogramLevelSubjectMissionData, setHistogramLevelSubjectMissionData] = useState<any[]>([]);
  // Fetch histogram data from the backend
  useEffect(() => {
    async function fetchHistogramLevelSubjectMissionData() {
      try {
        const res = await fetch(`${api_startpoint}/api/histogram_level_subject_challenges_complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();

        const getText = (val: any) => {
          try {
            const parsed = JSON.parse(val);
            return parsed.en || val; // fallback to raw if no 'en'
          } catch {
            return val; // not JSON, return as is
          }
        };
        // Group the data by level_title
        // Create an object where each key is a level title and its value is an object containing subject counts.
        const grouped: { [level: string]: any } = {};
        data.forEach((entry: { count: number; subject_title: string; level_title: string; }) => {
          const level = getText(entry.level_title);
          const subject = getText(entry.subject_title);
        
          if (!grouped[level]) {
            grouped[level] = { level };
          }
        
          grouped[level][subject] = entry.count;
        });
        // Convert the object into an array
        setHistogramLevelSubjectMissionData(Object.values(grouped));
      } catch (error) {
        console.error("Error fetching histogram data:", error);
      }
    }
    fetchHistogramLevelSubjectMissionData();
  }, []);

  // Determine unique subject keys (the keys in each grouped object other than "level")
  const subjectKeys: string[] = Array.from(
    new Set(
      histogramLevelSubjectMissionData.flatMap(item =>
        Object.keys(item).filter((key) => key !== "level")
      )
    )
  );
  const LegendComponent = rechartsLegend;

  const [quizHistogramData, setQuizHistogramData] = useState<QuizHistogramEntry[]>([]);
  const [formattedData, setFormattedData] = useState<any[]>([]);
  const [subjectKeysQuiz, setSubjectKeysQuiz] = useState<string[]>([]);
  useEffect(() => {
    async function fetchHistogramDataQuizTopicLevel() {
      try {
        const res = await fetch(`${api_startpoint}/api/histogram_topic_level_subject_quizgames`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const raw = await res.json();

        const grouped: { [level: string]: any } = {};
        const subjectsSet = new Set<string>();
  
        raw.forEach((entry: any) => {
          const subject = JSON.parse(entry.subject_title).en;
          const level = JSON.parse(entry.level_title).en;
  
          subjectsSet.add(subject);
  
          if (!grouped[level]) {
            grouped[level] = { level };
          }
  
          grouped[level][subject] = entry.count;
        });
  
        setFormattedData(Object.values(grouped));
        setSubjectKeysQuiz(Array.from(subjectsSet));
      } catch (err) {
        console.error("Error fetching histogram:", err);
      }
    }
    fetchHistogramDataQuizTopicLevel();
  }, []);


  const [studentsByGrade, setStudentsByGrade] = useState<StudentsByGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStudentsByGrade, setErrorStudentsByGrade] = useState<string | null>(null);
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
              setErrorStudentsByGrade(err instanceof Error ? err.message : 'An unknown error occurred');
              setIsLoading(false);
          }
      };
  
      fetchStudentsByGrade();
  }, []);
  
  const [totalStudents, setTotalStudents] = useState<number>(0)
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

  const [teachersByGrade, setTeachersByGrade] = useState<TeachersByGrade[]>([]);
  const [isLoadingTeacherByGrade, setIsLoadingTeacherBygrade] = useState(true);
  const [errorTeacherByGrade, setErrorTeacherByGrade] = useState<string | null>(null);
  useEffect(() => {
      const fetchTeachersByGrade = async () => {
          try {
              const response = await fetch(`${api_startpoint}/api/teachers-by-grade`, {
                  method: "POST"
              });
              if (!response.ok) {
                  throw new Error('Failed to fetch Teachers by grade');
              }
              const data: TeachersByGrade[] = await response.json();
              
              // Sort the data by grade, handling null last
              const sortedData = data.sort((a, b) => {
                  if (a.grade === null) return 1;
                  if (b.grade === null) return -1;
                  return (a.grade as number) - (b.grade as number);
              });
  
              setTeachersByGrade(sortedData);
              setIsLoading(false);
          } catch (err) {
              setErrorTeacherByGrade(err instanceof Error ? err.message : 'An unknown error occurred');
              setIsLoading(false);
          }
      };
  
      fetchTeachersByGrade();
  }, []);

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


  // Build options for the Students by Grade bar chart
  const studentsChartOption = {
    // title: {
    //   text: 'Students Distribution by Grade',
    //   left: 'center'
    // },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: studentsByGrade.map(item =>
        item.grade === null ? 'Unspecified' : `Grade ${item.grade}`
      ),
      name: 'Grade',
      axisLabel: { rotate: 0 }
    },
    yAxis: {
      type: 'value',
      name: 'Number of Students'
    },
    // Data zoom enables efficient panning and zooming on the chart
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
        name: 'Students',
        type: 'bar',
        data: studentsByGrade.map(item => item.count),
        itemStyle: {
          color: '#4CAF50'
        },
        // Optionally, show labels on bars
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  };

  // Build options for the Teachers by Grade bar chart
  const teachersChartOption = {
    // title: {
    //   text: 'Teachers Distribution by Grade',
    //   left: 'center'
    // },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: teachersByGrade.map(item =>
        item.grade === null ? 'Unspecified' : `Grade ${item.grade}`
      ),
      name: 'Grade'
    },
    yAxis: {
      type: 'value',
      name: 'Number of Teachers'
    },
    // Data zoom enables efficient panning and zooming on the chart
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
        name: 'Teachers',
        type: 'bar',
        data: teachersByGrade.map(item => item.count),
        itemStyle: {
          color: '#FF9800'
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  };


  const [chartStudentsData, setChartStudentsData] = useState<DemographChartdata[]>([]);

  useEffect(() => {
    async function fetchStateData() {
      try {
        // Fetch state-wise student count from API
        const apiResponse = await fetch(`${api_startpoint}/api/demograph-students`, {
          method: 'POST'
        });
        const apiData: { count: string; state: string }[] = await apiResponse.json();

        // Map API state names to your defined region keys
        const stateMappings: Record<string, string> = {
          "Tamil Nadu": "tamil nadu",     
          "Telangana": "telangana",       
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
          "Puducherry": "puducherry",
          "Rajasthan": "rajasthan",
          "Goa": "goa",
          "Kerala": "kerala",
          "Uttarakhand": "uttarakhand",
          "Himachal Pradesh": "himachal pradesh",
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

        // Transform API data into chart data. Use mapping if available,
        // otherwise fallback to the original state name.
        const transformedData: DemographChartdata[] = apiData
          .map((item) => ({
            code: stateMappings[item.state] || item.state,
            value: Math.max(parseInt(item.count, 10), 1) // ensuring a minimum count of 1
          }))
          .filter((item) => item.code);

        setChartStudentsData(transformedData);
      } catch (error) {
        console.error('Error fetching state-wise student count:', error);
      }
    }
    fetchStateData();
  }, [api_startpoint]);

  // Configure ECharts options
  const chartOptions = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: chartStudentsData.map(item => item.code),
      name: 'States',
      axisLabel: {
        rotate: 45,
        formatter: (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
      }
    },
    yAxis: {
      type: 'value',
      name: 'Student Count'
    },
    // Data zoom enables efficient panning and zooming on the chart
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
        name: 'Students',
        type: 'bar',
        data: chartStudentsData.map(item => item.value),
        itemStyle: {
          color: '#4a90e2'
        }
      }
    ]
  };

  const [chartTeacherData, setChartTeacherData] = useState<DemographChartdata[]>([]);
  const [geoData, setGeoData] = useState<DemographData[]>([]);

  useEffect(() => {
    async function fetchTeacherData() {
      try {
        // Fetch state-wise teacher count from API
        const apiResponse = await fetch(`${api_startpoint}/api/demograph-teachers`, {
          method: 'POST'
        });
        const apiData: DemographData[] = await apiResponse.json();

        // Store the API data (for debugging or future use)
        setGeoData(apiData);

        // Define the mapping from API state names to your desired region keys
        const stateMappings: Record<string, string> = {
          "Tamil Nadu": "tamil nadu",
          "Telangana": "telangana",
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
          "Puducherry": "puducherry",
          "Rajasthan": "rajasthan",
          "Goa": "goa",
          "Kerala": "kerala",
          "Uttarakhand": "uttarakhand",
          "Himachal Pradesh": "himachal pradesh",
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

        // Transform the API data into chart-friendly format
        const transformedData: DemographChartdata[] = apiData
          .map((item) => ({
            code: stateMappings[item.state] || '', // Map using provided keys or return empty string
            value: Math.max(parseInt(item.count, 10), 1) // Ensure a minimum value of 1
          }))
          .filter((item) => item.code); // Filter out records with no mapping

          setChartTeacherData(transformedData);
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      }
    }

    fetchTeacherData();
  }, [api_startpoint]);

  // ECharts configuration options
  const teacherDemographicOptions = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: chartTeacherData.map((item) => item.code),
      name: 'States',
      axisLabel: {
        rotate: 45,
        formatter: (value: string) =>
          value.charAt(0).toUpperCase() + value.slice(1)
      }
    },
    yAxis: {
      type: 'value',
      name: 'Teacher Count'
    },
    // Data zoom enables efficient panning and zooming on the chart
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
        name: 'Teachers',
        type: 'bar',
        data: chartTeacherData.map((item) => item.value),
        itemStyle: {
          color: '#4a90e2'
        }
      }
    ]
  };

  interface Sessions {
    id: number;
    name: string;
    status: number;
    zoom_link: string;
    zoom_password: string;
    heading: string;
    description?: string; // Add this line
    date_time: string;
  }
  
    // Fetch sessions from the API endpoint.
  const [sessions, setSessions] = useState<Sessions[]>([]);
  const fetchSessions = () => {
      setLoading(true);
      fetch(`${api_startpoint}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setSessions(data);
          // console.log(sessions)
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching sessions:', err);
          setLoading(false);
        });
  };

  useEffect(() => {
      fetchSessions();
  }, []);
  return (
    <div className={`page bg-light ${inter.className} font-sans`}>
      {/* Fixed Sidebar */}
      {/* Updated Sidebar Component with strict inline styles */}
      <Sidebar />
      


      {/* Main Content */}
      <div className="page-wrapper" style={{ marginLeft: '250px' }}>
        {/* Top Navigation */}
        {/* <header className="navbar navbar-expand-md navbar-light bg-white shadow-sm border-bottom">
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

        {/* Main Content Area */}
        <div className="page-body">
          <div className="container-xl pt-0 pb-4">
            {/* Header */}
            <div className="page-header mb-4 mt-0">
              <div className="row align-items-center">
                <div className="col">
                  <h2 className="page-title mb-1 fw-bold text-dark">Dashboard Overview</h2>
                  <p className="text-muted mb-0">Platform statistics and analytics</p>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="row g-4 mb-4">
              {[
                { title: 'Total Users', value: totalUsers, icon: <IconUsers />, color: 'bg-purple' },
                { title: 'Active Users', value: activeUsers, icon: <IconUserCheck />, color: 'bg-teal' },
                { title: 'Inactive Users', value: 0, icon: <IconUserPlus />, color: 'bg-orange' },
                // { title: 'New Signups', value: newSignups, icon: <IconUserPlus />, color: 'bg-orange' },
                { title: 'Highest Users Online', value: 0, icon: <IconUserPlus />, color: 'bg-orange', suffix: '' },
                { title: 'Total Sessions Created by Mentors', value: sessions.length, icon: <IconPercentage />, color: 'bg-blue',},
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

            {/* Charts Section */}
            {mounted && (

                
                <div className="row g-4">
                  <div className='w-full h-45'>
                    <div style={{ marginBottom: '20px' }}>
                      <label htmlFor="grouping-select">Select Time Grouping: </label>
                      <select id="grouping-select" value={grouping} onChange={handleGroupingChange}>
                        {groupings.map(g => (
                          <option key={g} value={g}>
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {loading ? (
                      <div className="text-center">
                      
                      <div className="spinner-border text-purple" role="status" style={{ width: "8rem", height: "8rem" }}></div>
                      </div>
                    ) : error ? (
                      <div>Error: {error}</div>
                    ) : (
                      <ReactECharts option={EchartOption} style={{ height: '400px', width: '100%' }} />
                    )}
                  </div>
                {/* Signups Chart */}
                {/* <div className="col-12 col-xl-6">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-transparent d-flex justify-content-between align-items-center py-3">
                      <h3 className="card-title mb-0 fw-semibold">User Signups Trend</h3>
                      <select
                        className="form-select form-select-sm w-auto"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                      >
                        {years.map((year) => (
                          <option className='border-0' key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="card-body pt-0">
                      <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%" >
                          
                            <AreaChart data={filteredData}>
                              <defs>
                                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="35%" stopColor="#4A90E2" stopOpacity={0.8} />
                                  <stop offset="95%" stopColor="#4A90E2" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis 
                                dataKey="month" 
                                stroke="#333" 
                                label={{ value: "Month", position: "insideBottom", offset: -5 }} 
                              />
                              <YAxis 
                                stroke="#333" 
                                label={{ value: "Number of Signups", position: "center", angle: -90, dy: 10, dx: -20 }} 
                                />
                              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey="count" stroke="#4A90E2" fill="url(#colorUv)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div> */}
                {/* Histogram Level Subject Challenges completed wise */}
                <div className="col-12 col-xl-6">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-transparent py-3">
                        <h3 className="card-title mb-0 fw-semibold">Mission Completed</h3>
                    </div>
                    {/* <h2 className="text-2xl font-bold mb-4">Mission Completes Histogram</h2> */}
                    {histogramLevelSubjectMissionData.length === 0 ? (
                      <div className="text-center">
                      
                      <div className="spinner-border text-purple" role="status" style={{ width: "4rem", height: "4rem" }}></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={histogramLevelSubjectMissionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="level" label={{ value: 'Level', position: 'insideBottom', offset: -5 }} />
                          <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <LegendComponent /> 
                          {/* Dynamically create a bar for each subject key */}
                          {subjectKeys.map((subject, index) => (
                            <Bar key={subject} dataKey={subject} fill={["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE"][index % 5]} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
                {/* Histogram Level Subject Quiz completed wise */}
                <div className="col-12 col-xl-6">
                  <div className="card shadow-sm border-0 h-100">
                      <div className="card-header bg-transparent py-3">
                          <h3 className="card-title mb-0 fw-semibold">Quiz Completed</h3>
                      </div>
                      {formattedData.length === 0 ? (
                        <div className="text-center">
                      
                        <div className="spinner-border text-purple" role="status" style={{ width: "4rem", height: "4rem" }}></div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart
                            data={formattedData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="level" />
                            <YAxis label={{value: 'count', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <LegendComponent />
                            {subjectKeysQuiz.map((key, index) => (
                              <Bar
                                key={key}
                                dataKey={key}
                                fill={`hsl(${(index * 70) % 360}, 70%, 60%)`}
                                name={key}
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>

                      
                    )}
                  </div>
                </div>

                {/* Student Grade Distribution table */}
                <div className="col-12 col-xl-6">
                  <div className="card shadow-sm border-0 h-100">
                      <div className="card-header bg-transparent py-3">
                        <h3 className="card-title mb-0 fw-semibold">Students by Grade Distribution</h3>
                      </div>
                    <div className="card-body">
                      {isLoading ? (
                        <div className="text-center">
                          <div className="spinner-border text-purple" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2">Loading students by grade...</p>
                        </div>
                      ) : errorStudentsByGrade ? (
                        <div className="text-center text-danger">
                          <p>Error: {errorStudentsByGrade}</p>
                        </div>
                      ) : (
                        <ReactECharts
                          option={studentsChartOption}
                          style={{ height: '400px', width: '100%' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Teachers by Grade Distribution table */}
                <div className="col-12 col-xl-6">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-transparent py-3">
                      <h5 className="card-title mb-0 fw-semibold">Teachers by Grade Distribution</h5>
                    </div>
                    <div className="card-body">
                      {isLoading ? (
                        <div className="text-center">
                          <div className="spinner-border text-purple" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2">Loading teachers by grade...</p>
                        </div>
                      ) : error ? (
                        <div className="text-center text-danger">
                          <p>Error: {errorTeacherByGrade}</p>
                        </div>
                      ) : (
                        <ReactECharts
                          option={teachersChartOption}
                          style={{ height: '400px', width: '100%' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Student Demographics Distribution table */}
                <div className="col-12 col-xl-6">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-transparent py-3">
                      <h5 className="card-title mb-0 fw-semibold">Student Demographics Distribution</h5>
                    </div>
                    <div className="card-body">
                      <ReactECharts
                        option={chartOptions}
                        style={{ height: '400px', width: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Teacher Demographics Distribution table */}
                <div className="col-12 col-xl-6">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-transparent py-3">
                      <h5 className="card-title mb-0 fw-semibold">Teacher Demographics Distribution</h5>
                    </div>
                    <div className="card-body">
                      <ReactECharts
                        option={teacherDemographicOptions}
                        style={{ height: '400px', width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
                

                {/* Teacher Assignments */}
                <div className="col-12 col-xl-6">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-transparent py-3">
                      <h3 className="card-title mb-0 fw-semibold">Teacher Assignments</h3>
                    </div>
                    <div className="card-body pt-0">
                      <div style={{ height: '300px' }}>
                        <ChartJSBar 
                          data={teacherAssignData} 
                          options={{ ...teacherAssignOptions, plugins: { legend: { display: false }}}}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coupon Redemptions */}
                <div className="col-12 col-xl-4">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-transparent py-3">
                      <h3 className="card-title mb-0 fw-semibold">Coupon Redemptions</h3>
                    </div>
                    <div className="card-body pt-0">
                      <div style={{ height: '300px' }}>
                        <ChartJSPie 
                          data={pieChartData} 
                          options={pieChartOptions}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* User Types */}
                <div className="col-12 col-xl-4">
                  <div className="card">
                    <div className="card-body">
                      <ReactECharts option={userTypeChartOptions} style={{ height: '400px', width: '100%' }} />
                    </div>
                  </div>
                  
                </div>

                {/* School Distribution */}
                <div className="col-12 col-xl-8">
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-transparent py-3">
                      <h3 className="card-title mb-0 fw-semibold">School Distribution (Top 5 States)</h3>
                    </div>
                    <div className="card-body pt-0">
                      <div style={{ height: '300px' }}>
                        <ChartJSBar 
                          data={schoolStateData}
                          options={schoolChartOptions}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="footer bg-white border-top py-3 mt-auto">
          <div className="container-xl">
            <div className="d-flex justify-content-between align-items-center text-muted">
              <span>© 2025 LifeAppDashboard. All rights reserved.</span>
              <div className="d-flex gap-3">
                <a href="#" className="text-muted text-decoration-none">Privacy</a>
                <a href="#" className="text-muted text-decoration-none">Terms</a>
                <a href="#" className="text-muted text-decoration-none">Help</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

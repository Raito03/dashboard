'use client'
import { useState, useEffect } from 'react'
import {
  AreaChart,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  TooltipProps,
  Area,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx'
import {
  Home,
  Settings,
  Search,
  HelpCircle,
  Bell,
  MessageSquare,
  User,
  Sliders,
} from 'lucide-react'

// Define the type for your API data
interface SignupData {
  month: string | null // allow null in case the API returns null values
  count: number
}

export default function UserAnalyticsDashboard() {
  const [mounted, setMounted] = useState(false)
  
  // State for SQL-fetched user signup data (line chart)
  const [chartData, setChartData] = useState<SignupData[]>([])

  // State for the selected year (for filtering)
  const [selectedYear, setSelectedYear] = useState<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch data from the Flask API
  useEffect(() => {
    async function fetchData() {
      try {
        // Update the URL if needed; ensure your Flask server is running
        const res = await fetch('http://127.0.0.1:5000/api/user-signups')
        const data = (await res.json()) as SignupData[]
        setChartData(data)

        // Extract available years from data, filtering out invalid month values
        const availableYears: string[] = Array.from(
          new Set(
            data
              .filter((item) => item.month) // Only items with valid month
              .map((item) => (item.month ? item.month.split('-')[0] : ''))
              .filter((year) => year !== '')
          )
        )

        // Set default year if available
        if (availableYears.length > 0) {
          setSelectedYear(availableYears[0])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  // Filter chartData by selected year; only consider items with a valid month value
  const filteredData = selectedYear
    ? chartData.filter(
        (item) => item.month && item.month.startsWith(selectedYear)
      )
    : chartData

  // Compute unique years for the dropdown from items with valid month
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


  // Add this state variable with your existing state declarations
  const [totalUsers, setTotalUsers] = useState<number>(0);
  // Add this useEffect block with your existing useEffect hooks
  useEffect(() => {
    async function fetchUserCount() {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/user-count');
        const data = await res.json();
        if (data && data.length > 0) {
          setTotalUsers(data[0].count);
        }
      } catch (error) {
        console.error('Error fetching user count:', error);
      }
    }
    fetchUserCount();
  }, [])

  // Add this state variable with your existing state declarations
  const [activeUsers, setActiveUsers] = useState<number>(0);
  // Add this useEffect block with your existing useEffect hooks
  useEffect(() => {
    async function fetchActiveUserCount() {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/active-user-count');
        const data = await res.json();
        // Add a check to ensure data exists and has a valid count
        if (data && data.length > 0 && data[0].active_users !== undefined) {
          setActiveUsers(data[0].active_users);
        } else {
          setActiveUsers(0);
        }
      } catch (error) {
        console.error('Error fetching user count:', error);
        setActiveUsers(0);
      }
    }
    fetchActiveUserCount();
  }, [])
  
  // Static data for other charts (unchanged)
  const [userData] = useState([
    { month: 'Jan', activeUsers: 4000, newUsers: 1200 },
    { month: 'Feb', activeUsers: 3000, newUsers: 900 },
    { month: 'Mar', activeUsers: 2000, newUsers: 800 },
    { month: 'Apr', activeUsers: 2780, newUsers: 1000 },
    { month: 'May', activeUsers: 1890, newUsers: 700 },
    { month: 'Jun', activeUsers: 2390, newUsers: 1100 },
    { month: 'Jul', activeUsers: 3490, newUsers: 1300 },
  ])

  const [userRetentionData] = useState([
    { name: 'Retained', value: 75 },
    { name: 'Churned', value: 25 },
  ])

  const COLORS = ['#6b7280', '#374151'] // Greyish colors

  const [featureUsageData] = useState([
    { feature: 'Search', usage: 4000 },
    { feature: 'Profile', usage: 3000 },
    { feature: 'Settings', usage: 2000 },
    { feature: 'Notifications', usage: 2780 },
  ])
  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-gray-800 text-white border border-gray-600 rounded-md shadow-md">
          <p className="text-sm text-gray-300">{`Month: ${label}`}</p>
          <p className="text-sm text-gray-100 font-semibold">{`Count: ${payload[0].value}`}</p>
        </div>
      )
    }
    return null
  }
  

  return (
    <div className="min-h-screen bg-[#101014]">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-16 bg-gray-900 shadow-lg flex flex-col items-center py-4 border-r border-gray-800">
        <Home className="mb-6 text-gray-500 hover:text-gray-300 cursor-pointer" />
        <Settings className="mb-6 text-gray-500 hover:text-gray-300 cursor-pointer" />
        <Search className="mb-6 text-gray-500 hover:text-gray-300 cursor-pointer" />
        <HelpCircle className="mb-6 text-gray-500 hover:text-gray-300 cursor-pointer" />
      </div>

      {/* Main Content */}
      <div className="ml-16 p-8">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-gray-800 rounded-full w-10 h-10"></div>
            <Bell className="text-gray-500 hover:text-gray-300 cursor-pointer" />
            <MessageSquare className="text-gray-500 hover:text-gray-300 cursor-pointer" />
            <Sliders className="text-gray-500 hover:text-gray-300 cursor-pointer" />
          </div>
          <div className="flex items-center space-x-4">
            <User className="text-gray-500" />
            <span className="text-gray-300">Admin</span>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome Admin!</h1>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { title: 'Total Users', value: totalUsers.toLocaleString() },
            { title: 'Active Users', value: activeUsers.toString() },
            { title: 'New Signups', value: '1,230' },
            { title: 'Retention Rate', value: '75%' },
          ].map((metric, index) => (
            <Card key={index} className=" border border-[#8046FC]">
              <CardHeader>
                <CardTitle className="text-gray-400">{metric.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        {mounted && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Line Chart for SQL Fetched Data with Year Dropdown */}
              <Card className="bg-gray-900 border border-[#8046FC]">
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="text-gray-400">
                    User Signups (Month-Year)
                  </CardTitle>
                  <select
                    className="bg-gray-800 text-gray-300 border border-gray-700 rounded p-1"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </CardHeader>
                <CardContent>
                  <AreaChart width={500} height={300} data={filteredData}>
                    <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="25%" stopColor="#6549b9" stopOpacity={0.5}/>
                      <stop offset="100%" stopColor="#6549b9" stopOpacity={0.1}/>
                    </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#d1d5db" />
                    <YAxis stroke="#d1d5db" />
                    <CartesianGrid strokeDasharray="3 3" className = "opacity-15" fillOpacity={0.1} />
                    {/* <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        color: '#f9fafb',
                        borderRadius: '8px', // Rounded corners
                      }}
                    /> */}
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="#6549b9" fill='url(#colorUv)' strokeWidth={2.5}/>
                  </AreaChart>
                </CardContent>
              </Card> 

              {/* Bar Chart (using static data) */}
              <Card className="bg-gray-900 border border-[#8046FC]">
                <CardHeader>
                  <CardTitle className="text-gray-400">
                    New User Signups (Static Data)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart width={500} height={300} data={userData}>
                    <XAxis dataKey="month" stroke="#d1d5db" />
                    <YAxis stroke="#d1d5db" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                      }}
                    />
                    <Bar dataKey="newUsers" fill="#6b7280" />
                  </BarChart>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section: User Retention & Feature Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="bg-gray-900 border border-[#8046FC]">
                <CardHeader>
                  <CardTitle className="text-gray-400">User Retention</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <PieChart width={300} height={300}>
                    <Pie
                      data={userRetentionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {userRetentionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                      }}
                    />
                  </PieChart>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-gray-900 border border-[#8046FC]">
                <CardHeader>
                  <CardTitle className="text-gray-400">Feature Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart width={700} height={300} data={featureUsageData}>
                    <XAxis dataKey="feature" stroke="#d1d5db" />
                    <YAxis stroke="#d1d5db" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                      }}
                    />
                    <Bar dataKey="usage" fill="#6b7280" />
                  </BarChart>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

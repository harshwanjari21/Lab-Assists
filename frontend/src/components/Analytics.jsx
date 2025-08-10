import React, { useState, useEffect } from 'react';
import { patientService, testService, reportService } from '../services/api';

function formatDateDMY(dateString) {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

const AGE_GROUPS = [
  { label: '0-17 years', min: 0, max: 17 },
  { label: '18-29 years', min: 18, max: 29 },
  { label: '30-44 years', min: 30, max: 44 },
  { label: '45-59 years', min: 45, max: 59 },
  { label: '60+ years', min: 60, max: 200 },
];

const parseRange = (range) => {
  // Handles ranges like '3.5–5.5', '70–110', '<1.1', 'M: 13–16; F: 11.5–14.5', etc.
  if (!range) return [null, null];
  if (range.includes('–')) {
    const [min, max] = range.split('–').map(s => parseFloat(s.replace(/[^0-9.\-]/g, '')));
    return [min, max];
  }
  if (range.startsWith('<')) {
    return [null, parseFloat(range.replace(/[^0-9.\-]/g, ''))];
  }
  if (range.startsWith('>')) {
    return [parseFloat(range.replace(/[^0-9.\-]/g, '')), null];
  }
  return [null, null];
};

const getLast6Months = () => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
      year: d.getFullYear(),
      month: d.getMonth(),
      count: 0,
    });
  }
  return months;
};

const Analytics = () => {
  const [summary, setSummary] = useState({
    totalPatients: 0,
    thisMonthPatients: 0,
    totalTests: 0,
    todayTests: 0,
    thisWeekTests: 0,
    abnormalResults: 0,
    reportsGenerated: 0,
    genderCounts: { male: 0, female: 0, other: 0 },
    ageGroups: [],
    testCategories: {},
    normalResults: 0,
    reportCompletionRate: 0,
    monthlyTrends: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Demographics');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let patients = [];
    let tests = [];
    let abnormalResults = 0;
    let normalResults = 0;
    let genderCounts = { male: 0, female: 0, other: 0 };
    let ageGroups = AGE_GROUPS.map(g => ({ ...g, count: 0 }));
    let testCategories = {};
    let monthlyTrends = getLast6Months();
    let recentActivity = [];
    let reportsCount = 0;
    let thisMonthPatients = 0;
    let todayTests = 0;
    let thisWeekTests = 0;

    try {
      // Fetch patients
      const patientsRes = await patientService.getAll();
      if (patientsRes.success) {
        patients = patientsRes.data;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Process patient data
        patients.forEach(p => {
          // Fix gender comparison to be case-insensitive
          const gender = p.gender.toLowerCase();
          if (gender === 'male') genderCounts.male++;
          else if (gender === 'female') genderCounts.female++;
          else genderCounts.other++;

          const age = parseInt(p.age, 10);
          for (let g of ageGroups) {
            if (age >= g.min && age <= g.max) {
              g.count++;
              break;
            }
          }

          // Count this month's patients
          const patientDate = new Date(p.createdAt);
          if (patientDate >= firstDayOfMonth) {
            thisMonthPatients++;
          }

          // Add patient registration to recent activity
          if (p.createdAt) {
            recentActivity.push({
              type: 'patient',
              title: 'New Patient Registration',
              description: `${p.fullName} registered as a new patient`,
              time: formatDateDMY(p.createdAt), // for display
              rawDate: p.createdAt, // for sorting
              icon: <span className="material-icons text-blue-500">person_add</span>
            });
          }
        });
      }

      // Fetch tests
      const testsRes = await testService.getAll();
      if (testsRes.success) {
        tests = testsRes.data;
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);

        // Process test data
        tests.forEach(test => {
          // Test category counts
          if (test.category) {
            testCategories[test.category] = (testCategories[test.category] || 0) + 1;
          }

          // Monthly trends and today/this week counts
          if (test.test_date) {
            const testDate = new Date(test.test_date);
            
            // Count today's tests
            if (testDate.toDateString() === startOfDay.toDateString()) {
              todayTests++;
            }
            
            // Count this week's tests
            if (testDate >= startOfWeek) {
              thisWeekTests++;
            }

            // Monthly trends
            for (let m of monthlyTrends) {
              if (testDate.getFullYear() === m.year && testDate.getMonth() === m.month) {
                m.count++;
                break;
              }
            }

            // Add test completion to recent activity
            const patient = patients.find(p => p.id === test.patient_id);
            recentActivity.push({
              type: 'test',
              title: 'Test Completed',
              description: `${test.test_name} results are ready for ${patient ? patient.fullName : 'Unknown'}`,
              time: formatDateDMY(test.test_date), // for display
              rawDate: test.test_date, // for sorting
              icon: <span className="material-icons text-green-500">science</span>
            });
          }

          // Test results analysis
          if (test.value && test.normalRange) {
            const value = parseFloat(test.value);
            const range = test.normalRange.replace('–', '-').replace(/ /g, '');
            const match = range.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
            
            if (match) {
              const low = parseFloat(match[1]);
              const high = parseFloat(match[2]);
              if (!isNaN(value)) {
                if (value < low || value > high) {
                  abnormalResults++;
                } else {
                  normalResults++;
                }
              }
            }
          }
        });
      }

      // Fetch reports count
      const reportsRes = await reportService.getCount();
      if (reportsRes.success) {
        reportsCount = reportsRes.data.count;
      }

      // Fetch recent reports for activity
      const recentReportsRes = await reportService.getRecent();
      if (recentReportsRes.success) {
        const recentReports = recentReportsRes.data;
        recentReports.forEach(report => {
          recentActivity.push({
            type: 'report',
            title: 'Report Generated',
            description: `Report generated for ${report.patientName}`,
            time: formatDateDMY(report.generatedAt), // for display
            rawDate: report.generatedAt, // for sorting
            icon: <span className="material-icons text-indigo-500">description</span>
          });
        });
      }

      // Sort activities by rawDate and take the most recent 10
      recentActivity.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
      recentActivity = recentActivity.slice(0, 10);

      setSummary({
        totalPatients: patients.length,
        thisMonthPatients,
        totalTests: tests.length,
        todayTests,
        thisWeekTests,
        abnormalResults,
        reportsGenerated: reportsCount,
        genderCounts,
        ageGroups,
        testCategories,
        normalResults,
        reportCompletionRate: tests.length > 0 ? Math.round((reportsCount / tests.length) * 100) : 0,
        monthlyTrends,
        recentActivity
      });

    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Update fetchData when component mounts and every 30 seconds
  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const summaryCards = [
    {
      title: 'Total Patients',
      value: summary.totalPatients,
      subtitle: `+${summary.thisMonthPatients} this month`,
      icon: <span className="material-icons text-blue-600">people</span>,
    },
    {
      title: 'Tests Conducted',
      value: summary.totalTests,
      subtitle: `${summary.todayTests} today, ${summary.thisWeekTests} this week`,
      icon: <span className="material-icons text-green-600">science</span>,
    },
    {
      title: 'Abnormal Results',
      value: summary.abnormalResults,
      subtitle: 'Abnormal test results',
      icon: <span className="material-icons text-red-600">warning</span>,
    },
    {
      title: 'Reports Generated',
      value: summary.reportsGenerated,
      subtitle: 'Reports printed/downloaded',
      icon: <span className="material-icons text-purple-600">description</span>,
    },
  ];

  return (
    <div className="p-8 ml-64">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics & Patient Statistics</h1>
      <p className="text-gray-600 mb-6">Comprehensive insights into laboratory operations and patient data</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryCards.map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">{card.title}</h3>
              {card.icon}
            </div>
            <div className="text-3xl font-bold text-gray-800">{card.value}</div>
            <p className="text-sm text-gray-600 mt-1">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded mb-6">
        {['Demographics', 'Test Analytics', 'Trends', 'Recent Activity'].map(tab => (
          <button
            key={tab}
            className={`flex-1 px-4 py-2 font-semibold rounded ${activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      {activeTab === 'Demographics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gender Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-1 flex items-center">
              <span className="material-icons mr-2 text-blue-600">wc</span>
              Gender Distribution
            </h2>
            <p className="text-gray-600 mb-4 text-sm">Patient demographics by gender</p>
            <div className="mb-2 flex items-center">
              <span className="material-icons text-blue-500 mr-2">male</span>
              Male
              <div className="flex-1 mx-2 bg-gray-100 rounded h-2">
                <div className="bg-blue-500 h-2 rounded" style={{width: `${summary.genderCounts.male / (summary.totalPatients || 1) * 100}%`}}></div>
              </div>
              <span className="w-8 text-right">{summary.genderCounts.male}</span>
              <span className="ml-2 text-xs text-gray-500">{summary.totalPatients ? Math.round(summary.genderCounts.male / summary.totalPatients * 100) : 0}%</span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="material-icons text-pink-500 mr-2">female</span>
              Female
              <div className="flex-1 mx-2 bg-gray-100 rounded h-2">
                <div className="bg-pink-500 h-2 rounded" style={{width: `${summary.genderCounts.female / (summary.totalPatients || 1) * 100}%`}}></div>
              </div>
              <span className="w-8 text-right">{summary.genderCounts.female}</span>
              <span className="ml-2 text-xs text-gray-500">{summary.totalPatients ? Math.round(summary.genderCounts.female / summary.totalPatients * 100) : 0}%</span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="material-icons text-gray-500 mr-2">person</span>
              Other
              <div className="flex-1 mx-2 bg-gray-100 rounded h-2">
                <div className="bg-gray-500 h-2 rounded" style={{width: `${summary.genderCounts.other / (summary.totalPatients || 1) * 100}%`}}></div>
              </div>
              <span className="w-8 text-right">{summary.genderCounts.other}</span>
              <span className="ml-2 text-xs text-gray-500">{summary.totalPatients ? Math.round(summary.genderCounts.other / summary.totalPatients * 100) : 0}%</span>
            </div>
          </div>
          {/* Age Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-1 flex items-center">
              <span className="material-icons mr-2 text-blue-600">timeline</span>
              Age Distribution
            </h2>
            <p className="text-gray-600 mb-4 text-sm">Patient demographics by age groups</p>
            {summary.ageGroups.map((g, idx) => (
              <div key={g.label} className="mb-2 flex items-center">
                <span className="w-28">{g.label}</span>
                <div className="flex-1 mx-2 bg-gray-100 rounded h-2">
                  <div className="bg-blue-500 h-2 rounded" style={{width: `${summary.totalPatients ? (g.count / summary.totalPatients * 100) : 0}%`}}></div>
                </div>
                <span className="w-8 text-right">{g.count}</span>
                <span className="ml-2 text-xs text-gray-500">{summary.totalPatients ? Math.round(g.count / summary.totalPatients * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'Test Analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Categories */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-1 flex items-center">
              <span className="material-icons mr-2 text-blue-600">category</span>
              Test Categories
            </h2>
            <p className="text-gray-600 mb-4 text-sm">Distribution of tests by category</p>
            {Object.keys(summary.testCategories).length === 0 && <div className="text-gray-400">No data</div>}
            {Object.entries(summary.testCategories).map(([cat, count]) => (
              <div key={cat} className="mb-2 flex items-center">
                <span className="w-32">{cat}</span>
                <div className="flex-1 mx-2 bg-gray-100 rounded h-2">
                  <div className="bg-blue-500 h-2 rounded" style={{width: `${summary.totalTests ? (count / summary.totalTests * 100) : 0}%`}}></div>
                </div>
                <span className="w-8 text-right">{count}</span>
                <span className="ml-2 text-xs text-gray-500">{summary.totalTests ? Math.round(count / summary.totalTests * 100) : 0}%</span>
              </div>
            ))}
          </div>
          {/* Test Performance */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-1 flex items-center">
              <span className="material-icons mr-2 text-blue-600">analytics</span>
              Test Performance
            </h2>
            <p className="text-gray-600 mb-4 text-sm">Quality metrics and performance indicators</p>
            <div className="mb-2 flex items-center">
              <span className="material-icons text-green-500 mr-2">check_circle</span>
              <span className="w-32">Normal Results</span>
              <div className="flex-1 mx-2 bg-gray-100 rounded h-2">
                <div className="bg-green-200 h-2 rounded" style={{width: `${summary.normalResults + summary.abnormalResults ? (summary.normalResults / (summary.normalResults + summary.abnormalResults) * 100) : 0}%`}}></div>
              </div>
              <span className="w-8 text-right text-green-700">{summary.normalResults}</span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="material-icons text-red-500 mr-2">warning</span>
              <span className="w-32">Abnormal Results</span>
              <div className="flex-1 mx-2 bg-gray-100 rounded h-2">
                <div className="bg-red-500 h-2 rounded" style={{width: `${summary.normalResults + summary.abnormalResults ? (summary.abnormalResults / (summary.normalResults + summary.abnormalResults) * 100) : 0}%`}}></div>
              </div>
              <span className="w-8 text-right text-red-700">{summary.abnormalResults}</span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="material-icons text-blue-500 mr-2">assignment_turned_in</span>
              <span className="w-32">Report Completion Rate</span>
              <div className="flex-1 mx-2 bg-gray-100 rounded h-2">
                <div className="bg-blue-300 h-2 rounded" style={{width: `${summary.reportCompletionRate > 100 ? 100 : summary.reportCompletionRate}%`}}></div>
              </div>
              <span className="w-12 text-right text-blue-700">{summary.reportCompletionRate}%</span>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'Trends' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-1 flex items-center">
            <span className="material-icons mr-2 text-blue-600">trending_up</span>
            Monthly Test Trends
          </h2>
          <p className="text-gray-600 mb-4 text-sm">Test volume over the last 6 months</p>
          {summary.monthlyTrends.map((m, idx) => (
            <div key={m.label} className="mb-2 flex items-center">
              <span className="material-icons text-gray-500 mr-2">calendar_today</span>
              <span className="w-24">{m.label}</span>
              <div className="flex-1 mx-2 bg-gray-100 rounded h-2">
                <div className="bg-blue-500 h-2 rounded" style={{width: `${summary.totalTests ? (m.count / Math.max(...summary.monthlyTrends.map(mt => mt.count), 1) * 100) : 0}%`}}></div>
              </div>
              <span className="w-12 text-right">{m.count} tests</span>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'Recent Activity' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {summary.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                  <span className={`material-icons ${
                    activity.type === 'patient' ? 'text-blue-500' :
                    activity.type === 'test' ? 'text-green-500' :
                    'text-indigo-500'
                  }`}>
                    {activity.type === 'patient' ? 'person_add' :
                      activity.type === 'test' ? 'science' :
                      'description'}
                </span>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  </div>
              </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

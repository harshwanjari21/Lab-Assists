import React, { useState, useEffect } from 'react';
import { patientService, testService, reportService } from '../services/api';

function formatDateDMY(dateString) {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalPatients: 0,
        totalTests: 0,
        reportsGenerated: 0,
        testsToday: 0
    });

    const [recentActivity, setRecentActivity] = useState([]);
    const [error, setError] = useState(null);

    const quickActions = [
        {
            title: 'Add Patient',
            description: 'Register new patient',
            icon: <span className="material-icons text-blue-600">person_add</span>,
            link: '/patients'
        },
        {
            title: 'Add Test',
            description: 'Add test results',
            icon: <span className="material-icons text-green-600">science</span>,
            link: '/tests'
        },
        {
            title: 'Generate Report',
            description: 'Create patient report',
            icon: <span className="material-icons text-indigo-600">description</span>,
            link: '/reports'
        },
        {
            title: 'View Analytics',
            description: 'Patient statistics',
            icon: <span className="material-icons text-purple-600">analytics</span>,
            link: '/analytics'
        }
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setError(null);
                // Fetch patients, tests, report count, and recent reports
                const [patientsRes, testsRes, reportsCountRes, recentReportsRes] = await Promise.all([
                    patientService.getAll(),
                    testService.getAll(),
                    reportService.getCount(),
                    reportService.getRecent()
                ]);

                if (!patientsRes.success || !testsRes.success || !reportsCountRes.success || !recentReportsRes.success) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const patients = patientsRes.data;
                const tests = testsRes.data;
                const reportsCount = reportsCountRes.data;
                const recentReports = recentReportsRes.data;

                // Calculate tests done today
                const today = new Date().toLocaleDateString();
                const testsToday = Array.isArray(tests) ? tests.filter(test =>
                    new Date(test.test_date).toLocaleDateString() === today
                ).length : 0;

                setStats({
                    totalPatients: Array.isArray(patients) ? patients.length : 0,
                    totalTests: Array.isArray(tests) ? tests.length : 0,
                    reportsGenerated: reportsCount?.count || 0,
                    testsToday
                });

                // Build recent activity (patients, tests, reports)
                let activities = [];

                // Patient registrations
                if (Array.isArray(patients)) {
                    patients.forEach(p => {
                        if (p.createdAt) {
                            activities.push({
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

                // Test completions
                if (Array.isArray(tests)) {
                    tests.forEach(test => {
                        if (test.test_date) {
                            const patient = Array.isArray(patients)
                                ? patients.find(p => String(p.id) === String(test.patient_id))
                                : null;
                            activities.push({
                                type: 'test',
                                title: 'Test Completed',
                                description: `${test.test_name} results are ready for ${patient ? patient.fullName : 'Unknown'}`,
                                time: formatDateDMY(test.test_date),
                                rawDate: test.test_date,
                                icon: <span className="material-icons text-green-500">science</span>
                            });
                        }
                    });
                }

                // Recent reports
                if (Array.isArray(recentReports)) {
                    recentReports.forEach(report => {
                        activities.push({
                            type: 'report',
                            title: 'Report Generated',
                            description: `Report generated for ${report.patientName}`,
                            time: formatDateDMY(report.generatedAt),
                            rawDate: report.generatedAt,
                            icon: <span className="material-icons text-indigo-500">description</span>
                        });
                    });
                }

                // Sort by rawDate (most recent first)
                activities.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

                // Only keep the most recent 5
                setRecentActivity(activities.slice(0, 5));

            } catch (error) {
                setError('Failed to load dashboard data');
            }
        };

        fetchStats();
        const intervalId = setInterval(fetchStats, 30000); // Refresh every 30 seconds
        return () => clearInterval(intervalId);
    }, []);

    const statsCards = [
        {
            title: 'Total Patients',
            value: stats.totalPatients,
            icon: <span className="material-icons text-blue-600">people</span>,
            description: 'Registered patients'
        },
        {
            title: 'Total Tests',
            value: stats.totalTests,
            icon: <span className="material-icons text-green-600">science</span>,
            description: 'Tests conducted'
        },
        {
            title: 'Reports Generated',
            value: stats.reportsGenerated,
            icon: <span className="material-icons text-indigo-600">description</span>,
            description: 'Reports generated'
        },
        {
            title: 'Tests Today',
            value: stats.testsToday,
            icon: <span className="material-icons text-orange-600">event_available</span>,
            description: 'Tests done today'
        }
    ];

    return (
        <div className="p-8 ml-64">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome to LabAssist</p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsCards.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-600 font-medium">{stat.title}</h3>
                            {stat.icon}
                        </div>
                        <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
                        <p className="text-sm text-gray-600 mt-1">{stat.description}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quickActions.map((action, index) => (
                        <a
                            key={index}
                            href={action.link}
                            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-4">
                                {action.icon}
                                <div>
                                    <h3 className="font-semibold text-gray-800">{action.title}</h3>
                                    <p className="text-sm text-gray-600">{action.description}</p>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                                {activity.icon}
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
        </div>
    );
};

export default Dashboard;

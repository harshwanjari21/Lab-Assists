import React, { useState, useEffect } from 'react';
import { patientService, testService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AddTestResults = ({ onTestAdded }) => {
  const [tests, setTests] = useState([
    { category: '', subcategory: '', testName: '', value: '', normalRange: '', unit: '' },
  ]);
  const [patientId, setPatientId] = useState('');
  const [testDate, setTestDate] = useState(''); // Initialize as empty string, will fetch from backend
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [availableTests, setAvailableTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoadingPatients(true);
      setLoadingTests(true);
      try {
        // Fetch current date from backend
        const dateRes = await testService.getCurrentDate();
        if (dateRes.success) {
          setTestDate(dateRes.data.date);
        } else {
          // console.error('Failed to fetch current date:', dateRes.error);
          // Fallback to local date if backend fails
          setTestDate(new Date().toISOString().split('T')[0]);
        }

        // Fetch patients
        const patientsRes = await patientService.getAll();
        if (patientsRes.success) {
          setPatients(patientsRes.data);
          // Check for pre-selected patient
          const selectedPatient = localStorage.getItem('selectedPatient');
          if (selectedPatient) {
            const patient = JSON.parse(selectedPatient);
            setPatientId(patient.id);
            // Clear the stored patient
            localStorage.removeItem('selectedPatient');
          }
        } else {
          setError('Failed to load patients');
        }

        // Fetch tests
        const testsRes = await testService.getCategories();
        if (testsRes.success) {
          setAvailableTests(testsRes.data);
        } else {
          // console.error('Failed to fetch tests:', testsRes.error);
          setError('Failed to load test data. Please try again later.');
        }
      } catch (e) {
        // console.error('Error fetching data:', e);
        setError('Failed to connect to server. Please check your connection.');
        setPatients([]);
        setAvailableTests([]);
      } finally {
        setLoadingPatients(false);
        setLoadingTests(false);
      }
    };
    fetchData();
  }, []);

  const handleTestChange = (index, field, value) => {
    const newTests = [...tests];
    newTests[index] = { ...newTests[index], [field]: value };

    // If category or subcategory changes, reset test name
    if (field === 'category' || field === 'subcategory') {
      newTests[index].testName = '';
    }

    // If test name changes, update normal range and unit
    if (field === 'testName') {
      const selectedTest = findTest(newTests[index].category, newTests[index].subcategory, value);
      if (selectedTest) {
        newTests[index].normalRange = selectedTest.referenceRange || '';
        newTests[index].unit = selectedTest.unit || '';
      }
    }

    setTests(newTests);
  };

  const findTest = (category, subcategory, testName) => {
    const categoryData = availableTests.find(cat => cat.category === category);
    if (!categoryData) return null;

    const subcategoryData = categoryData.subcategories.find(sub => sub.subcategory === subcategory);
    if (!subcategoryData) return null;

    return subcategoryData.tests.find(test => test.name === testName);
  };

  const addTest = () => {
    setTests([...tests, { category: '', subcategory: '', testName: '', value: '', normalRange: '', unit: '' }]);
  };

  const removeTest = (index) => {
    setTests(tests.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const testResults = tests.map(test => ({
        testName: test.testName,
        value: test.value,
        normalRange: test.normalRange,
        unit: test.unit
      }));

      const response = await testService.addResults({
        patientId,
        category: tests[0].category,
        subcategory: tests[0].subcategory,
        tests: testResults,
        testDate,
        notes
      });

      if (response.success) {
        setMessage('Test results added successfully!');
        setTests([{ category: '', subcategory: '', testName: '', value: '', normalRange: '', unit: '' }]);
        setPatientId('');
        setTestDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        if (onTestAdded) onTestAdded();
      } else {
        setError(response.error || 'Failed to add test results');
      }
    } catch (e) {
      setError('Failed to add test results');
    }
  };

  const handleSaveAndGenerateReport = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Check if any test values are entered
    const hasTestValues = tests.some(test => test.value.trim() !== '');
    if (!hasTestValues) {
      // If no test values, just redirect to reports
      const selectedPatient = patients.find(p => p.id === patientId);
      if (selectedPatient) {
        localStorage.setItem('selectedPatient', JSON.stringify(selectedPatient));
      }
      navigate('/reports');
      return;
    }

    try {
      const testResults = tests.map(test => ({
        testName: test.testName,
        value: test.value,
        normalRange: test.normalRange,
        unit: test.unit
      }));

      const response = await testService.addResults({
        patientId,
        category: tests[0].category,
        subcategory: tests[0].subcategory,
        tests: testResults,
        testDate,
        notes
      });

      if (response.success) {
        setMessage('Test results added successfully!');
        // Store the selected patient in localStorage for Reports page
        const selectedPatient = patients.find(p => p.id === patientId);
        if (selectedPatient) {
          localStorage.setItem('selectedPatient', JSON.stringify(selectedPatient));
        }
        // Navigate to reports page
        navigate('/reports');
      } else {
        setError(response.error || 'Failed to add test results');
      }
    } catch (e) {
      setError('Failed to add test results');
    }
  };

  const handleClearForm = () => {
    // Clear all selections and user-entered values
    const clearedTests = tests.map(() => ({
      category: '',
      subcategory: '',
      testName: '',
      value: '',
      normalRange: '',
      unit: ''
    }));
    setTests(clearedTests);
    setNotes(''); // Clear notes
    setPatientId(''); // Clear patient selection
    setTestDate(new Date().toISOString().split('T')[0]); // Reset to current date
  };

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchQuery.toLowerCase();
    return patient.fullName.toLowerCase().includes(searchLower) || 
           patient.patientCode.toLowerCase().includes(searchLower);
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.patient-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-2">Add Test Results</h2>
      <p className="text-gray-600 mb-6">Enter laboratory test results for a patient</p>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Patient *</label>
          <div className="patient-dropdown relative">
            <div 
              className="w-full border rounded px-3 py-2 flex items-center justify-between cursor-pointer bg-white"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {patientId ? 
                  patients.find(p => p.id === patientId)?.fullName || 'Select a patient' : 
                  'Select a patient'
                }
              </span>
              <span className="material-icons text-gray-400">
                {isDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            </div>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="p-2">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Search patient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-auto">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map(patient => (
                      <div
                        key={patient.id}
                        onClick={() => {
                          setPatientId(patient.id);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="font-medium">{patient.fullName}</div>
                        <div className="text-sm text-gray-500">Code: {patient.patientCode}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">No patients found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">Test Date *</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={testDate}
            onChange={e => setTestDate(e.target.value)}
            required
          />
        </div>

        <div className="md:col-span-2">
          <div className="bg-gray-50 border rounded p-4 mt-4">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            {tests.map((test, idx) => (
              <div key={`test-row-${idx}`} className="grid grid-cols-1 md:grid-cols-9 gap-4 items-end mb-4">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-1">Category *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={test.category}
                    onChange={e => handleTestChange(idx, 'category', e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    {availableTests.map(cat => (
                      <option key={`category-${cat.category}`} value={cat.category}>{cat.category}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-1">Subcategory *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={test.subcategory}
                    onChange={e => handleTestChange(idx, 'subcategory', e.target.value)}
                    required
                    disabled={!test.category}
                  >
                    <option value="">Select subcategory</option>
                    {test.category && availableTests
                      .find(cat => cat.category === test.category)
                      ?.subcategories.map(sub => (
                        <option key={`subcategory-${sub.subcategory}`} value={sub.subcategory}>
                          {sub.subcategory}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold mb-1">Test Name *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={test.testName}
                    onChange={e => handleTestChange(idx, 'testName', e.target.value)}
                    required
                    disabled={!test.subcategory}
                  >
                    <option value="">Select test name</option>
                    {test.subcategory && availableTests
                      .find(cat => cat.category === test.category)
                      ?.subcategories.find(sub => sub.subcategory === test.subcategory)
                      ?.tests.map(t => (
                        <option key={`test-${t.id}`} value={t.name}>{t.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Value *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={test.value}
                    onChange={e => handleTestChange(idx, 'value', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Normal Range</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-50"
                    value={test.normalRange}
                    readOnly
                  />
                </div>
                <div className="w-20">
                  <label className="block text-gray-700 font-semibold mb-1">Unit</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-50"
                    value={test.unit}
                    readOnly
                  />
                </div>
                {idx > 0 && (
                  <div className="md:col-span-9 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeTest(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove Test
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTest}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              + Add Another Test
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-700 font-semibold mb-1">Notes</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows="3"
          />
        </div>

        {error && <div className="md:col-span-2 text-red-600">{error}</div>}
        {message && <div className="md:col-span-2 text-green-600">{message}</div>}

        <div className="md:col-span-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Add Test Results
          </button>
          <button
            type="button"
            onClick={handleSaveAndGenerateReport}
            className="ml-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Save and Generate Report
          </button>
          <button
            type="button"
            onClick={handleClearForm}
            className="ml-4 bg-gray-100 text-gray-700 px-6 py-2 rounded hover:bg-gray-200"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};

const TestHistory = ({ refreshFlag }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch patients first
        const patientsRes = await patientService.getAll();
        if (!patientsRes.success) {
          throw new Error('Failed to fetch patients');
        }
        const patientsMap = {};
        patientsRes.data.forEach(p => {
          patientsMap[p.id] = p;
        });
        setPatients(patientsMap);

        // Then fetch tests
        const testsRes = await testService.getAll();
        if (!testsRes.success) {
          throw new Error('Failed to fetch tests');
        }
        // console.log('Fetched tests:', testsRes.data); // Debug log
        setTests(testsRes.data || []);
      } catch (err) {
        // console.error('Error fetching data:', err);
        setError('Failed to load test history');
        setTests([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [refreshFlag]);

  // Group tests by patientId
  const grouped = {};
  tests.forEach(test => {
    if (!grouped[test.patient_id]) grouped[test.patient_id] = [];
    grouped[test.patient_id].push(test);
  });

  // Filter patients by search
  const filteredPatientIds = Object.keys(grouped).filter(pid => {
    const patient = patients[pid];
    if (!patient) return false;
    return patient.fullName.toLowerCase().includes(search.toLowerCase());
  });

  const getPatientName = (id) => {
    const patient = patients[id];
    return patient ? `${patient.fullName} (${patient.patientCode})` : 'Unknown Patient';
  };

  const handleDelete = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test result?')) return;
    try {
      const res = await testService.deleteResult(testId);
      if (res.success) {
        setTests(prev => prev.filter(t => t.id !== testId));
      } else {
        setError('Failed to delete test result');
      }
    } catch (err) {
      setError('Failed to connect to backend');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!tests || tests.length === 0) return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center">
      <span className="text-5xl text-gray-300 mb-4">🧪</span>
      <div className="text-xl font-semibold text-gray-500 mb-2">No test results found.</div>
      <div className="text-gray-400">Add test results to see them here.</div>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-2">Test History</h2>
      <input
        type="text"
        className="mb-4 px-3 py-2 border rounded w-full max-w-md"
        placeholder="Search patient by name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {filteredPatientIds.length === 0 ? (
        <div className="text-gray-500">No patients found.</div>
      ) : (
        filteredPatientIds.map((pid, idx) => (
          <div key={pid} className="mb-10">
            <div className="font-bold text-lg mb-2">{idx + 1}. {getPatientName(pid)}</div>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm mb-2 rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-blue-50 text-gray-700">
                    <th className="px-4 py-2 border">Category</th>
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Test Name</th>
                    <th className="px-4 py-2 border">Value</th>
                    <th className="px-4 py-2 border">Normal Range</th>
                    <th className="px-4 py-2 border">Unit</th>
                    <th className="px-4 py-2 border">Notes</th>
                    <th className="px-4 py-2 border text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[pid].sort((a, b) => new Date(b.test_date) - new Date(a.test_date)).map((test, tIdx) => (
                    <tr key={test.id} className={tIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 border align-top">{test.test_category}</td>
                      <td className="px-4 py-2 border align-top whitespace-nowrap">
                        {(() => {
                          const d = new Date(test.test_date);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })()}
                      </td>
                      <td className="px-4 py-2 border align-top">{test.test_name || '-'}</td>
                      <td className="px-4 py-2 border align-top">{test.test_value || '-'}</td>
                      <td className="px-4 py-2 border align-top">{test.normal_range || '-'}</td>
                      <td className="px-4 py-2 border align-top">{test.unit || '-'}</td>
                      <td className="px-4 py-2 border align-top">{test.additional_note || '-'}</td>
                      <td className="px-4 py-2 border align-top text-center">
                        <button
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-100 focus:outline-none"
                          onClick={() => handleDelete(test.id)}
                          title="Delete test result"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const Test = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [refreshFlag, setRefreshFlag] = useState(0);
  const handleTestAdded = () => setRefreshFlag(f => f + 1);

  return (
    <div className="p-8 ml-64">
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded font-semibold ${activeTab === 'add' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('add')}
        >
          Add Test Results
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('history')}
        >
          Test History
        </button>
      </div>
      {activeTab === 'add' ? <AddTestResults onTestAdded={handleTestAdded} /> : <TestHistory refreshFlag={refreshFlag} />}
    </div>
  );
};

export default Test;

import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { patientService, labService, reportService } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import companyLogo from '../assets/company.png';
import spidy_sign from '../assets/spidy_sign.png';

const today = new Date().toISOString().split('T')[0];

const Reports = () => {
    const [labInfo, setLabInfo] = useState(null);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [report, setReport] = useState(null);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const reportRef = useRef();

    useEffect(() => {
        fetchLabInfo();
        fetchPatients();
    }, []);

    useEffect(() => {
        const selectedPatient = localStorage.getItem('selectedPatient');
        if (selectedPatient) {
            const patient = JSON.parse(selectedPatient);
            setSelectedPatient(patient);
            localStorage.removeItem('selectedPatient');
            generateReport();
        }
        // eslint-disable-next-line
    }, [patients]);

    // Inject custom CSS for PDF/print
    const injectCustomStyles = (container) => {
        const style = document.createElement('style');
        style.textContent = `
            [data-report] {
                background: #eaf2fb !important;
                color: #222222 !important;
                width: 800px !important;
                font-family: Arial, sans-serif !important;
                margin: 0 auto !important;
                padding: 24px !important;
                box-shadow: 0 0 10px rgba(0,0,0,0.1) !important;
                border-radius: 8px !important;
                border: none !important;
                position: relative !important;
            }
            .grid {
                background: white !important;
                border-radius: 10px !important;
                padding: 16px !important;
                margin-bottom: 24px !important;
                gap: 24px !important;
            }
            .interpretation-section {
                background: #fffde7 !important;
                border-left: 4px solid #ffe066 !important;
                border-radius: 6px !important;
                padding: 16px !important;
                margin-bottom: 24px !important;
            }
            .interpretation-section h4 {
                font-weight: bold !important;
                color: #222 !important;
                margin-bottom: 8px !important;
                font-size: 20px !important;
            }
            .interpretation-section ul {
                margin: 0 !important;
                padding-left: 20px !important;
                font-size: 15px !important;
                color: #444 !important;
            }
            .grid > div {
                background: transparent !important;
                border: none !important;
                border-radius: 8px !important;
                padding: 16px !important;
                box-shadow: none !important;
                margin-bottom: 0px !important;
            }
            h2 {
                text-align: center !important;
                display: block !important;
                margin: 0 auto !important;
                font-weight: bold !important;
                font-size: 22px !important;
                color: #222 !important;
            }
            /* Add more rules as needed */
        `;
        container.prepend(style);
    };

    const fetchLabInfo = async () => {
        try {
            const response = await labService.getInfo();
            if (response.success) {
                setLabInfo(response.data);
            } else {
                setError('Failed to fetch lab information');
            }
        } catch (e) {
            setError('Failed to fetch lab information');
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await patientService.getAll();
            if (response.success) {
                setPatients(response.data);
                setError(null);
            } else {
                throw new Error('Failed to fetch patients');
            }
        } catch (err) {
            setError('Failed to load patients');
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(patient => {
        const searchLower = searchQuery.toLowerCase();
        return patient.fullName.toLowerCase().includes(searchLower) ||
            patient.patientCode.toLowerCase().includes(searchLower);
    });

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setSearchQuery(patient.fullName);
        setShowDropdown(false);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setShowDropdown(true);
        if (!e.target.value) {
            setSelectedPatient(null);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.search-container')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Only one generateReport function, using startDate and endDate
    const generateReport = async () => {
        if (!selectedPatient) {
            setError('Please select a patient first');
            return;
        }
        try {
            setLoading(true);
            let response;
            if (startDate && endDate) {
                response = await reportService.generate(selectedPatient.id, startDate, endDate);
            } else {
                response = await reportService.generate(selectedPatient.id);
            }
            if (response.success) {
                setReport(response.data);
                setError(null);
                // Optionally print for debugging
                // if (response.data && response.data.tests) {
                //     // console.log("Fetched tests from backend:");
                //     response.data.tests.forEach(test => {
                //         // console.log(`Test: ${test.testName}, Date: ${test.testDate}`);
                //     });
                // }
            } else {
                throw new Error('Failed to generate report');
            }
        } catch (err) {
            setError('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const generateShareableLink = (patientCode) => {
        const port = window.location.port;
        return `http://${window.location.hostname}:${port}/view-report/${patientCode}`;
    };

    const shareViaWhatsApp = () => {
        const patientCode = selectedPatient.patientCode;
        const link = generateShareableLink(patientCode);
        const whatsappMessage = `Check out this report: ${link}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappUrl, '_blank');
    };

    const getAgeSex = (age, gender) => `${age} Years / ${gender}`;
    const now = new Date();
    const reportDate = now.toLocaleDateString();
    const reportTime = now.toLocaleTimeString();

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;

        // Wait for all images inside reportRef to load
        const images = reportRef.current.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = img.onerror = resolve;
            });
        }));

        try {
            // Clone the report node
            const clone = reportRef.current.cloneNode(true);

            // Remove Tailwind color classes if needed
            const colorClassRegex = /^(bg|text|border|from|to|via|ring|fill|stroke|placeholder|accent|outline|shadow|divide|decoration|selection)-/;
            const removeColorClasses = (el) => {
                if (el.classList && el.classList.length) {
                    Array.from(el.classList).forEach(cls => {
                        if (colorClassRegex.test(cls)) {
                            el.classList.remove(cls);
                        }
                    });
                }
                Array.from(el.children).forEach(removeColorClasses);
            };
            removeColorClasses(clone);

            // Inject custom styles
            injectCustomStyles(clone);

            // Force blue background on clone
            clone.style.background = '#eaf2fb';
            clone.style.backgroundColor = '#eaf2fb';

            // Temporarily add to DOM for html2canvas
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            document.body.appendChild(clone);

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#eaf2fb',
                windowWidth: 800,
            });

            document.body.removeChild(clone);

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save('lab_report.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handlePrint = () => {
    if (!reportRef.current) return;

    const printContents = reportRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=900,width=800');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Report</title>
          <style>
            body { 
              margin: 0;
              padding: 0;
              background: #eaf2fb !important;
              color: #222 !important;
              font-family: Arial, sans-serif !important;
            }
            [data-report] {
              background: #eaf2fb !important;
              color: #222222 !important;
              width: 800px !important;
              font-family: Arial, sans-serif !important;
              margin: 0 auto !important;
              padding: 24px !important;
              box-shadow: 0 0 10px rgba(0,0,0,0.1) !important;
              border-radius: 8px !important;
              border: none !important;
              position: relative !important;
            }
            .grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 24px !important;
  background: white !important;
  border-radius: 10px !important;
  padding: 16px !important;
  margin-bottom: 24px !important;
}
            .interpretation-section {
              background: #fffde7 !important;
              border-left: 4px solid #ffe066 !important;
              border-radius: 6px !important;
              padding: 16px !important;
              margin-bottom: 24px !important;
            }
            .interpretation-section h4 {
              font-weight: bold !important;
              color: #222 !important;
              margin-bottom: 8px !important;
              font-size: 20px !important;
            }
            .interpretation-section ul {
              margin: 0 !important;
              padding-left: 20px !important;
              font-size: 15px !important;
              color: #444 !important;
            }
            .grid > div {
              background: transparent !important;
              border: none !important;
              border-radius: 8px !important;
              padding: 16px !important;
              box-shadow: none !important;
              margin-bottom: 0px !important;
            }
            h2 {
              text-align: center !important;
              display: block !important;
              margin: 0 auto !important;
              font-weight: bold !important;
              font-size: 22px !important;
              color: #222 !important;
            }
            /* Add more rules as needed for tables, headings, etc. */
            @media print {
              body { margin: 0; }
              [data-report] { box-shadow: none !important; }
            }
              .flex { display: flex !important; }
.justify-between { justify-content: space-between !important; }
.items-start { align-items: flex-start !important; }
.grid { display: grid !important; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
.gap-6 { gap: 1.5rem !important; }
@media (max-width: 768px) {
  .grid-cols-2 { grid-template-columns: 1fr !important; }
}
          </style>
        </head>
        <body>
          <div data-report>
            ${printContents}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
};



    const groupTestsByCategory = (tests) => {
        const grouped = {};
        tests.forEach(test => {
            if (!grouped[test.testCategory]) {
                grouped[test.testCategory] = {};
            }
            if (!grouped[test.testCategory][test.testSubcategory]) {
                grouped[test.testCategory][test.testSubcategory] = [];
            }
            grouped[test.testCategory][test.testSubcategory].push(test);
        });
        return grouped;
    };

    const getStatus = (test) => {
        const value = test.testValue;
        const ref = String(test.normalRange || '').trim();
        if (/negative|positive/i.test(ref)) {
            if (String(value).toLowerCase() === 'negative') return 'Negative';
            if (String(value).toLowerCase() === 'positive') return 'Positive';
            return String(value);
        }
        const range = ref.replace('–', '-').replace(/ /g, '');
        const match = range.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
        if (match) {
            const low = parseFloat(match[1]);
            const high = parseFloat(match[2]);
            const num = parseFloat(value);
            if (!isNaN(num)) {
                if (num < low) return 'Low';
                if (num > high) return 'High';
                return 'Normal';
            }
        }
        if (range.startsWith('<')) {
            const high = parseFloat(range.slice(1));
            const num = parseFloat(value);
            if (!isNaN(num)) {
                if (num >= high) return 'High';
                return 'Normal';
            }
        }
        if (range.startsWith('>')) {
            const low = parseFloat(range.slice(1));
            const num = parseFloat(value);
            if (!isNaN(num)) {
                if (num <= low) return 'Low';
                return 'Normal';
            }
        }
        return 'Normal';
    };

    return (
        <div className="p-8 ml-64">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
                <p className="text-gray-600 mt-2">Generate and view patient reports</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Generate Report</h2>
                <div className="space-y-4">
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-1">Search Patient</label>
                        <div className="patient-dropdown relative">
                            <div
                                className="w-full border rounded px-3 py-2 flex items-center justify-between cursor-pointer bg-white"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span>
                                    {selectedPatient ?
                                        patients.find(p => p.id === selectedPatient.id)?.fullName || 'Select a patient' :
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
                                                        handlePatientSelect(patient);
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
                    {selectedPatient && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Patient Name</p>
                                    <p className="font-medium">{selectedPatient.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Patient Code</p>
                                    <p className="font-medium">{selectedPatient.patientCode}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Age</p>
                                    <p className="font-medium">{selectedPatient.age}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Gender</p>
                                    <p className="font-medium">{selectedPatient.gender}</p>
                                </div>
                            </div>
                            {/* Date range filter */}
                            <div className="flex gap-4 mt-4">
                              <div>
                                <label className="block text-gray-700 font-semibold mb-1">Start Date</label>
                                <input
                                  type="date"
                                  className="px-3 py-2 border rounded"
                                  value={startDate}
                                  onChange={e => setStartDate(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-gray-700 font-semibold mb-1">End Date</label>
                                <input
                                  type="date"
                                  className="px-3 py-2 border rounded"
                                  value={endDate}
                                  onChange={e => setEndDate(e.target.value)}
                                />
                              </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={generateReport}
                            disabled={!selectedPatient || loading}
                            className={`px-4 py-2 rounded-md text-white flex items-center ${!selectedPatient || loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <span className="material-icons animate-spin mr-2">refresh</span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons mr-2">description</span>
                                    Generate Report
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {/* Report Display Section */}
            {report && labInfo && (
                <div className="rounded-lg shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto" style={{ background: '#eaf2fb' }}>
                    <div className="flex justify-end mb-4 gap-2">
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Print Report
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Download Report
                        </button>
                        <button
                            onClick={shareViaWhatsApp}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            Share via WhatsApp
                        </button>
                    </div>
                    <div
                        ref={reportRef}
                        data-report
                        style={{
                            background: '#eaf2fb',
                            color: '#222222',
                            width: '800px',
                            fontFamily: 'Arial, sans-serif',
                            margin: '0 auto',
                            padding: '24px',
                            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                            borderRadius: '8px',
                            position: 'relative'
                        }}
                    >
                        {/* Header with logo */}
                        <div className="flex justify-between items-start mb-2 ">
                            <div>
                                <h1 className="text-2xl font-bold text-blue-900 uppercase">{labInfo.name}</h1>
                                <p className="text-gray-700 text-sm font-medium">{labInfo.slogan}</p>
                                <div className="mt-2 text-gray-600 text-sm">
                                    <div className="flex items-center gap-2"><span className="material-icons text-base">location_on</span>{labInfo.address}</div>
                                    <div className="flex items-center gap-2"><span className="material-icons text-base">call</span>{labInfo.phone}</div>
                                    <div className="flex items-center gap-2"><span className="material-icons text-base">email</span>{labInfo.email}</div>
                                </div>
                            </div>
                            <img src={companyLogo} alt="Logo" style={{ height: 140, marginLeft: 32, borderRadius: 8, marginTop: -15 }} />
                        </div>
                        <hr className="my-4 border-blue-200" />
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 tracking-wide">LABORATORY INVESTIGATION REPORT</h2>
                        </div>
                        <hr className="mb-6 border-blue-200" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-gray-50 rounded p-4 border border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-2 text-sm">PATIENT INFORMATION</h3>
                                <div className="text-sm">
                                    <div className="mb-1"><span className="font-medium">Name:</span> {report.patientName}</div>
                                    <div className="mb-1"><span className="font-medium">Age/Sex:</span> {getAgeSex(report.patientAge, report.patientGender)}</div>
                                    <div className="mb-1"><span className="font-medium">Patient ID:</span> {report.patientCode}</div>
                                    <div className="mb-1"><span className="font-medium">Contact:</span> {report.contactNumber}</div>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded p-4 border border-gray-200">
                                <h3 className="font-semibold text-gray-700 mb-2 text-sm">REPORT DETAILS</h3>
                                <div className="text-sm">
                                    <div className="mb-1"><span className="font-medium">Report Date:</span> {reportDate}</div>
                                    <div className="mb-1"><span className="font-medium">Report Time:</span> {reportTime}</div>
                                    <div className="mb-1"><span className="font-medium">REF. BY:</span> {report.refBy || '-'}</div>
                                </div>
                            </div>
                        </div>
                        {/* Grouped test tables */}
                        {Object.entries(groupTestsByCategory(report.tests)).map(([category, subcategories]) => (
                            <div key={category} style={{ marginBottom: 32 }}>
                                <div style={{ background: '#eaf2fb', padding: 8, fontWeight: 'bold', fontSize: 16, marginBottom: 0, borderLeft: '4px solid #1976d2' }}>{category.toUpperCase()}</div>
                                {Object.entries(subcategories).map(([subcategory, tests]) => (
                                    <div key={subcategory} style={{ marginBottom: 16 }}>
                                        <div style={{ background: '#f5f5f5', padding: 6, fontWeight: 'bold', fontSize: 14, marginBottom: 0, borderLeft: '4px solid #90caf9' }}>{subcategory}</div>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                                            <thead>
                                                <tr style={{ background: '#f7f7f7' }}>
                                                    <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left', width: '30%' }}>TEST NAME</th>
                                                    <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left', width: '20%' }}>RESULT</th>
                                                    <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left', width: '10%' }}>UNIT</th>
                                                    <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left', width: '25%' }}>REFERENCE RANGE</th>
                                                    <th style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left', width: '15%' }}>STATUS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tests.map((test, idx) => {
                                                    const status = getStatus(test);
                                                    let color = '#388e3c';
                                                    if (status === 'Low' || status === 'High' || status === 'Positive') color = '#d32f2f';
                                                    if (status === 'Negative' || status === 'Normal') color = '#388e3c';
                                                    let arrow = '';
                                                    if (status === 'Low') arrow = '↓';
                                                    if (status === 'High') arrow = '↑';
                                                    return (
                                                        <tr key={test.id || idx}>
                                                            <td style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>{test.testName}</td>
                                                            <td style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left', color }}>{test.testValue} {arrow}</td>
                                                            <td style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>{test.unit}</td>
                                                            <td style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left' }}>{test.normalRange}</td>
                                                            <td style={{ border: '1px solid #ccc', padding: 8, textAlign: 'left', color, fontWeight: 'bold' }}>{status}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 interpretation-section">
                            <h4 className="font-bold text-gray-800 mb-2">CLINICAL INTERPRETATION</h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700">
                                <li>Values marked with ↑ (High) or ↓ (Low) are outside the reference range</li>
                                <li>Reference ranges may vary based on age, gender, and laboratory methodology</li>
                                <li>Please correlate with clinical findings and consult your physician for interpretation</li>
                            </ul>
                        </div>

                        {/* QR & Signature Section */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                alignItems: 'flex-end',
                                marginTop: 32,
                                background: '#eaf2fb',
                                minHeight: 140,
                                gap: 8,
                            }}
                        >
                            {/* QR code and label */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: 32 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Scan to view online:</div>
                                <QRCodeSVG value={generateShareableLink(selectedPatient.patientCode)} size={120} />
                            </div>
                            {/* Signature and doctor info */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: 32 }}>
                                <img src={spidy_sign} alt="Signature" style={{ height: 40, margin: '0 0 4px 0' }} />
                                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>DR. Spiderman<br /><span style={{ fontWeight: 400 }}>MD, (MBBS)</span></div>
                                <div style={{ fontSize: 12, color: '#888', marginRight: -18 }}>CONSULTANT PATHOLOGIST</div>
                            </div>
                        </div>

                        {/* Lab Director & Computer Generated Report Section */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                alignItems: 'center',
                                marginTop: 24,
                                background: '#eaf2fb',
                                fontSize: 13,
                                color: '#555',
                                minHeight: 40,
                                gap: 8,
                            }}
                        >
                            <div style={{ textAlign: 'left', fontWeight: 700, fontSize: 14 }}>
                                Lab Director: Md Batman
                            </div>
                            <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 400 }}>
                                This is a computer generated report<br />
                                Report generated on: {reportDate}, {reportTime}
                            </div>
                        </div>
                        <div className="bg-gray-100 text-xs text-gray-700 p-4 rounded mt-6">
                            <span className="font-bold block mb-1">IMPORTANT MEDICAL DISCLAIMER:</span>
                            This report contains confidential medical information. The results should be interpreted by a qualified healthcare professional in conjunction with clinical history and other diagnostic tests. Normal values may vary between laboratories due to differences in equipment, reagents, and methodologies. For any queries regarding this report, please contact our laboratory at the above mentioned contact details.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
import React, { useState, useEffect } from 'react';
import { patientService, doctorService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AddEditPatient = ({ onPatientAdded, onCancel, editPatient }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    contactNumber: '',
    email: '',
    address: '',
    refBy: '',
    patientCode: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refDoctors, setRefDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (editPatient) {
      setFormData({
        fullName: editPatient.fullName || '',
        age: editPatient.age || '',
        gender: editPatient.gender || '',
        contactNumber: editPatient.contactNumber || '',
        email: editPatient.email || '',
        address: editPatient.address || '',
        refBy: editPatient.refBy || '',
        patientCode: editPatient.patientCode || ''
      });
    } else {
      fetchLatestPatientCode();
    }
    fetchRefDoctors();
  }, [editPatient]);

  const fetchLatestPatientCode = async () => {
    try {
      const response = await patientService.getLatestCode();
      if (response.success) {
        setFormData(prev => ({ ...prev, patientCode: response.data.code || '' }));
      } else {
        setError('Failed to fetch latest patient code');
        setFormData(prev => ({ ...prev, patientCode: '' }));
      }
    } catch (e) {
      // console.error('Failed to fetch latest patient code:', e);
      setError('Failed to fetch latest patient code');
      setFormData(prev => ({ ...prev, patientCode: '' }));
    }
  };

  const fetchRefDoctors = async () => {
    try {
      const response = await doctorService.getAll();
      if (response.success) {
        setRefDoctors(response.data);
      } else {
        // console.error('Failed to fetch reference doctors:', e);
        setError('Failed to fetch reference doctors');
      }
    } catch (e) {
      // console.error('Failed to fetch reference doctors:', e);
      setError('Failed to fetch reference doctors');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for contact number
    if (name === 'contactNumber') {
      // Only allow numbers
      const numbersOnly = value.replace(/[^0-9]/g, '');
      // Limit to 10 digits
      const limitedValue = numbersOnly.slice(0, 10);
      setFormData({ ...formData, [name]: limitedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate contact number
    if (formData.contactNumber.length !== 10) {
      setError('Contact number must be exactly 10 digits');
      return;
    }

    try {
      const response = editPatient 
        ? await patientService.update(editPatient.id, formData)
        : await patientService.create(formData);

      if (response.success) {
        setSuccess(editPatient ? 'Patient updated successfully!' : 'Patient added successfully!');
        if (onPatientAdded) onPatientAdded();
        if (!editPatient) {
          // Fetch new patient code after successful addition
          fetchLatestPatientCode();
          setFormData({
            fullName: '',
            age: '',
            gender: '',
            contactNumber: '',
            email: '',
            address: '',
            refBy: '',
            patientCode: ''
          });
        }
      } else {
        setError(response.error || 'Failed to save patient');
      }
    } catch (err) {
      // console.error('Failed to connect to server');
      setError('Failed to connect to server');
    }
  };

  const handleClearForm = () => {
    setFormData({
      fullName: '',
      age: '',
      gender: '',
      contactNumber: '',
      email: '',
      address: '',
      refBy: '',
      patientCode: formData.patientCode || ''
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">{editPatient ? 'Edit Patient' : 'Add New Patient'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              min="0"
              max="150"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
          </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              pattern="[0-9]{10}"
              title="Please enter exactly 10 digits"
              placeholder="Enter 10 digit number"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referred By</label>
            <select
              name="refBy"
              value={formData.refBy}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Doctor</option>
              {refDoctors.map(doctor => (
                <option key={doctor.id} value={doctor.name}>
                  {doctor.name}{doctor.specialization ? ` (${doctor.specialization})` : ''}
                </option>
              ))}
              <option value="Self">Self</option>
            </select>
        </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient Code</label>
            <input
              type="text"
              name="patientCode"
              value={formData.patientCode}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
        </div>
        </div>

          {error && <div className="text-red-600 font-semibold">{error}</div>}
        {success && <div className="text-green-600 font-semibold">{success}</div>}

        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {editPatient ? 'Update Patient' : 'Add Patient'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleClearForm}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};

const PatientList = ({ refreshFlag }) => {
  const [patients, setPatients] = useState([]);
  const [editingPatient, setEditingPatient] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [refreshFlag]);

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      if (response.success) {
        setPatients(response.data);
      } else {
        // console.error('Failed to fetch patients:', response.error);
        setError('Failed to fetch patients');
      }
    } catch (err) {
      // console.error('Error fetching patients:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Filter patients by search
  const filteredPatients = patients.filter(patient => 
    patient.fullName.toLowerCase().includes(search.toLowerCase()) ||
    patient.patientCode.toLowerCase().includes(search.toLowerCase()) ||
    patient.contactNumber.includes(search)
  );

  const handleEdit = (p) => {
    setEditingPatient(p.id);
    setEditFormData({
      fullName: p.fullName,
      age: p.age,
      gender: p.gender,
      contactNumber: p.contactNumber,
      email: p.email,
      address: p.address,
      refBy: p.refBy,
      patientCode: p.patientCode
    });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    try {
      setError(''); // Clear any previous errors
      const response = await patientService.update(editingPatient, editFormData);
      if (response.success) {
        setSuccess('Patient updated successfully!');
        setEditingPatient(null);
        fetchPatients();
      } else {
        setError(response.error || 'Failed to update patient');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        setError(''); // Clear any previous errors
        const response = await patientService.delete(id);
        if (response.success) {
          setSuccess('Patient deleted successfully!');
          fetchPatients();
        } else {
          setError(response.error || 'Failed to delete patient');
        }
      } catch (err) {
        setError('Failed to connect to server');
      }
    }
  };

  const handleQuickAddTest = (patient) => {
    // Store the selected patient in localStorage
    localStorage.setItem('selectedPatient', JSON.stringify(patient));
    // Navigate to tests page
    navigate('/tests');
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Patient List</h2>
      <input
        type="text"
        className="mb-4 px-3 py-2 border rounded w-full max-w-md"
        placeholder="Search by name, patient code, or contact number..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Patient Code</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Age</th>
              <th className="px-4 py-2 border">Gender</th>
              <th className="px-4 py-2 border">Contact</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">REF. BY</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p) => (
              <tr key={p.id} className="even:bg-gray-50">
                {editingPatient === p.id ? (
                  <>
                    <td className="px-4 py-2 border">{p.patientCode}</td>
                    <td className="px-4 py-2 border"><input className="border rounded px-2 py-1 w-24" name="fullName" value={editFormData.fullName} onChange={handleEditChange} /></td>
                    <td className="px-4 py-2 border"><input className="border rounded px-2 py-1 w-12" name="age" value={editFormData.age} onChange={handleEditChange} type="number" /></td>
                    <td className="px-4 py-2 border">
                      <select name="gender" value={editFormData.gender} onChange={handleEditChange} className="border rounded px-2 py-1">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 border"><input className="border rounded px-2 py-1 w-24" name="contactNumber" value={editFormData.contactNumber} onChange={handleEditChange} /></td>
                    <td className="px-4 py-2 border"><input className="border rounded px-2 py-1 w-32" name="email" value={editFormData.email} onChange={handleEditChange} /></td>
                    <td className="px-4 py-2 border"><input className="border rounded px-2 py-1 w-20" name="refBy" value={editFormData.refBy} onChange={handleEditChange} /></td>
                    <td className="px-4 py-2 border flex gap-2 items-center">
                      <button className="bg-green-500 text-white px-2 py-1 rounded" onClick={handleEditSave} title="Save"><span>✔️</span></button>
                      <button className="bg-gray-300 text-gray-700 px-2 py-1 rounded" onClick={() => setEditingPatient(null)} title="Cancel"><span>✖️</span></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 border">{p.patientCode}</td>
                    <td className="px-4 py-2 border font-bold">{p.fullName}</td>
                    <td className="px-4 py-2 border">{p.age}</td>
                    <td className="px-4 py-2 border">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.gender === 'Female' ? 'bg-pink-100 text-pink-700' : p.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>{p.gender}</span>
                    </td>
                    <td className="px-4 py-2 border">{p.contactNumber}</td>
                    <td className="px-4 py-2 border">{p.email}</td>
                    <td className="px-4 py-2 border"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{p.refBy}</span></td>
                    <td className="px-4 py-2 border flex gap-2 items-center">
                      <button
                        onClick={() => handleQuickAddTest(p)}
                        className="bg-white border px-2 py-1 rounded text-blue-600" 
                        title="Quick Add Test"
                      >
                        <span role="img" aria-label="add test">➕</span>
                      </button>
                      <button className="bg-white border px-2 py-1 rounded" onClick={() => handleEdit(p)} title="Edit"><span role="img" aria-label="edit">✏️</span></button>
                      <button className="bg-white border px-2 py-1 rounded text-red-600" onClick={() => handleDelete(p.id)} title="Delete"><span role="img" aria-label="delete">🗑️</span></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded">
          {success}
        </div>
      )}
    </div>
  );
};

const Patients = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [refreshFlag, setRefreshFlag] = useState(0);
  const handlePatientAdded = () => setRefreshFlag(f => f + 1);

  return (
    <div className="p-8 ml-64">
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded font-semibold ${activeTab === 'add' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('add')}
        >
          Add/Edit Patient
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setActiveTab('list')}
        >
          Patient List
        </button>
      </div>
      {activeTab === 'add' ? <AddEditPatient onPatientAdded={handlePatientAdded} /> : <PatientList refreshFlag={refreshFlag} />}
    </div>
  );
};

export default Patients;

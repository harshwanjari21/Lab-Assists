// Master test data for all categories
const testsData = [
  // Biochemistry Tests
  { category: 'Biochemistry Tests', name: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL', referenceRange: '70–110' },
  { category: 'Biochemistry Tests', name: 'Postprandial Blood Sugar (PPBS)', unit: 'mg/dL', referenceRange: '110–160' },
  { category: 'Biochemistry Tests', name: 'Random Blood Sugar (RBS)', unit: 'mg/dL', referenceRange: '70–140' },
  { category: 'Biochemistry Tests', name: 'HbA1c', unit: '%', referenceRange: '4.4–6.7' },
  { category: 'Biochemistry Tests', name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', referenceRange: '25–40' },
  { category: 'Biochemistry Tests', name: 'Serum Creatinine', unit: 'mg/dL', referenceRange: '0.6–1.5' },
  { category: 'Biochemistry Tests', name: 'Uric Acid', unit: 'mg/dL', referenceRange: 'M: 3.5–7.2; F: 2.6–6.0' },
  { category: 'Biochemistry Tests', name: 'Total Bilirubin', unit: 'mg/dL', referenceRange: '0–1.2' },
  { category: 'Biochemistry Tests', name: 'Direct Bilirubin', unit: 'mg/dL', referenceRange: '0–0.2' },
  { category: 'Biochemistry Tests', name: 'Indirect Bilirubin', unit: 'mg/dL', referenceRange: '0.1–1.1' },
  { category: 'Biochemistry Tests', name: 'SGOT (AST)', unit: 'U/L', referenceRange: '8–40' },
  { category: 'Biochemistry Tests', name: 'SGPT (ALT)', unit: 'U/L', referenceRange: '8–40' },
  { category: 'Biochemistry Tests', name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', referenceRange: '108–306' },
  { category: 'Biochemistry Tests', name: 'Gamma GT (GGT)', unit: 'U/L', referenceRange: 'Up to 60' },
  { category: 'Biochemistry Tests', name: 'Total Protein', unit: 'g/dL', referenceRange: '6–8' },
  { category: 'Biochemistry Tests', name: 'Albumin', unit: 'g/dL', referenceRange: '3.5–5.5' },
  { category: 'Biochemistry Tests', name: 'Globulin', unit: 'g/dL', referenceRange: '2.5–3.5' },
  { category: 'Biochemistry Tests', name: 'A/G Ratio', unit: 'Ratio', referenceRange: '1.2–2.2' },
  { category: 'Biochemistry Tests', name: 'Calcium (Total)', unit: 'mg/dL', referenceRange: '8.5–10.5' },
  { category: 'Biochemistry Tests', name: 'Phosphorus', unit: 'mg/dL', referenceRange: '2.5–5.0' },
  { category: 'Biochemistry Tests', name: 'Sodium', unit: 'mEq/L', referenceRange: '135–145' },
  { category: 'Biochemistry Tests', name: 'Potassium', unit: 'mEq/L', referenceRange: '3.6–5.0' },
  { category: 'Biochemistry Tests', name: 'Chloride', unit: 'mEq/L', referenceRange: '98–119' },
  { category: 'Biochemistry Tests', name: 'Lipid Profile', unit: 'mg/dL', referenceRange: 'Varies per component' },
  { category: 'Biochemistry Tests', name: 'Amylase', unit: 'U/L', referenceRange: 'Up to 85' },
  { category: 'Biochemistry Tests', name: 'Lipase', unit: 'U/L', referenceRange: 'Up to 200' },

  // Hematology Tests
  { category: 'Hematology Tests', name: 'Hemoglobin (Hb)', unit: 'g/dL', referenceRange: 'M: 13–16; F: 11.5–14.5' },
  { category: 'Hematology Tests', name: 'Total Leukocyte Count (TLC)', unit: 'x10³/µL', referenceRange: '4–11' },
  { category: 'Hematology Tests', name: 'Red Blood Cell Count (RBC)', unit: 'x10⁶/µL', referenceRange: 'M: 4.5–6.0; F: 4.0–4.5' },
  { category: 'Hematology Tests', name: 'Packed Cell Volume (PCV)', unit: '%', referenceRange: 'M: 42–52; F: 36–48' },
  { category: 'Hematology Tests', name: 'Mean Corpuscular Volume (MCV)', unit: 'fL', referenceRange: '82–92' },
  { category: 'Hematology Tests', name: 'Mean Corpuscular Hemoglobin (MCH)', unit: 'pg', referenceRange: '27–32' },
  { category: 'Hematology Tests', name: 'Mean Corpuscular Hemoglobin Concentration (MCHC)', unit: 'g/dL', referenceRange: '32–36' },
  { category: 'Hematology Tests', name: 'Differential Leukocyte Count (DLC)', unit: '%', referenceRange: 'Neutrophils: 40–75; Lymphocytes: 20–45; Monocytes: 2–8; Eosinophils: 1–4; Basophils: 0–1' },
  { category: 'Hematology Tests', name: 'Erythrocyte Sedimentation Rate (ESR)', unit: 'mm/hr', referenceRange: 'M: up to 15; F: up to 20' },
  { category: 'Hematology Tests', name: 'Reticulocyte Count', unit: '%', referenceRange: 'Adult: 0.5–2; Infant: 2–6' },
  { category: 'Hematology Tests', name: 'Bleeding Time', unit: 'minutes', referenceRange: '2–7' },
  { category: 'Hematology Tests', name: 'Clotting Time', unit: 'minutes', referenceRange: '4–9' },
  { category: 'Hematology Tests', name: 'Prothrombin Time (PT)', unit: 'seconds', referenceRange: '10–14' },
  { category: 'Hematology Tests', name: 'International Normalized Ratio (INR)', unit: 'Ratio', referenceRange: '<1.1' },
  { category: 'Hematology Tests', name: 'Activated Partial Thromboplastin Time (APTT)', unit: 'seconds', referenceRange: '30–40' },

  // Microbiology & Serology Tests
  { category: 'Microbiology & Serology Tests', name: 'Widal Test', unit: '–', referenceRange: 'Negative' },
  { category: 'Microbiology & Serology Tests', name: 'HIV Test', unit: '–', referenceRange: 'Negative' },
  { category: 'Microbiology & Serology Tests', name: 'HCV Test', unit: '–', referenceRange: 'Negative' },
  { category: 'Microbiology & Serology Tests', name: 'HBsAg Test', unit: '–', referenceRange: 'Negative' },
  { category: 'Microbiology & Serology Tests', name: 'Dengue NS1 Antigen', unit: '–', referenceRange: 'Negative' },
  { category: 'Microbiology & Serology Tests', name: 'Dengue IgG/IgM', unit: '–', referenceRange: 'Negative' },
  { category: 'Microbiology & Serology Tests', name: 'Malaria Parasite Test', unit: '–', referenceRange: 'Negative' },
  { category: 'Microbiology & Serology Tests', name: 'Mantoux Test', unit: 'mm induration', referenceRange: '<5 mm (negative)' },

  // Urine and Stool Tests
  { category: 'Urine and Stool Tests', name: 'Urine Routine Examination', unit: '–', referenceRange: 'Normal' },
  { category: 'Urine and Stool Tests', name: 'Urine Pregnancy Test', unit: '–', referenceRange: 'Negative' },
  { category: 'Urine and Stool Tests', name: 'Stool Routine Examination', unit: '–', referenceRange: 'Normal' },
];

export default testsData; 
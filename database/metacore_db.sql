-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 16, 2025 at 11:06 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `labassist_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `lab_info`
--

CREATE TABLE `lab_info` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `address` text NOT NULL,
  `phone` text NOT NULL,
  `email` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lab_info`
--

INSERT INTO `lab_info` (`id`, `name`, `address`, `phone`, `email`, `created_at`) VALUES
(1, 'LabAssist', 'Harpur road, Kaswa Kherhi, Shakund, Bhagalpur, Bihar, 813108', '1234567890', 'labassistbgp@gmail.com', '2025-06-10 02:55:40');

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `full_name` text NOT NULL,
  `age` int(11) NOT NULL,
  `gender` text NOT NULL,
  `contact_number` text NOT NULL,
  `email` text NOT NULL,
  `patient_code` text NOT NULL,
  `address` text NOT NULL,
  `ref_by` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `full_name`, `age`, `gender`, `contact_number`, `email`, `patient_code`, `address`, `ref_by`, `created_at`) VALUES
(1, 'harsh', 21, 'Male', '123456789', 'h@gmail.com', 'PAT000001', 'huss', 'Dr. Rahul', '2025-06-10 03:07:03'),
(9, 'Chintu Singh', 25, 'Male', '7655418557', '', 'PAT000008', 'Tamil Nadu', 'Dr. Geet', '2025-06-13 20:16:08');

-- --------------------------------------------------------

--
-- Table structure for table `ref_doctors`
--

CREATE TABLE `ref_doctors` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `specialization` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ref_doctors`
--

INSERT INTO `ref_doctors` (`id`, `name`, `specialization`, `created_at`) VALUES
(1, 'Dr. Geet', '', '2025-06-13 12:18:58'),
(2, 'Dr. Radhika', 'Cardio', '2025-06-13 12:19:06');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `patient_id`, `generated_at`) VALUES
(2, 1, '2025-06-10 04:26:55'),
(3, 1, '2025-06-10 04:31:27'),
(5, 1, '2025-06-10 04:33:59'),
(6, 1, '2025-06-10 04:35:46'),
(8, 1, '2025-06-10 04:38:44'),
(10, 9, '2025-06-13 21:17:24'),
(11, 9, '2025-06-13 21:19:11'),
(12, 9, '2025-06-13 21:21:57');

-- --------------------------------------------------------

--
-- Table structure for table `tests`
--

CREATE TABLE `tests` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `test_category` text NOT NULL,
  `test_subcategory` text NOT NULL,
  `test_name` text NOT NULL,
  `test_value` text NOT NULL,
  `normal_range` text DEFAULT NULL,
  `unit` text DEFAULT NULL,
  `test_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `additional_note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tests`
--

INSERT INTO `tests` (`id`, `patient_id`, `test_category`, `test_subcategory`, `test_name`, `test_value`, `normal_range`, `unit`, `test_date`, `additional_note`, `created_at`) VALUES
(1, 1, 'Profile', 'Biochemistry Profile', 'Lipid Profile', '2', '', '', '2025-06-12 18:30:00', 'all ok', '2025-06-13 11:51:02'),
(2, 1, 'Profile', 'Biochemistry Profile', 'Complete Blood Count (CBC)', '50', '', '', '2025-06-12 18:30:00', 'all ok', '2025-06-13 11:51:02'),
(9, 1, 'Profile', 'Haematology Profile', 'Complete Blood Count (CBC)', '21', '', '', '2025-06-12 18:30:00', '', '2025-06-13 13:02:53'),
(14, 9, 'Profile', 'Biochemistry Profile', 'HIV', 'positive', '', '', '2025-06-13 18:30:00', 'chintu is hiv positive', '2025-06-13 20:25:59'),
(15, 9, 'Profile', 'Thyroid Profile', 'Free Thyroid', '21', '', '', '2025-06-13 18:30:00', '', '2025-06-13 21:33:01'),
(16, 9, 'Profile', 'Haematology Profile', 'Complete Blood Count (CBC)', '25', '', '', '2025-06-13 18:30:00', '', '2025-06-13 22:20:46'),
(17, 1, 'Haematology', 'Haematology General', 'R B C Count', '50', '', '', '2025-06-13 18:30:00', '', '2025-06-14 10:30:04'),
(18, 1, 'Haematology', 'Haematology General', 'RH Typing', '12', '', '', '2025-06-13 18:30:00', '', '2025-06-14 10:30:04');

-- --------------------------------------------------------

--
-- Table structure for table `test_catalog`
--

CREATE TABLE `test_catalog` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `category` text NOT NULL,
  `subcategory` text NOT NULL,
  `price` float DEFAULT NULL,
  `reference_range` text DEFAULT NULL,
  `unit` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `test_catalog`
--

INSERT INTO `test_catalog` (`id`, `name`, `category`, `subcategory`, `price`, `reference_range`, `unit`, `created_at`) VALUES
(1, 'Complete Blood Count (CBC)', 'Profile', 'Haematology Profile', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(2, 'Lipid Profile', 'Profile', 'Biochemistry Profile', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(3, 'Extended Lipid Profile', 'Profile', 'Biochemistry Profile', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(4, 'Advanced Lipid Profile', 'Profile', 'Biochemistry Profile', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(5, 'Kidney Function Test (KFT)', 'Profile', 'Biochemistry Profile', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(6, 'Extended Kidney Function Test', 'Profile', 'Biochemistry Profile', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(7, 'Liver Function Test (LFT)', 'Profile', 'Biochemistry Profile', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(8, 'Cardiac Profile', 'Profile', 'Biochemistry Profile', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(9, 'Arthritis Profile', 'Profile', 'Biochemistry Profile', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(10, 'Iron Profile', 'Profile', 'Biochemistry Profile', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(11, 'Thyroid Profile', 'Profile', 'Thyroid Profile', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(12, 'Free Thyroid', 'Profile', 'Thyroid Profile', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(13, 'HIV', 'Profile', 'Viral Marker', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(14, 'HbSAg', 'Profile', 'Viral Marker', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(15, 'HCV', 'Profile', 'Viral Marker', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(16, 'VDRL', 'Profile', 'Viral Marker', NULL, NULL, NULL, '2025-06-13 11:34:51'),
(17, 'Haemoglobin(Hb)', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(18, 'Total Leucocyte count (TLC)', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(19, 'ESR(Westegren’s Method)', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(20, 'Erythtocyte SED. Rate(WIN)', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(21, 'R B C Count', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(22, 'Malaria Parasite(M.P)', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(23, 'Blood Group ABO', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(24, 'RH Typing', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(25, 'Total Eosinophil Count(TEC)', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(26, 'Platelet Count', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(27, 'Reticulocyte Count', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(28, 'Bleeding Time', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(29, 'Clotting Time', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(30, 'Peripheral SMEAR', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(31, 'P/S For Microfalaria', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(32, 'G6PD Quantitative', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(33, 'Serum Ferritin', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(34, 'RDW', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(35, 'PDW', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(36, 'Absolute Netrophil Count', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53'),
(37, 'G6PD Qualitative', 'Haematology', 'Haematology General', NULL, NULL, NULL, '2025-06-14 10:18:53');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `full_name` text DEFAULT NULL,
  `phone` text DEFAULT NULL,
  `role` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `full_name`, `phone`, `role`, `created_at`) VALUES
(1, 'admin@labassist.com', '$2b$12$ss3KZdKc4C8mTg7pVl7AT.V2A5eJD7q9kB1ktm8sdX.nvjrjRS1ia', 'Admin User', NULL, 'admin', '2025-06-13 10:22:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `lab_info`
--
ALTER TABLE `lab_info`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `patient_code` (`patient_code`) USING HASH;

--
-- Indexes for table `ref_doctors`
--
ALTER TABLE `ref_doctors`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reports_ibfk_1` (`patient_id`);

--
-- Indexes for table `tests`
--
ALTER TABLE `tests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tests_ibfk_1` (`patient_id`);

--
-- Indexes for table `test_catalog`
--
ALTER TABLE `test_catalog`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`) USING HASH;

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `lab_info`
--
ALTER TABLE `lab_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `ref_doctors`
--
ALTER TABLE `ref_doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tests`
--
ALTER TABLE `tests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `test_catalog`
--
ALTER TABLE `test_catalog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tests`
--
ALTER TABLE `tests`
  ADD CONSTRAINT `tests_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

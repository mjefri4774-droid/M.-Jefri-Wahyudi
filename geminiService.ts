
import { GoogleGenAI } from "@google/genai";
import { Student, AttendanceRecord, SchoolProfile } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to get consistent local date string YYYY-MM-DD
const getLocalDateString = (date: Date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

export const getAttendanceAnalysis = async (students: Student[], attendance: AttendanceRecord[], school?: SchoolProfile) => {
  const today = getLocalDateString();
  const todayAttendance = attendance.filter(a => a.timestamp.startsWith(today));
  
  const prompt = `
    Anda adalah asisten cerdas sistem manajemen sekolah ${school?.name || 'SMP'}. 
    Data Siswa: ${JSON.stringify(students.map(s => ({ name: s.name, class: s.class })))}
    Data Absensi Hari Ini (${today}): ${JSON.stringify(todayAttendance)}
    Kepala Sekolah: ${school?.principal || '-'}
    Tahun Ajaran: ${school?.academicYear || '-'}

    Tolong berikan ringkasan analisis singkat (maks 3 poin) mengenai kehadiran hari ini dan saran strategis untuk pihak sekolah.
    Gunakan bahasa Indonesia yang profesional dan ramah.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maaf, sistem analisis AI sedang mengalami kendala teknis. Silakan periksa koneksi internet Anda.";
  }
};

export const getPeriodicReportAnalysis = async (period: string, students: Student[], attendance: AttendanceRecord[]) => {
  const prompt = `
    Anda adalah analis data pendidikan. Analisis data absensi berikut untuk periode: ${period}.
    Total Siswa: ${students.length}
    Total Record Absensi dalam periode: ${attendance.length}
    Detail Records (Sampel): ${JSON.stringify(attendance.slice(0, 20))}

    Berikan 3 insight utama tentang tren kehadiran ${period} ini dan 1 rekomendasi strategis untuk meningkatkan disiplin siswa.
    Gunakan format poin-poin yang profesional namun mudah dimengerti.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Analisis AI saat ini tidak tersedia.";
  }
};

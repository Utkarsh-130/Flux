'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import { Search, Bell, Settings, Upload, FileText } from 'lucide-react';

interface ResumeAnalysis {
  filename: string;

  sections: {
    name: string;
    found: boolean;
    content?: string;
  }[];
  skills: {
    technical_skills: string[];
    languages: string[];
    tools: string[];
    frameworks: string[];
    databases: string[];
  };
  recommendations: string[];
}

export default function ResumeMatcherPage() {
  const { setParsedResumeSkills, setShowSettingsModal, setUploadedResumeName } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setTimeout(() => {
      const technicalSkills = ['Python', 'JavaScript', 'TypeScript', 'React', 'Java'];
      setParsedResumeSkills(technicalSkills);
      setUploadedResumeName(file.name);
      setAnalysis({
        filename: file.name,
        sections: [
          { name: 'Contact Information', found: true },
          { name: 'Professional Summary', found: true },
          { name: 'Work Experience', found: true, content: '5+ years in software development' },
          { name: 'Education', found: true },
          { name: 'Skills', found: true },
          { name: 'Certifications', found: false },
        ],
        skills: {
          technical_skills: technicalSkills,
          languages: ['English', 'Hindi'],
          tools: ['Git', 'Docker', 'AWS'],
          frameworks: ['Django', 'FastAPI', 'Express'],
          databases: ['PostgreSQL', 'MongoDB'],
        },
        recommendations: [
          'Add certifications section to improve ATS score',
          'Include more quantifiable achievements',
          'Add LinkedIn profile URL',
        ],
      });
      setIsLoading(false);
    }, 1500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start w-full">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a253c] tracking-tight">Resume Matcher</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Upload CV / Resume files for skill parsing</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 w-72 shadow-sm border border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
            />
          </div>
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-black transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-black transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center w-full">
        <div></div>
        <div className="bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold text-gray-500 shadow-sm">
          2 June, 2026
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50">
        {isLoading ? (
          <p className="text-center font-bold text-gray-400 py-12">Parsing resume...</p>
        ) : !analysis ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-[24px] p-12 text-center cursor-pointer transition-all bg-gray-50/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-purple-50 text-purple-600">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#1a253c] mb-1">Upload PDF / TXT CV file</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Use below drag and drop</p>
              </div>
              <button className="bg-[#9ef01a] hover:bg-[#8ae010] text-[#121315] font-bold text-xs px-6 py-3 rounded-full transition-colors shadow-sm">
                Select File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.txt,.doc,.docx"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-extrabold text-[#1a253c]">Smart Resume Matcher</h2>
              <button
                onClick={() => {
                  setAnalysis(null);
                  setTimeout(() => fileInputRef.current?.click(), 100);
                }}
                className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-extrabold text-xs px-4 py-2 rounded-full border border-gray-200 transition-colors shadow-sm"
              >
                Upload Different File
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-gray-50/50 p-6 rounded-[24px] border border-gray-100">
              <div>
                <p className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase mb-1">Filename</p>
                <p className="font-extrabold text-gray-800 text-sm truncate">{analysis.filename}</p>
              </div>
              <div>

                <p className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase mb-1">Sections Found</p>
                <p className="text-xl font-black text-gray-800">
                  {analysis.sections.filter((s) => s.found).length}/{analysis.sections.length}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase mb-1">Skills Detected</p>
                <p className="text-xl font-black text-gray-800">
                  {Object.values(analysis.skills).flat().length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-[#1a253c] uppercase tracking-wider">Resume Sections</h3>
                <div className="space-y-2">
                  {analysis.sections.map((section) => (
                    <div key={section.name} className="flex items-center justify-between p-4 bg-gray-50/30 rounded-2xl border border-gray-100">
                      <span className="text-sm font-bold text-gray-700">{section.name}</span>
                      {section.found ? (
                        <span className="bg-lime-100 text-lime-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Found</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Missing</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-[#1a253c] uppercase tracking-wider">Detected Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysis.skills).flatMap(([key, list]) =>
                    list.map((skill) => (
                      <span key={skill} className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-100">
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

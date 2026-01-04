
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Always use direct process.env.API_KEY for initialization without fallback values.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIAnalysis = async (data: any) => {
  try {
    // Filter out marks where TE/CE are empty string/undefined before sending to AI
    const studentsWithFilteredMarks = data.students.map((s: any) => ({
      ...s,
      marks: s.marks.filter((m: any) => (m.teMark !== '' && m.teMark !== undefined) || (m.ceMark !== '' && m.ceMark !== undefined))
    }));

    const cleanData = { ...data, students: studentsWithFilteredMarks };

    const prompt = `
      Act as an expert academic data analyst. Analyze the following class performance data:
      
      Class Details: ${cleanData.className} (${cleanData.studentCount} students)
      Subjects Reference: ${JSON.stringify(cleanData.subjects || [])}
      Student Performance Data: ${JSON.stringify(cleanData.students)}

      **CRITICAL**: The student data includes demographic fields like 'gender' and 'category'. You MUST utilize this data to calculate and compare performance metrics between genders (Boys vs Girls) and across different categories.

      Note: Marks 'A' means Absent (treat as 0 for stats but note it). '0' means scored zero. 
      Pass mark is generally 35%.

      Generate a highly visual, structured HTML report (NO Markdown, NO \`\`\`html tags).
      The report MUST use Tailwind CSS classes for styling.
      
      Include the following visual elements using HTML/CSS (no external charting libraries):
      1. **Executive Summary**: High-level insights including specific demographic observations.
      2. **Demographic Performance**: Compare Gender and Category averages.
      3. **Subject Deep Dive**: For each subject, show Average Score AND Pass Rate %.
      
      Structure the HTML output exactly like this:
      
      <div class="space-y-8 animate-in fade-in duration-700">
        <!-- Summary Section -->
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 class="text-2xl font-black text-slate-800 mb-4 flex items-center">
             <span class="mr-2">🚀</span> Executive Summary
          </h3>
          <p class="text-slate-600 font-medium leading-relaxed">
             [Write a concise summary paragraph here highlighting key achievements, pass percentages, and notable demographic trends (e.g., "Girls outperformed boys in Math")]
          </p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
           <!-- Gender Analysis -->
           <div class="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 relative overflow-hidden">
             <h4 class="font-black text-blue-900 mb-6 text-sm uppercase tracking-widest flex items-center">Gender Performance (Avg %)</h4>
             
             <!-- Boys -->
             <div class="mb-4">
               <div class="flex justify-between text-xs font-bold text-blue-700 mb-2">
                 <span>Boys Avg</span>
                 <span>[Boys Avg]%</span>
               </div>
               <div class="w-full bg-white h-3 rounded-full overflow-hidden shadow-inner">
                 <div class="bg-blue-500 h-full rounded-full" style="width: [Boys Avg]%"></div>
               </div>
             </div>

             <!-- Girls -->
             <div>
               <div class="flex justify-between text-xs font-bold text-pink-700 mb-2">
                 <span>Girls Avg</span>
                 <span>[Girls Avg]%</span>
               </div>
               <div class="w-full bg-white h-3 rounded-full overflow-hidden shadow-inner">
                 <div class="bg-pink-500 h-full rounded-full" style="width: [Girls Avg]%"></div>
               </div>
             </div>
           </div>

           <!-- Category Analysis -->
           <div class="bg-purple-50/50 p-6 rounded-3xl border border-purple-100">
             <h4 class="font-black text-purple-900 mb-6 text-sm uppercase tracking-widest">Category Breakdown (Avg %)</h4>
             <div class="space-y-3">
               <!-- Repeat for each category present (General, OEC, OBC, SC, ST etc.) -->
               <div class="flex items-center justify-between">
                 <span class="text-xs font-bold text-purple-800 w-24">[Category Name]</span>
                 <div class="flex-1 mx-3 h-2 bg-white rounded-full overflow-hidden">
                    <div class="bg-purple-500 h-full rounded-full" style="width: [Avg Score]%"></div>
                 </div>
                 <span class="text-xs font-black text-purple-900">[Avg Score]%</span>
               </div>
             </div>
           </div>
         </div>

        <!-- Subject Performance Cards -->
        <div>
           <h3 class="text-xl font-black text-slate-800 mb-6 flex items-center">📚 Subject Performance & Pass Rates</h3>
           <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             <!-- Repeat for subjects -->
             <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
               <div class="flex justify-between items-start mb-2">
                 <span class="font-bold text-slate-700 truncate pr-2">[Subject Name]</span>
                 <span class="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg">Avg: [Avg]%</span>
               </div>
               
               <!-- Pass Rate Indicator -->
               <div class="flex justify-between items-center mb-2 mt-2">
                 <span class="text-[10px] font-bold text-slate-400 uppercase">Pass Rate</span>
                 <span class="text-xs font-black text-green-600">[Pass Rate]%</span>
               </div>
               <div class="w-full bg-slate-100 h-1.5 rounded-full">
                 <div class="bg-green-500 h-full rounded-full" style="width: [Pass Rate]%"></div>
               </div>
             </div>
           </div>
         </div>

        <!-- Recommendations -->
        <div class="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
           <h3 class="text-lg font-black text-emerald-900 mb-4 flex items-center">
             <span>✨ AI Strategic Recommendations</span>
           </h3>
           <ul class="space-y-3">
             <!-- Repeat -->
             <li class="flex items-start text-sm font-medium text-emerald-800 bg-white/50 p-3 rounded-xl">
                <span class="mr-2 text-lg">💡</span> 
                <span>[Recommendation text based on analysis]</span>
             </li>
           </ul>
         </div>
      </div>

      Important:
      - Calculate averages based on the marks provided in the JSON.
      - Use 'gender' field ('Male', 'Female') for gender analysis.
      - Use 'category' field for category analysis.
      - Calculate Pass Rate for each subject (Marks >= 35 is Pass).
      - If subject names are missing in marks, map them using the Subjects Reference (match subjectId).
      - Do not output <html>, <head>, <body> tags.
      - Return ONLY the inner HTML content.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    let text = response.text || "Unable to generate AI analysis at this time.";
    // Clean up any potential markdown code blocks
    return text.replace(/```html/g, '').replace(/```/g, '');
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return `<div class="p-6 bg-red-50 text-red-600 rounded-2xl font-bold text-center border border-red-100">
      Unable to generate analysis. Please ensure API Key is valid and try again.
    </div>`;
  }
};

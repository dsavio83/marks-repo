const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Generate student performance analysis and advice
 * @param {Object} data - Student data, subject, exam, marks
 * @param {Array} languages - Array of languages to provide advice in
 * @returns {Promise<{analysis: string, advice: string}>}
 */
const generateAnalysis = async (data, languages = ['English', 'Tamil']) => {
    if (!process.env.GEMINI_API_KEY) {
        // Fallback logic if API key is missing
        return provideFallback(data, languages);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      You are an expert Kerala SCERT academic counselor and educational psychologist. 
      Analyze the following student performance following the CCE (Continuous and Comprehensive Evaluation) approach used in the Kerala State Education Department.
      
      Student: ${data.studentName}
      Subject: ${data.subjectName}
      Exam: ${data.examName}
      Total Marks: ${data.totalObtained}/${data.totalMax} (${data.percentage.toFixed(1)}%)
      
      Section-wise breakdown (Question Mark Values):
      ${data.performanceData}
      
      Instructions for "analysis" (English):
      - Provide a professional, concise 1-sentence analytical summary.
      - Mention the specific learning level (Basic/Intermediate/Proficient).
      
      Instructions for "advice" (Multilingual):
      - Provide a warm, highly motivational, and encouraging message that PUSHES the student to reach their next potential.
      - Follow the "Self-Reflective" approach where students are encouraged to think about their own learning gaps.
      - CRITICAL: For students scoring below 40%, focus on "Minimum Grade Mastery" (Basic 1, 2, 3 mark questions).
      - CRITICAL: For students scoring above 80%, focus on "Excellence & Lateral Thinking" (Profound/Application 4, 5, 6 mark questions).
      - SIGNIFICANT: Provide the advice ONLY in these languages: ${languages.join(', ')}.
      - For Tamil, use clearly written, elegant, and PUSHING (உந்துதல்) academic Tamil.
      - The tone should be like a mentor who believes in the student's hidden potential.
      
      Return the result as a JSON object:
      {
        "analysis": "Short English analysis here",
        "advice": "Motivational advice in requested languages here"
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean JSON from response if it has markdown blocks
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanJson);

    } catch (error) {
        console.error("Gemini API Error:", error);
        return provideFallback(data, languages);
    }
};

const provideFallback = (data, languages) => {
    const isEnglishSubject = data.subjectName.toLowerCase().includes('english');
    let analysis = `Student scored ${data.percentage.toFixed(1)}% in ${data.subjectName}. `;
    let adviceParts = [];

    const percentage = data.percentage;

    if (percentage < 35) {
        analysis += "Significant improvement needed.";
        if (languages.includes('English')) adviceParts.push("Focus on 1 and 2 mark questions to secure passing marks.");
        if (languages.includes('Tamil')) adviceParts.push(`${data.subjectName} பாடத்தில் தேர்ச்சி பெற 1, 2 மதிப்பெண் வினாக்களில் அதிக கவனம் செலுத்தவும்.`);
        if (languages.includes('Malayalam')) adviceParts.push(`${data.subjectName} വിഷയത്തിൽ വിജയിക്കാൻ 1, 2 മാർക്കിന്റെ ചോദ്യങ്ങളിൽ കൂടുതൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുക.`);
    } else if (percentage < 60) {
        analysis += "Average performance, focus on consistency.";
        if (languages.includes('English')) adviceParts.push("Practice medium-length questions to improve your grade.");
        if (languages.includes('Tamil')) adviceParts.push("கூடுதல் மதிப்பெண் பெற 3, 4 மதிப்பெண் வினாக்களில் பயிற்சி எடுக்கவும்.");
        if (languages.includes('Malayalam')) adviceParts.push("കൂടുതൽ മാർക്ക് നേടുന്നതിനായി 3, 4 മാർക്കിന്റെ ചോദ്യങ്ങൾ പരിശീലിക്കുക.");
    } else {
        analysis += "Good performance. Aim for higher scores.";
        if (languages.includes('English')) adviceParts.push("Great work! Practice long answers to maintain excellence.");
        if (languages.includes('Tamil')) adviceParts.push("தொடர்ந்து சிறப்பாக செயல்பட வாழ்த்துகள்.");
        if (languages.includes('Malayalam')) adviceParts.push("മികച്ച പ്രകടനം തുടരാൻ ആശംസകൾ.");
    }

    // Handle specific English rule even in higher scores if explicitly requested
    if (isEnglishSubject && percentage < 50) {
        // Already handled in the < 35 block partly, but ensure it's there
    }

    return {
        analysis,
        advice: adviceParts.join(' / ')
    };
};

module.exports = { generateAnalysis };

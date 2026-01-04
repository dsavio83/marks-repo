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
      Analyze the following student performance based on the specific "Kerala State Education Research Institute" evaluation patterns.
      
      Student: ${data.studentName}
      Subject: ${data.subjectName}
      Exam: ${data.examName}
      Total Marks: ${data.totalObtained}/${data.totalMax} (${data.percentage.toFixed(1)}%)
      
      Section-wise breakdown (Question Mark Values):
      ${data.performanceData}
      
      CRITICAL EVALUATION LOGIC (Follow this STRICTLY):
      
      1. **FAIL / BASIC LEVEL (< 30%)**:
         - **Diagnosis**: Failed to secure the basic 30% marks designed for everyone.
         - **Root Cause**: Likely struggles with **Basic Reading and Writing** skills or Cognitive Processing of simple questions.
         - **Strategy**: Focus on improving reading/writing fluency first.
         - **Target Questions**: Focus primarily on **1 Mark, 2 Mark, and 3 Mark** questions.
         - **Advice Tone**: Gentle, remedial, focusing on literacy basics.
      
      2. **BELOW AVERAGE / BORDERLINE (30% - 50%)**:
         - **Diagnosis**: Passed basic level but stuck at average.
         - **Strategy**: Push them to "Average" level. Needs motivation and specific study notes.
         - **Target Questions**: Focus on **2 Mark, 3 Mark, and 5 Mark** questions.
         - **Action**: Advise them to "Write and Practice" (எழுதி படித்து) to improve skills.
         - **Advice Tone**: Motivational, pushing them to use notes/hints.
      
      3. **AVERAGE TO PROFICIENT (50% - 80%)**:
         - **Diagnosis**: Good performance, potential for high achievement.
         - **Strategy**: Deep conceptual understanding is required to reach "Profound" level.
         - **Action**: MUST advise reading the **ENTIRE TEXTBOOK** (புத்தகம் முழுவதையும் வாசிக்க வேண்டும்) to grasp deep concepts.
         - **Target Questions**: Focus on **5 Mark and 6 Mark** (Essay/Long) questions.
         - **Advice Tone**: High-performance coaching, focusing on depth and variety.

      4. **EXCELLENCE (> 80%)**:
         - Focus on perfection and lateral thinking.
      
      Instructions for "analysis" (English):
      - Provide a professional, concise 1-sentence analytical summary based on the above levels.
      
      Instructions for "advice" (Multilingual):
      - Generate advice in: ${languages.join(', ')}.
      - **Tamil Advice (\`For Tamil\`)**: Use professional yet touching academic Tamil.
      - **CONTENT MUST MATCH THE SCORE CATEGORY ABOVE**.
      - Ensure the advice is dynamic and specific to the subject (don't repeat generic phrases).
      
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
    let analysis = `Score: ${data.percentage.toFixed(1)}%. `;
    let adviceParts = [];

    const percentage = data.percentage;

    if (percentage < 30) {
        analysis += "Needs focus on basic reading skills.";
        if (languages.includes('English')) adviceParts.push("Focus on 1, 2, 3 mark Qs. Improve reading/writing.");
        if (languages.includes('Tamil')) adviceParts.push("வாசிப்பு மற்றும் எழுத்து பயிற்சியில் கவனம் செலுத்தவும். 1, 2, 3 மதிப்பெண் வினாக்களை படிக்கவும்.");
        if (languages.includes('Malayalam')) adviceParts.push("വായനയിലും എഴുത്തിലും ശ്രദ്ധിക്കുക. 1, 2, 3 മാർക്ക് ചോദ്യങ്ങൾ പഠിക്കുക.");
    } else if (percentage < 50) {
        analysis += "Average potential. Needs consistency.";
        if (languages.includes('English')) adviceParts.push("Practice writing answers. Focus on 2, 3, 5 mark Qs.");
        if (languages.includes('Tamil')) adviceParts.push("எழுதி படித்து பயிற்சி செய்யவும். 2, 3, 5 மதிப்பெண் வினாக்களில் கவனம் செலுத்தவும்.");
        if (languages.includes('Malayalam')) adviceParts.push("എഴുതി പഠിക്കുക. 2, 3, 5 മാർക്ക് ചോദ്യങ്ങളിൽ ശ്രദ്ധിക്കുക.");
    } else if (percentage < 80) {
        analysis += "Good. Aim for profound understanding.";
        if (languages.includes('English')) adviceParts.push("Read the entire textbook for deep concepts. Focus on 5, 6 mark Qs.");
        if (languages.includes('Tamil')) adviceParts.push("புத்தகம் முழுவதையும் வாசிக்கவும். 5, 6 மதிப்பெண் வினாக்களில் கவனம் செலுத்தவும்.");
        if (languages.includes('Malayalam')) adviceParts.push("പാഠപുസ്തകം മുഴുവനായി വായിക്കുക. 5, 6 മാർക്ക് ചോദ്യങ്ങളിൽ ശ്രദ്ധിക്കുക.");
    } else {
        analysis += "Excellent performance.";
        if (languages.includes('English')) adviceParts.push("Maintain this excellence.");
        if (languages.includes('Tamil')) adviceParts.push("மிகச்சிறப்பு. இதை தக்கவைக்கவும்.");
        if (languages.includes('Malayalam')) adviceParts.push("മികച്ച വിജയം.");
    }

    return {
        analysis,
        advice: adviceParts.join(' / ')
    };
};

module.exports = { generateAnalysis };

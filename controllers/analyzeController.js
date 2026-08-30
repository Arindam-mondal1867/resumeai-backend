const pdfParse = require("pdf-parse");
const Groq = require("groq-sdk");
const History = require("../models/History");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ===================================
// ✅ SAFE JSON PARSER
// ===================================
const extractJSON = (text) => {

  try {

    const match =
      text.match(/\{[\s\S]*\}/);

    return match
      ? JSON.parse(match[0])
      : null;

  } catch {

    return null;

  }
};

// ===================================
// ✅ SAFE ARRAY PARSER
// ===================================
const extractJSONArray = (text) => {
  try {
    if (!text || typeof text !== "string") {
      return [];
    }

    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");

    if (start === -1 || end === -1 || end <= start) {
      console.log("ROADMAP JSON NOT FOUND:");
      console.log(cleaned);
      return [];
    }

    const jsonString = cleaned.slice(start, end + 1);

    const parsed = JSON.parse(jsonString);

    return Array.isArray(parsed) ? parsed : [];

  } catch (error) {
    console.log("ARRAY JSON PARSE ERROR:", error.message);
    console.log("RAW ARRAY RESPONSE:", text);
    return [];
  }
};

// ===================================
// 🔥 CLEAN TEXT
// ===================================
const cleanText = (text) =>

  text
    .toLowerCase()
    .replace(/\s+/g, " ");

// ===================================
// 🔥 JD FALLBACK
// ===================================
const fallbackJDParser = (jobDesc) => {

  return jobDesc

    .toLowerCase()

    .split(/[\n,:]+/)

    .map((s) => s.trim())

    .filter((s) => s.length > 2);
};

// ===================================
// 🔥 ROLE DETECTION
// ===================================
const detectJobTitle = (
  jdSkills,
  jobDesc
) => {

  const text = jobDesc.toLowerCase();
const skills = jdSkills.join(" ").toLowerCase();

// ================= AI / ML =================
if (
  skills.includes("machine learning") ||
  skills.includes("deep learning") ||
  skills.includes("tensorflow") ||
  skills.includes("pytorch") ||
  skills.includes("nlp") ||
  skills.includes("computer vision") ||
  skills.includes("opencv") ||
  skills.includes("llm") ||
  skills.includes("generative ai") ||
  skills.includes("langchain")
) {
  return "AI / ML Engineer";
}

// ================= Data Science =================
if (
  skills.includes("pandas") ||
  skills.includes("numpy") ||
  skills.includes("scikit-learn") ||
  skills.includes("matplotlib") ||
  skills.includes("power bi") ||
  skills.includes("tableau") ||
  skills.includes("data analysis")
) {
  return "Data Scientist";
}

// ================= Full Stack =================
if (
  (skills.includes("react") ||
    skills.includes("next.js")) &&
  (skills.includes("node") ||
    skills.includes("express"))
) {
  return "Full Stack Developer";
}

// ================= Frontend =================
if (
  skills.includes("react") ||
  skills.includes("next.js") ||
  skills.includes("vue") ||
  skills.includes("angular") ||
  skills.includes("html") ||
  skills.includes("css") ||
  skills.includes("tailwind") ||
  skills.includes("bootstrap") ||
  skills.includes("javascript") ||
  skills.includes("typescript")
) {
  return "Frontend Developer";
}


// ================= Backend =================
if (
  skills.includes("node") ||
  skills.includes("express") ||
  skills.includes("spring boot") ||
  skills.includes("spring") ||
  skills.includes("django") ||
  skills.includes("flask") ||
  skills.includes("laravel")
) {
  return "Backend Developer";
}

// ================= Java =================
if (
  skills.includes("java") &&
  (skills.includes("spring") ||
    skills.includes("spring boot"))
) {
  return "Java Backend Developer";
}

// ================= Python =================
if (
  skills.includes("python") &&
  !skills.includes("tensorflow") &&
  !skills.includes("pytorch")
) {
  return "Python Developer";
}

// ================= Android =================
if (
  skills.includes("android") ||
  skills.includes("kotlin")
) {
  return "Android Developer";
}

// ================= Flutter =================
if (
  skills.includes("flutter") ||
  skills.includes("dart")
) {
  return "Flutter Developer";
}

// ================= DevOps =================
if (
  skills.includes("docker") ||
  skills.includes("kubernetes") ||
  skills.includes("jenkins") ||
  skills.includes("github actions") ||
  skills.includes("terraform")
) {
  return "DevOps Engineer";
}

// ================= Cloud =================
if (
  skills.includes("aws") ||
  skills.includes("azure") ||
  skills.includes("gcp")
) {
  return "Cloud Engineer";
}

// ================= Database =================
if (
  skills.includes("mysql") ||
  skills.includes("postgresql") ||
  skills.includes("mongodb") ||
  skills.includes("oracle")
) {
  return "Database Engineer";
}

// ================= Cyber Security =================
if (
  skills.includes("cyber security") ||
  skills.includes("penetration testing") ||
  skills.includes("ethical hacking")
) {
  return "Cyber Security Engineer";
}

// ================= QA =================
if (
  skills.includes("selenium") ||
  skills.includes("testing") ||
  skills.includes("automation testing")
) {
  return "QA Automation Engineer";
}

// ================= Blockchain =================
if (
  skills.includes("blockchain") ||
  skills.includes("solidity") ||
  skills.includes("web3")
) {
  return "Blockchain Developer";
}

// ================= UI/UX =================
if (
  skills.includes("figma") ||
  skills.includes("ui") ||
  skills.includes("ux")
) {
  return "UI/UX Designer";
}

// ================= Electrical =================
if (text.includes("electrical")) {
  return "Electrical Engineer";
}

// ================= Default =================
return "Software Engineer";
};

// ===================================
// 🔥 EXPAND SKILLS
// ===================================
const expandSkills = (
  skills
) => {

  let expanded = [];

  skills.forEach((skill) => {

    if (
      typeof skill !== "string"
    ) return;

    const match =
      skill.match(
        /(.*?)\((.*?)\)/
      );

    if (match) {

      const main =
        match[1].trim();

      const subs =
        match[2]
          .split(",")
          .map((s) =>
            s.trim()
          );

      expanded.push(main);

      expanded.push(...subs);

    } else {

      expanded.push(skill);

    }

  });

  return [...new Set(expanded)];
};

// ===================================
// 🚀 MAIN CONTROLLER
// ===================================
exports.analyzeResume =
  async (req, res) => {

  try {

    const jobDesc =
      req.body.jobDescription ||

      req.body.jobDesc ||

      "";

    if (!req.file) {

      return res
        .status(400)
        .json({
          error:
            "No file uploaded",
        });
    }

    // ===================================
    // 📄 PDF → TEXT
    // ===================================
    const pdf =
      await pdfParse(
        req.file.buffer
      );

    const resumeText =
      cleanText(pdf.text);

    console.log(
      "RESUME:",
      resumeText.slice(0, 200)
    );

    let jdSkills = [];

    let jobTitle =
      "Unknown Role";

    // ===================================
    // 🤖 AI JD ANALYSIS
    // ===================================
    try {

      const aiResponse =
        await groq.chat.completions.create({

          model:
            "llama-3.1-8b-instant",

          messages: [
            {
              role: "user",

              content: `
You are an ATS AI.

Return ONLY valid JSON.

FORMAT:
{
 "jobTitle":"",
 "jdSkills":[]
}

IMPORTANT:
- Extract ONLY technical skills
- No explanation
- No hallucination
- No soft skills
- Skills must come ONLY from JD

Job Description:
${jobDesc}
`,
            },
          ],

          temperature: 0.1,
        });

      const aiData =
        extractJSON(

          aiResponse
            .choices[0]
            .message.content
        );

      if (
        aiData &&
        Array.isArray(
          aiData.jdSkills
        )
      ) {

        jdSkills =
          aiData.jdSkills;

        jobTitle =
          aiData.jobTitle ||
          jobTitle;
      }

    } catch (err) {

      console.log(
        "AI ERROR:",
        err.message
      );
    }

    // ===================================
    // 🔥 FALLBACK
    // ===================================
    if (
      !jdSkills ||
      jdSkills.length === 0
    ) {

      jdSkills =
        fallbackJDParser(
          jobDesc
        );
    }

    // ===================================
    // 🔥 EXPAND
    // ===================================
    jdSkills =
      expandSkills(jdSkills);

    // ===================================
    // 🔥 CLEAN JD SKILLS
    // ===================================
    jdSkills =

      jdSkills

        .map(skill =>

          String(skill)
            .toLowerCase()
            .trim()

        )

        .filter(skill =>

          skill.length > 1

        );

    jdSkills =
      [...new Set(jdSkills)];

    // ===================================
    // 🔥 ROLE DETECTION
    // ===================================
    if (
      !jobTitle ||
      jobTitle ===
        "Unknown Role"
    ) {

      jobTitle =
        detectJobTitle(
          jdSkills,
          jobDesc
        );
    }

    // ===================================
    // 🎯 REAL JD vs RESUME MATCH
    // ===================================
    let keySkills = [];

    let missingSkills = [];

    jdSkills.forEach(skill => {

      // JD skill resume e ache?
      if (

        resumeText.includes(
          skill.toLowerCase()
        )

      ) {

        keySkills.push(skill);

      } else {

        missingSkills.push(skill);

      }

    });

    keySkills =
      [...new Set(keySkills)];

    missingSkills =
      [...new Set(missingSkills)];

    // ===================================
    // 🎯 ATS SCORE
    // ===================================

    // skill score
    const skillScore =

      jdSkills.length === 0

        ? 0

        : (

          keySkills.length /

          jdSkills.length

        ) * 100;

    // projects
    const projectScore =

      resumeText.includes(
        "project"
      )

        ? Math.min(
            100,
            keySkills.length * 15
          )

        : 30;

    // experience
    const experienceScore =

      resumeText.includes(
        "intern"
      ) ||

      resumeText.includes(
        "experience"
      )

        ? 80

        : 40;

    // education
    const educationScore =

      resumeText.includes(
        "bachelor"
      ) ||

      resumeText.includes(
        "b.tech"
      ) ||

      resumeText.includes(
        "degree"
      )

        ? 80

        : 50;

    // certification
    const certScore =

      resumeText.includes(
        "certification"
      ) ||

      resumeText.includes(
        "certified"
      )

        ? 70

        : 30;

    // FINAL ATS
    let matchScore =

      (
        skillScore * 0.70
      ) +

      (
        projectScore * 0.10
      ) +

      (
        experienceScore * 0.10
      ) +

      (
        educationScore * 0.05
      ) +

      (
        certScore * 0.05
      );

    // NEVER ABOVE 100
    matchScore =

      Math.min(
        100,
        Math.round(matchScore)
      );

    // ===================================
    // 📊 BREAKDOWN
    // ===================================
    const scoreBreakdown = {

      skills:
        Math.round(skillScore),

      projects:
        projectScore,

      experience:
        experienceScore,

      education:
        educationScore,

      certifications:
        certScore,
    };

    // ===================================
    // ATS LEVEL
    // ===================================
    let atsProbability =
      "Low";

    if (matchScore >= 80) {

      atsProbability =
        "High";

    } else if (
      matchScore >= 60
    ) {

      atsProbability =
        "Medium";
    }

    // ===================================
// 💪 VERIFIED STRENGTHS
// ===================================

let strengths = [];

if (keySkills.length > 0) {
  strengths.push(
    `Strong technical proficiency in ${keySkills.slice(0, 3).join(", ")}.`
  );

  strengths.push(
    "Demonstrates alignment with key technologies required for the target role."
  );
}

if (resumeText.includes("project")) {
  strengths.push(
    "Hands-on experience building practical software projects."
  );
}

if (
  resumeText.includes("intern") ||
  resumeText.includes("experience")
) {
  strengths.push(
    "Practical exposure to real-world development environments."
  );
}

if (
  resumeText.includes("github") ||
  resumeText.includes("portfolio")
) {
  strengths.push(
    "Shows initiative by maintaining technical projects and portfolio."
  );
}

if (strengths.length === 0) {
  strengths.push(
    "Demonstrates a solid foundation for entry-level software engineering roles."
  );
}

    // ===================================
// 🚀 PERSONALIZED IMPROVEMENT PLAN
// ===================================

let improvements = [];

missingSkills.forEach((skill) => {

  const s = skill.toLowerCase();

  if (s.includes("react")) {

    improvements.push(
      "Build a production-ready React dashboard with reusable components."
    );

  } else if (s.includes("node")) {

    improvements.push(
      "Develop REST APIs using Node.js and Express following clean architecture."
    );

  } else if (s.includes("express")) {

    improvements.push(
      "Practice Express middleware, authentication and API security."
    );

  } else if (s.includes("mongodb")) {

    improvements.push(
      "Design optimized MongoDB schemas and aggregation pipelines."
    );

  } else if (s.includes("sql")) {

    improvements.push(
      "Improve SQL querying skills including joins and indexing."
    );

  } else if (s.includes("docker")) {

    improvements.push(
      "Containerize your application using Docker and Docker Compose."
    );

  } else if (s.includes("aws")) {

    improvements.push(
      "Deploy a full-stack application on AWS using EC2 and S3."
    );

  } else if (s.includes("python")) {

    improvements.push(
      "Build automation or backend projects using Python."
    );

  } else if (s.includes("java")) {

    improvements.push(
      "Strengthen Java by solving advanced DSA and backend problems."
    );

  } else {

    improvements.push(
      `Gain hands-on experience with ${skill} through real-world projects.`
    );
  }

});

if (!resumeText.includes("project")) {

  improvements.push(
    "Add at least 2 production-ready projects to strengthen your resume."
  );

}

if (
  !resumeText.includes("github")
) {

  improvements.push(
    "Publish your projects on GitHub with proper documentation."
  );

}

improvements.push(
  "Tailor your resume keywords according to every job description before applying."
);

    // ===================================
    // 🗺️ ROADMAP
    // ===================================
   // ===================================
// 🗺️ ROADMAP
// ===================================

let roadmap = [];

try {

  const roadmapPrompt = `
You are an expert AI career mentor.

Generate a personalized 12-week career roadmap.

IMPORTANT RULES:

- Generate EXACTLY 12 weeks.
- Week values must be "Week 1" through "Week 12".
- Roadmap must depend on the missing skills.
- Include practical projects.
- Include interview preparation.
- Include advanced concepts.
- Week 12 must include mock interview and revision.
- Return ONLY a valid JSON array.
- Do NOT use markdown.
- Do NOT use code fences.
- Do NOT add any explanation.
- Every object must contain exactly:
  week
  title
  difficulty
  hours

FORMAT:

[
  {
    "week": "Week 1",
    "title": "React Fundamentals",
    "difficulty": "Beginner",
    "hours": "12 hrs"
  }
]

Resume:
${resumeText}

Job Role:
${jobTitle}

Missing Skills:
${missingSkills.join(", ")}
`;

  const roadmapResponse =
    await groq.chat.completions.create({

      model:
        "llama-3.1-8b-instant",

      messages: [
        {
          role: "user",
          content: roadmapPrompt
        }
      ],

      temperature: 0.7

    });

  const rawRoadmap =
    roadmapResponse.choices[0].message.content;

  console.log("=================================");
  console.log("RAW ROADMAP RESPONSE:");
  console.log(rawRoadmap);
  console.log("=================================");

  roadmap = extractJSONArray(rawRoadmap);

  console.log("PARSED ROADMAP:");
  console.log(roadmap);

} catch (err) {

  console.log(
    "ROADMAP ERROR:",
    err.message
  );

}
    // ===================================
    // ✨ RESUME REWRITE
    // ===================================
    let rewrittenResume = [];

    try {

      const rewritePrompt = `
You are an expert ATS resume writer and senior technical recruiter.

Rewrite resume content professionally.

IMPORTANT RULES:

- improve wording
- use strong action verbs
- ATS optimized
- professional tone
- concise bullet points
- domain specific
- improve projects
- improve experience
- improve achievements
- rewrite weak sentences professionally
- make resume recruiter friendly
- use industry-standard resume language
- make bullet points impactful
- quantify achievements whenever possible
- add measurable impact if missing
- improve technical clarity
- improve readability
- avoid repetitive wording
- prioritize modern technologies
- highlight leadership and ownership
- emphasize scalability, optimization, and performance
- use STAR methodology implicitly
- focus on business impact
- optimize for FAANG/product-based companies
- improve project descriptions professionally
- improve grammar
- make experience look stronger
- make projects sound production-level
- keep each bullet concise
- avoid generic statements
- output only resume-ready bullet points
- no headings
- no explanations
- no markdown

Return ONLY JSON array.


Example:
[
 "Developed scalable React applications with reusable UI components improving UI performance by 35%.",

 "Optimized backend APIs reducing server response time by 40%.",

 "Implemented JWT authentication and role-based access control for secure user management."
]

Resume:
${resumeText}

Job Role:
${jobTitle}

Missing Skills:
${missingSkills.join(", ")}
`;

      const rewriteResponse =
        await groq.chat.completions.create({

          model:
            "llama-3.1-8b-instant",

          messages: [
            {
              role: "user",

              content:
                rewritePrompt,
            },
          ],

          temperature: 0.7,
        });

      rewrittenResume =
        extractJSONArray(

          rewriteResponse
            .choices[0]
            .message.content

        );

    } catch (err) {

      console.log(
        "REWRITE ERROR:",
        err.message
      );
    }
    // ===================================
// 🛡️ ROADMAP FALLBACK
// ===================================

if (!Array.isArray(roadmap) || roadmap.length === 0) {

  console.log(
    "Using fallback roadmap..."
  );

  const skillsForRoadmap =
    missingSkills.length > 0
      ? missingSkills
      : jdSkills;

  roadmap = Array.from(
    { length: 12 },
    (_, index) => {

      const skill =
        skillsForRoadmap[index % skillsForRoadmap.length] ||
        jobTitle;

      return {
        week: `Week ${index + 1}`,

        title:
          index < 4
            ? `Learn ${skill}`
            : index < 8
            ? `Practice ${skill}`
            : index < 11
            ? `Build Project using ${skill}`
            : "Mock Interview + Final Revision",

        difficulty:
          index < 4
            ? "Beginner"
            : index < 8
            ? "Intermediate"
            : "Advanced",

        hours: "12 hrs"
      };

    }
  );

}


    // ===================================
// 📄 AI RESUME FORMAT
// ===================================

let formattedResume = {};

try {

const formatPrompt = `
You are a senior technical recruiter.

Convert the resume into clean structured JSON.

Return ONLY JSON.

Format:

{
"name":"",
"email":"",
"phone":"",
"summary":"",
"education":[
{
"degree":"",
"college":"",
"year":""
}
],
"skills":[],
"projects":[],
"experience":[]
}

Resume:

${resumeText}

`;

const response =
await groq.chat.completions.create({

model:"llama-3.1-8b-instant",

messages:[
{
role:"user",
content:formatPrompt
}
],

temperature:0.2

});

formattedResume =
extractJSON(
response.choices[0].message.content
) || {};
console.log("RAW FORMATTED RESPONSE:");
console.log(response.choices[0].message.content);

console.log("FORMATTED JSON:");
console.log(formattedResume);

}
catch(err){

console.log(err);

}

    // ===================================
    // 📊 STRENGTH METER
    // ===================================
    const strengthMeter = {

      technicalSkills:
        Math.round(skillScore),

      projects:
        projectScore,

      atsReadiness:
        matchScore,

      experience:
        experienceScore,
    };
    // ===================================
// ⭐ RESUME QUALITY
// ===================================

const resumeQuality = Math.round(
  (
    Math.round(skillScore) +
    projectScore +
    experienceScore +
    educationScore +
    certScore
  ) / 5
);

    // ===================================
    // 📝 SUMMARY
    // ===================================
    const fitStatus =
  matchScore >= 85
    ? "Excellent Fit"
    : matchScore >= 70
    ? "Good Match"
    : matchScore >= 50
    ? "Average Fit"
    : "Needs Improvement";

const matchedSkillsCount = keySkills.length;

const missingSkillsCount = missingSkills.length;
const totalSkills = jdSkills.length;

const analysisDate = new Date().toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const overallJobFit = matchScore;

const experienceLevel =
  experienceScore >= 80
    ? "Mid Level"
    : experienceScore >= 50
    ? "Junior Level"
    : "Entry Level";

const detectIndustry = (role) => {

  role = role.toLowerCase();

  if (
    role.includes("ai") ||
    role.includes("ml")
  )
    return "Artificial Intelligence";

  if (
    role.includes("data scientist")
  )
    return "Data Science";

  if (
    role.includes("frontend")
  )
    return "Frontend Engineering";

  if (
    role.includes("backend") ||
    role.includes("java backend") ||
    role.includes("python developer")
  )
    return "Backend Engineering";

  if (
    role.includes("full stack")
  )
    return "Software Engineering";

  if (
    role.includes("android") ||
    role.includes("flutter")
  )
    return "Mobile Development";

  if (
    role.includes("cloud")
  )
    return "Cloud Computing";

  if (
    role.includes("devops")
  )
    return "DevOps";

  if (
    role.includes("cyber")
  )
    return "Cyber Security";

  if (
    role.includes("blockchain")
  )
    return "Blockchain";

  if (
    role.includes("database")
  )
    return "Database Engineering";

  if (
    role.includes("qa")
  )
    return "Software Testing";

  if (
    role.includes("ui") ||
    role.includes("ux")
  )
    return "UI / UX Design";

  if (
    role.includes("electrical")
  )
    return "Electrical Engineering";

  return "IT / Software";

};

const industry = detectIndustry(jobTitle);
    let summary =

      matchScore >= 80

        ? `Excellent fit for ${jobTitle}`

        : matchScore >= 60

        ? `Good match for ${jobTitle}`

        : `Needs improvement for ${jobTitle}`;

    // ===================================
    // 💾 SAVE
    // ===================================
    const saved =
      await History.create({

      userId:
        req.user?._id || null,

      jobTitle,

      matchScore,

      atsProbability,

      keySkills,

      missingSkills,

      resumeText,
      formattedResume,
      
    });

    console.log(
      "SAVED:",
      saved._id
    );

    // ===================================
    // 🚀 RESPONSE
    // ===================================
    res.json({

      success: true,

      analysis: {

        jobTitle,

        summary,

        matchScore,

        atsProbability,

        keySkills,

        missingSkills,
        fitStatus,
matchedSkillsCount,
missingSkillsCount,
analysisDate,
overallJobFit,
totalSkills,
experienceLevel,
industry,
resumeQuality,


        skillGap:
          missingSkills.map(
            (s) => ({
              skill: s,
              priority: "High",
            })
          ),

        strengths,

        improvements,

        scoreBreakdown,

        strengthMeter,

        roadmap,

        rewrittenResume,
        formattedResume,
      },
    });

  } catch (error) {

    console.error(
      "ERROR:",
      error.message
    );

    res.status(500).json({

      error:
        "Analysis failed",
    });
  }
};
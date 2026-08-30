const express = require("express");

const router = express.Router();

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

router.post("/", async (req, res) => {

  try {

    const {
      message,
      analysis
    } = req.body;

   const prompt = `

You are ResumeAI, a smart AI career assistant.

Resume Analysis:
${JSON.stringify(analysis)}

User Question:
${message}

Instructions:
- Give professional detailed answers
- Use 5-8 bullet points whenever possible
- Each bullet point should be 1-2 lines
- Avoid giant paragraphs
- Use headings when needed
- Use markdown formatting
- Keep responses modern and beautiful
- Give practical real-world advice
- Explain clearly like ChatGPT Premium
- For interview questions give examples
- For project suggestions explain features briefly
- For ATS questions give actionable improvement tips
- Make answers medium-sized and informative
- Do not make answers overly short
- Only give short answers if user explicitly says "short answer"
- Make responses easy to read and professional

`;

    const chatCompletion =
      await groq.chat.completions.create({

        messages: [

          {
            role: "system",
            content: `
You are ResumeAI.

Rules:
- Give professional medium-sized answers
- Use markdown formatting
- Use headings and bullet points
- Use 5-8 points whenever useful
- Keep formatting beautiful and modern
- Avoid huge paragraphs
- Explain concepts clearly
- Give practical industry-level advice
- Keep answers informative and readable
- Only give short answers if user requests short answer
- Answer professionally like ChatGPT
`
          },

          {
            role: "user",
            content: prompt
          }

        ],

       model:
  "llama-3.1-8b-instant",

        temperature: 0.9

      });

    res.json({

      reply:
        chatCompletion
        .choices[0]
        .message
        .content

    });

  }

  catch (err) {

  console.log("ASK AI ERROR:");
  console.log(err.message);
  console.log(err);

  res.status(500).json({
    error: "AI failed",
    details: err.message
  });

}

});

module.exports = router;
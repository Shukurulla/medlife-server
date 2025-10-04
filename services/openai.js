const axios = require("axios");

exports.chatWithAI = async (symptoms, userAge, hasDiabetes) => {
  try {
    const prompt = `Bemor: ${userAge} yosh, ${
      hasDiabetes ? "qandli diabet kasalligi bor" : "sog'lom"
    }.
Semptomlar: ${symptoms}

Ushbu semptomlarni tahlil qiling va ehtimoliy tashxis bering. Javobingizni quyidagi formatda bering:
1. Ehtimoliy kasallik
2. Tavsiyalar
3. Qaysi shifokorga murojaat qilish kerak

MUHIM: Bu AI tashxis bo'lib, 100% aniq emas. Bemor albatta shifokorga ko'rinishi kerak.`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Siz tibbiy yordamchi AI-siziz. Semptomlarni tahlil qiling va oddiy tilda tushuntiring.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer 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`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API xatosi:", error.response?.data || error.message);
    throw new Error("AI chat xizmati ishlamayapti");
  }
};

exports.analyzeFoodFeedback = async (foodName, sugarContent, hasDiabetes) => {
  try {
    const prompt = `Ovqat: ${foodName}
Shakar miqdori: ${sugarContent}g
Bemor holati: ${hasDiabetes ? "Qandli diabet bor" : "Sog'lom"}

Ushbu ovqatni iste'mol qilish haqida qisqa tavsiya bering (2-3 jumla).`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Siz ovqatlanish bo'yicha maslahatchi siziz. Qisqa va tushunarli javob bering.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    return "Mo'tadil miqdorda iste'mol qiling.";
  }
};

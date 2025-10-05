const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

exports.chatWithAI = async (symptoms, userAge, hasDiabetes) => {
  try {
    const prompt = `
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
              "Siz tibbiy yordamchi AI-siziz. Semptomlarni tahlil qiling va oddiy tilda tushuntiring",
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
          Authorization: `Bearer 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`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    return "Mo'tadil miqdorda iste'mol qiling.";
  }
};

exports.analyzeFoodImageWithVision = async (base64Image) => {
  try {
    const prompt = `
Анализируй это изображение еды. Определи:
1. Название блюда или продуктов (на русском)
2. Примерное количество сахара в граммах (для порции на фото)
3. Примерное количество калорий
4. Примерное количество углеводов в граммах

Ответ дай в JSON формате:
{
  "foodName": "название",
  "sugarContent": число,
  "calories": число,
  "carbs": число,
  "confidence": число от 0 до 1
}
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // или "gpt-4o"
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
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

    const content = response.data.choices[0].message.content;

    // JSON ni ajratib olish
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return {
        foodName: analysis.foodName || "Noma'lum ovqat",
        confidence: analysis.confidence || 0.8,
        sugarContent: analysis.sugarContent || 5,
        calories: analysis.calories || 150,
        carbs: analysis.carbs || 15,
      };
    }

    // Agar JSON topilmasa, default qiymatlar
    return {
      foodName: "Noma'lum ovqat",
      confidence: 0.5,
      sugarContent: 5,
      calories: 150,
      carbs: 15,
    };
  } catch (error) {
    console.error(
      "OpenAI Vision API xatosi:",
      error.response?.data || error.message
    );
    return {
      foodName: "Noma'lum ovqat",
      confidence: 0,
      sugarContent: 5,
      calories: 150,
      carbs: 15,
    };
  }
};

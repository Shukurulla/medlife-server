const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

exports.analyzeFoodImage = async (base64Image) => {
  try {
    const response = await axios.post(
      `https://api.clarifai.com/v2/models/${process.env.CLARIFAI_MODEL_ID}/outputs`,
      {
        inputs: [
          {
            data: {
              image: {
                base64: base64Image,
              },
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Key ${process.env.CLARIFAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const concepts = response.data.outputs[0].data.concepts;
    const topFood = concepts[0];

    // Ovqat uchun taxminiy shakar miqdorini hisoblash
    const sugarEstimates = {
      rice: 0.5,
      bread: 2,
      pasta: 1,
      potato: 0.8,
      fruit: 10,
      vegetable: 2,
      meat: 0,
      fish: 0,
      cake: 25,
      candy: 50,
      juice: 12,
      soda: 10,
    };

    let sugarContent = 5; // default
    for (const [key, value] of Object.entries(sugarEstimates)) {
      if (topFood.name.toLowerCase().includes(key)) {
        sugarContent = value;
        break;
      }
    }

    // Kaloriya taxminiy
    const calories = sugarContent * 4 + 100;

    return {
      foodName: topFood.name,
      confidence: topFood.value,
      sugarContent: sugarContent,
      calories: calories,
      carbs: sugarContent * 1.2,
    };
  } catch (error) {
    console.error(
      "Clarifai API xatosi:",
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
// Mavjud kodingizdan keyin qo'shing:

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
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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

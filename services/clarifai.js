const axios = require("axios");

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

// 97-qaror bo'yicha skrining savollari va baholash
const screeningQuestions = {
  diabetes: [
    {
      id: 1,
      question: "Sizda qandli diabet kasalligi bormi?",
      ageGroup: "all",
    },
    {
      id: 2,
      question: "Oilangizda qandli diabet kasalligi bo'lganmi?",
      ageGroup: "all",
    },
    { id: 3, question: "Tez-tez chanqaysizmi?", ageGroup: "all" },
    {
      id: 4,
      question: "Og'irligingiz kutilmaganda kamayib yoki ko'payib qoldimi?",
      ageGroup: "all",
    },
  ],
  hypertension: [
    { id: 5, question: "Bosh og'rig'i tez-tez bo'ladimi?", ageGroup: "40+" },
    { id: 6, question: "Yurak urishi tezlashadimi?", ageGroup: "40+" },
    {
      id: 7,
      question: "Oilangizda yurak-qon tomir kasalliklari bo'lganmi?",
      ageGroup: "40+",
    },
  ],
  cardiovascular: [
    { id: 8, question: "Ko'krak qafasida og'riq sezasizmi?", ageGroup: "40+" },
    { id: 9, question: "Nafas qisilish holatlari bo'ladimi?", ageGroup: "40+" },
    { id: 10, question: "Chekasizmi?", ageGroup: "18+" },
  ],
  respiratory: [
    { id: 11, question: "Uzoq davom etadigan yo'tal bormi?", ageGroup: "all" },
    {
      id: 12,
      question: "Nafas olishda qiyinchilik sezasizmi?",
      ageGroup: "all",
    },
  ],
  cancer: [
    {
      id: 13,
      question: "Oilangizda saraton kasalligi bo'lganmi?",
      ageGroup: "40+",
    },
    {
      id: 14,
      question: "Tana og'irligi sezilarli darajada kamayganmi?",
      ageGroup: "40+",
    },
  ],
};

exports.getScreeningQuestions = (age) => {
  const allQuestions = [];

  Object.keys(screeningQuestions).forEach((category) => {
    screeningQuestions[category].forEach((q) => {
      if (q.ageGroup === "all") {
        allQuestions.push({ ...q, category });
      } else if (q.ageGroup === "18+" && age >= 18) {
        allQuestions.push({ ...q, category });
      } else if (q.ageGroup === "40+" && age >= 40) {
        allQuestions.push({ ...q, category });
      }
    });
  });

  return allQuestions;
};

exports.evaluateScreening = (answers, age, weight, height) => {
  const results = [];
  const bmi = weight / (height / 100) ** 2;

  let diabetesRisk = 0;
  let hypertensionRisk = 0;
  let cardiovascularRisk = 0;
  let respiratoryRisk = 0;
  let cancerRisk = 0;

  answers.forEach((answer) => {
    if (answer.answer === "yes") {
      if (answer.questionId <= 4) diabetesRisk++;
      else if (answer.questionId <= 7) hypertensionRisk++;
      else if (answer.questionId <= 10) cardiovascularRisk++;
      else if (answer.questionId <= 12) respiratoryRisk++;
      else cancerRisk++;
    }
  });

  if (bmi > 30) diabetesRisk++;
  if (bmi > 25) cardiovascularRisk++;

  if (diabetesRisk >= 2) {
    results.push({
      disease: "Qandli diabet",
      risk: diabetesRisk >= 3 ? "Yuqori" : "O'rta",
      doctorType: "Endokrinolog",
      recommendations: "Qandni muntazam tekshiring, sog'lom ovqatlaning",
    });
  }

  if (hypertensionRisk >= 2) {
    results.push({
      disease: "Gipertoniya",
      risk: hypertensionRisk >= 3 ? "Yuqori" : "O'rta",
      doctorType: "Kardiolog",
      recommendations: "Qon bosimini muntazam o'lchang",
    });
  }

  if (cardiovascularRisk >= 2) {
    results.push({
      disease: "Yurak-qon tomir kasalliklari",
      risk: cardiovascularRisk >= 3 ? "Yuqori" : "O'rta",
      doctorType: "Kardiolog",
      recommendations: "EKG tekshiruvi o'tkazing",
    });
  }

  if (respiratoryRisk >= 1) {
    results.push({
      disease: "Nafas olish yo'llari kasalliklari",
      risk: "O'rta",
      doctorType: "Pulmonolog",
      recommendations: "O'pka tekshiruvi o'tkazing",
    });
  }

  if (cancerRisk >= 2 && age >= 40) {
    results.push({
      disease: "Saraton xavfi",
      risk: "O'rta",
      doctorType: "Onkolog",
      recommendations: "To'liq tekshiruv o'tkazing",
    });
  }

  return results;
};

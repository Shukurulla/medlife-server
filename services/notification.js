const User = require("../models/User");
const Medication = require("../models/Medication");
const axios = require("axios");

exports.sendMedicationReminders = async () => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour
      .toString()
      .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

    const medications = await Medication.find({
      active: true,
      reminderEnabled: true,
    }).populate("userId");

    for (const med of medications) {
      for (const time of med.times) {
        const [hour, minute] = time.split(":");
        const medTime = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

        const timeDiff =
          currentHour * 60 +
          currentMinute -
          (parseInt(hour) * 60 + parseInt(minute));

        if (timeDiff === 10) {
          const today = new Date().toISOString().split("T")[0];
          const taken = med.takenRecords.find(
            (r) =>
              r.date.toISOString().split("T")[0] === today &&
              r.time === time &&
              r.taken
          );

          if (!taken) {
            await User.findByIdAndUpdate(med.userId._id, {
              $push: {
                notifications: {
                  type: "medication",
                  message: `${med.name} ichish vaqti: ${time}. Iltimos, dori qabul qiling!`,
                  createdAt: new Date(),
                },
              },
            });
          }
        }

        if (timeDiff === 70) {
          const today = new Date().toISOString().split("T")[0];
          const taken = med.takenRecords.find(
            (r) =>
              r.date.toISOString().split("T")[0] === today &&
              r.time === time &&
              r.taken
          );

          if (!taken) {
            await Medication.findByIdAndUpdate(med._id, {
              $push: {
                takenRecords: {
                  date: new Date(),
                  time: time,
                  taken: false,
                },
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Dori eslatmalari xatosi:", error);
  }
};

exports.sendWeatherNotifications = async () => {
  try {
    const users = await User.find({ hasDiabetes: true });

    for (const user of users) {
      try {
        const weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${user.region}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );

        const temp = weatherResponse.data.main.temp;
        let message = "";

        if (temp > 30) {
          message =
            "Bugun havo juda issiq. Ko'proq suv iching va uzoq vaqt quyosh ostida yurmang. Qand darajangizni nazorat qiling.";
        } else if (temp < 10) {
          message =
            "Bugun havo sovuq. Harakatda bo'ling va iliq kiyining. Muntazam ovqatlaning va dori qabul qiling.";
        } else if (temp > 25) {
          message =
            "Bugun havo iliq. Suv ichishni unutmang va soyada dam oling.";
        }

        if (message) {
          await User.findByIdAndUpdate(user._id, {
            $push: {
              notifications: {
                type: "weather",
                message: message,
                createdAt: new Date(),
              },
            },
          });
        }
      } catch (err) {
        console.error(
          `Ob-havo ma'lumoti xatosi user ${user._id}:`,
          err.message
        );
      }
    }
  } catch (error) {
    console.error("Ob-havo eslatmalari xatosi:", error);
  }
};

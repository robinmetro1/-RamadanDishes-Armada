const axios = require("axios");

const ramadhanPrayerAPI =
  "https://api.aladhan.com/v1/hijriCalendar/1445/9?latitude=21.4225&longitude=39.8262&method=1";
const dishesAPI =
  "https://file.notion.so/f/f/29f0d547-e67d-414a-aece-c8e4f886f341/7c1daa75-3bea-4684-bf17-be07a0800452/dishes.json?id=bcc24a10-cc7d-4db2-8c82-f61773c06fc7&table=block&spaceId=29f0d547-e67d-414a-aece-c8e4f886f341&expirationTimestamp=1707336000000&signature=MuXaiXXqpRuhTp2DQoEGhLWnNc3Ca8GlQD1k9JSujR0&downloadName=dishes.json";

let dishesData;
let prayerData;

// async/await, you ensure that the code waits for the Axios requests to complete before proceeding further
async function fetchDishesData() {
  try {
    const response = await axios.get(dishesAPI);
    return response.data;
    // After fetching data, you can call functions or perform other operations that depend on this data
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
async function fetchPrayersData() {
  try {
    const response = await axios.get(ramadhanPrayerAPI);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
// Call fetchData function to fetch data

function getCooktimeMessage(cooktime) {
  if (cooktime >= 0) {
    return `${cooktime} minutes before Asr`;
  } else {
    return `${Math.abs(cooktime)} minutes after Asr`;
  }
}

function calculateStartTimeRelativeToAsr(duration, maghribMinutes, asrMinutes) {
  const timeRelativeToAsr = asrMinutes - (maghribMinutes - 15 - duration);
  return timeRelativeToAsr;
}

function getIngrendientsAndDurationforDish(searchedDishName) {
  for (const dish of dishesData) {
    if (dish.name.toLowerCase() === searchedDishName) {
      return { ingredients: dish.ingredients, dishDuration: dish.duration };
    }
  }
  console.log("Dish not found:", searchedDishName);
  return null; // Return null if the dish is not found
}

function convertTimeToMinutes(timeString) {
  let [time] = timeString.split(" ");
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

async function createIngredientToDishesMap() {
  let map = new Map();
  try {
    dishesData = await fetchDishesData();
  } catch (error) {
    console.error("Error fetching data in createIngredientToDishesMap:", error);
  }

  dishesData.forEach((dish) => {
    const ingredients = dish.ingredients;
    let dishName = dish.name.toLowerCase();

    ingredients.forEach((ingredient) => {
      ingredient = ingredient.toLowerCase();
      if (map.has(ingredient)) {
        // If yes, add the dish to the existing list
        const dishList = map.get(ingredient);
        dishList.push(dishName);
        map.set(ingredient, dishList);
      } else {
        // If no, create a new list with the dish
        map.set(ingredient, [dishName]);
      }
    });
  });
  return map;
}
async function getPrayerTimesofRequestedDay(requestedDay) {
  try {
    prayerData = await fetchPrayersData();
  } catch (error) {
    console.error(
      "Error fetching data in getPrayerTimesofRequestedDay:",
      error
    );
  }
  let maghribMinutes, asrMinutes;

  // Iterate through the prayer data
  prayerData.forEach((item) => {
    const hijriDay = item.date.hijri.day;

    // Check if the day matches the requested day
    if (hijriDay === requestedDay) {
      // Extract Maghrib and Asr timings
      maghribMinutes = convertTimeToMinutes(item.timings.Maghrib);
      asrMinutes = convertTimeToMinutes(item.timings.Asr);
    }
  });
  return { maghribMinutes: maghribMinutes, asrMinutes: asrMinutes };
}

// Define cooking time calculation function
function calculateCookingTime(foundDishes, maghribMinutes, asrMinutes) {
  const response = [];
  foundDishes.forEach((dish) => {
    let { ingredients, dishDuration } = getIngrendientsAndDurationforDish(dish);

    let cooktime = calculateStartTimeRelativeToAsr(
      dishDuration,
      maghribMinutes,
      asrMinutes
    );
    const cooktimeMessage = getCooktimeMessage(cooktime);
    response.push({
      name: dish,
      ingredients: ingredients,
      cooktime: cooktimeMessage,
    });
  });
  return response;
}
async function getSuggestedDish(difficulty, day) {
  try {
    dishesData = await fetchDishesData();
  } catch (error) {
    console.error("Error fetching data in createIngredientToDishesMap:", error);
  }

  const { maghribMinutes, asrMinutes } = await getPrayerTimesofRequestedDay(
    day
  );

  let availableDishes = [];
  switch (difficulty) {
    case "easy":
      availableDishes = dishesData.filter((dish) => dish.duration <= 30);
      break;
    case "medium":
      availableDishes = dishesData.filter(
        (dish) => dish.duration > 30 && dish.duration <= 120
      );
      break;
    case "hard":
      availableDishes = dishesData.filter((dish) => dish.duration > 120);
      break;
    default:
      return "Invalid difficulty level";
  }

  // Select a random dish from available dishes
  const randomIndex = Math.floor(Math.random() * availableDishes.length);
  const suggestedDish = availableDishes[randomIndex];
  const cooktime = calculateStartTimeRelativeToAsr(
    suggestedDish.duration,
    maghribMinutes,
    asrMinutes
  );
  const cooktimeMessage = getCooktimeMessage(cooktime);
  return {
    name: suggestedDish.name,
    ingredients: suggestedDish.ingredients,
    cooktime: cooktimeMessage,
  };
}

module.exports = {
  getPrayerTimesofRequestedDay: getPrayerTimesofRequestedDay,
  calculateCookingTime: calculateCookingTime,
  createIngredientToDishesMap: createIngredientToDishesMap,
  getSuggestedDish: getSuggestedDish,
};

const express = require("express")
const router = express.Router()
const fs = require('fs');
const axios = require('axios');

let dishesData ;
let prayerData;
let ingredientToDishesMap = new Map();

const ramadhanPrayerAPI = "https://api.aladhan.com/v1/hijriCalendar/1445/9?latitude=21.4225&longitude=39.8262&method=1";
const dishesAPI ="https://file.notion.so/f/f/29f0d547-e67d-414a-aece-c8e4f886f341/7c1daa75-3bea-4684-bf17-be07a0800452/dishes.json?id=bcc24a10-cc7d-4db2-8c82-f61773c06fc7&table=block&spaceId=29f0d547-e67d-414a-aece-c8e4f886f341&expirationTimestamp=1707242400000&signature=0X0Y0dr30wp6ZrOZvfPMsu9rt_iMkEUsx06Q_ChZdcs&downloadName=dishes.json";

axios.get(dishesAPI)
.then(response => {
    dishesData = response.data;
})
.catch(parseError => {
    console.error('Error parsing Dishes JSON data:', parseError);
});

axios.get(ramadhanPrayerAPI)
.then(response => {
    prayerData = response.data.data;
})
.catch(parseError => {
    console.error('Error parsing Prayer JSON data:', parseError);
});


function getPrayerTimesofRequestedDay(prayerData, requestedDay) {
    let maghribMinutes, asrMinutes;

            // Iterate through the prayer data
            prayerData.forEach(item => {
                const hijriDay = item.date.hijri.day;

                // Check if the day matches the requested day
                if (hijriDay === requestedDay) {
                    // Extract Maghrib and Asr timings
                    maghribMinutes = convertTimeToMinutes(item.timings.Maghrib);
                    asrMinutes = convertTimeToMinutes(item.timings.Asr);
                    
                }
            });

            //console.log("maghribMinutes:", maghribMinutes, "asrMinutes:", asrMinutes);
            return {  maghribMinutes , asrMinutes };
       
      
}


// Define cooking time calculation function
function calculateCookingTime(foundDishes, maghribMinutes, asrMinutes) {
    const response = [];
    foundDishes.forEach(dish=> {
        let {ingredients,dishDuration}  = getIngrendientsAndDurationforDish(dish);

        let cooktime= calculateStartTimeRelativeToAsr(dishDuration,maghribMinutes,asrMinutes);
        const cooktimeMessage = cooktime >= 0 ? `${cooktime} minutes before Asr` : `${Math.abs(cooktime)} minutes after Asr`;
        //console.log("cooktime:"+cooktime);
        response.push({
                    name : dish,
                    ingredients : ingredients,
                    cooktime : cooktimeMessage
            
        })
        
});
console.log("response:"+response);

return response;
    

} 

function calculateStartTimeRelativeToAsr(duration,maghribMinutes,asrMinutes){
    const timeRelativeToAsr = asrMinutes -  (maghribMinutes - 15 -duration) ;
    return timeRelativeToAsr;

}
function getIngrendientsAndDurationforDish(searchedDishName){
    for (const dish of dishesData) {
        if (dish.name.toLowerCase() === searchedDishName) {
            return { ingredients: dish.ingredients, dishDuration: dish.duration };
        }
    }
    console.log("Dish not found:", searchedDishName);
    return null; // Return null if the dish is not found

}


function convertTimeToMinutes(timeString) {
    let [time] = timeString.split(' '); 
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}


function createIngredientToDishesMap(){
    let map = new Map();
        dishesData.forEach(dish => {
            const ingredients = dish.ingredients;
            dishName =dish.name.toLowerCase();

            ingredients.forEach(ingredient => {
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
            })
        })
        return map;     
   
   

}
function getDishesData(){ return dishesData;}

function getPrayersData(){return prayerData;}

module.exports={
    getPrayerTimesofRequestedDay :getPrayerTimesofRequestedDay,
    calculateCookingTime :calculateCookingTime,
    getDishesData:getDishesData,
    getPrayersData:getPrayersData

}

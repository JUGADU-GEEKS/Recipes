const surprisebtn = document.querySelector("#surbtn");
async function randomID() {
    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/random?apiKey=360714145281430495860950c7dbe079&number=1`);
        const data = await response.json();

        console.log("API Response:", data); // Debugging: See full response

        if (data.recipes && data.recipes.length > 0) {
            return data.recipes[0].id;
        } else {
            console.error("No recipe found!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching recipe:", error);
        return null;
    }
}

surprisebtn.addEventListener("click", async (e) => {
    e.preventDefault(); // Prevent default anchor behavior

    const recipeID = await randomID();

    if (recipeID) {
        window.location.href = `/recipeDesc/?id=${recipeID}`;
    } else {
        alert("Failed to fetch recipe. Try again!"); // Alert if API fails
    }
});

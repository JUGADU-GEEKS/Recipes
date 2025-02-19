document.querySelectorAll(".recipe").forEach((recipe) => {
    recipe.addEventListener("click", () => {
        const recipeID = recipe.querySelector(".id").textContent.trim(); // Get ID from the clicked recipe
        window.location.href = `/recipeDesc?id=${recipeID}`; // Direct navigation to the recipe description page
    });
});

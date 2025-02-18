const add = document.body.querySelector(".add");
const tags = document.body.querySelector(".tags");
const submit = document.body.querySelector(".submit");
const ingredients = []; 

add.onclick = () => {
    const input = document.body.querySelector("input");
    const value = input.value.trim();

    if (value && !ingredients.includes(value)) { 
        ingredients.push(value); 

        const tag = document.createElement("div");
        tag.className = "tag";
        tag.innerHTML = `${value} <img class="cross" src="/images/cross.png" alt="">`;

        tags.appendChild(tag);
        input.value = "";

        const cross = tag.querySelector(".cross");
        cross.onclick = () => {
            tags.removeChild(tag);
            const index = ingredients.indexOf(value);
            if (index > -1) {
                ingredients.splice(index, 1);
            }
        };
    }
};

submit.addEventListener("click", async (event) => {
    event.preventDefault();

    try {
        const response = await fetch("/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ingredients }),
        });

        if (response.redirected) {
            window.location.href = response.url; // Redirect to the new page
        } else {
            console.error("No redirection occurred, check server response.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
});


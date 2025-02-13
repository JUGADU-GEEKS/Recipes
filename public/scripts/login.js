let eye = document.body.querySelector("#eye");
let inp = document.body.querySelector(".pass");

eye.onclick = () => {
    if (inp.getAttribute("type") === "password") {
        inp.setAttribute("type", "text");  // Corrected syntax
        eye.setAttribute("src", "/images/show.png");  // Corrected syntax
    } else {
        inp.setAttribute("type", "password");  // Corrected syntax
        eye.setAttribute("src", "/images/eye.png");  // Corrected syntax
    }
};

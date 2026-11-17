const formulaire = document.getElementById("formulaire-connexion");
const message = document.getElementById("message");

formulaire.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const motDePasse = document.getElementById("mot-de-passe").value;

    try {
        const reponse = await fetch("/api/admin/connexion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, motDePasse })
        });

        const resultat = await reponse.json();

        if (!reponse.ok) {
            message.textContent = resultat.message;
            return;
        }

        window.location.href = "/admin.html";

    } catch (erreur) {
        message.textContent = "Impossible de contacter le serveur.";
    }
});
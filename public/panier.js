


/* =================================
   1. RÉCUPÉRER LE PANIER
================================= */

let panier = JSON.parse(localStorage.getItem("panier")) || [];


/* =================================
   2. AFFICHER LE PANIER
================================= */

function afficherPanier() {

    const contenuPanier = document.getElementById("contenu-panier");
    const totalPanier = document.getElementById("total-panier");

    contenuPanier.innerHTML = "";

    // Vérifier si le panier est vide
    if (panier.length === 0) {

        contenuPanier.innerHTML = `
            <p class="text-center text-muted">
                Votre panier est vide pour le moment.
            </p>
        `;

        totalPanier.textContent = "0 FCFA";
        return;
    }

    let total = 0;

    panier.forEach((produit, index) => {

        let sousTotal = produit.prix * produit.quantite;
        total += sousTotal;

        contenuPanier.innerHTML += `
            <div class="d-flex justify-content-between align-items-center
                        flex-wrap gap-3 mb-4">

                <div>
                    <h5 class="fw-bold mb-1">
                        ${produit.nom}
                    </h5>

                    <p class="text-muted mb-0">
                        ${produit.prix} FCFA l'unité
                    </p>
                </div>

                <div class="d-flex align-items-center gap-2">

                    <button class="btn btn-outline-dark btn-sm"
                        data-action="diminuer"
                        data-index="${index}">
                        -
                    </button>

                    <span class="fw-bold">
                        ${produit.quantite}
                    </span>

                    <button class="btn btn-outline-dark btn-sm"
                        data-action="augmenter"
                        data-index="${index}">
                        +
                    </button>

                </div>

                <div class="text-end">

                    <p class="fw-bold mb-1">
                        ${sousTotal} FCFA
                    </p>

                    <button class="btn btn-link text-danger p-0"
                        data-action="supprimer"
                        data-index="${index}">
                        Supprimer
                    </button>

                </div>

            </div>

            <hr>
        `;
    });

    totalPanier.textContent = total + " FCFA";
}


/* =================================
   3. GÉRER LES BOUTONS
================================= */

document.getElementById("contenu-panier").addEventListener("click", function(event) {

    const bouton = event.target.closest("button[data-action]");

    if (!bouton) return;

    const index = Number(bouton.dataset.index);
    const action = bouton.dataset.action;

    if (action === "augmenter") {
        panier[index].quantite++;
    }

    if (action === "diminuer") {

        panier[index].quantite--;

        if (panier[index].quantite <= 0) {
            panier.splice(index, 1);
        }
    }

    if (action === "supprimer") {
        panier.splice(index, 1);
    }

    // Enregistrer les modifications
    localStorage.setItem("panier", JSON.stringify(panier));

    // Actualiser l'affichage
    afficherPanier();

});


/* =================================
   4. AFFICHER LE PANIER AU CHARGEMENT
================================= */

afficherPanier();



/* =================================
   5. COMMANDER SUR WHATSAPP
================================= */

function commanderWhatsApp() {

    if (panier.length === 0) {
        alert("Votre panier est vide !");
        return;
    }

    const numeroWhatsApp = "2250170631187";

    let message = "Bonjour THE SNACK SPOT ! Je souhaite commander :\n\n";

    let total = 0;

    panier.forEach(produit => {

        let sousTotal = produit.prix * produit.quantite;

        message += `${produit.nom} x ${produit.quantite} = ${sousTotal} FCFA\n`;

        total += sousTotal;

    });

    message += `\nTOTAL : ${total} FCFA`;
    message += "\n\nMerci !";

    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
}
